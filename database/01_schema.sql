-- ePlače 2026 — Shema baze
-- Poženi kot: sqlcmd -S localhost -U sa -P <geslo> -i 01_schema.sql

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'eplace2026')
  CREATE DATABASE eplace2026;
GO

USE eplace2026;
GO

-- Tenants (podjetja)
IF OBJECT_ID('dbo.tenants') IS NULL
CREATE TABLE dbo.tenants (
  id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  naziv_podjetja   NVARCHAR(150)    NOT NULL,
  davcna_stevilka  VARCHAR(8)       NOT NULL UNIQUE,
  maticna_stevilka VARCHAR(10)      NOT NULL,
  naslov           NVARCHAR(150)    NOT NULL,
  kraj             NVARCHAR(100)    NOT NULL,
  posta            VARCHAR(10)      NOT NULL,
  iban             VARCHAR(34)      NOT NULL,
  ustvarjen_ob     DATETIME2        NOT NULL DEFAULT GETDATE(),
  CONSTRAINT CK_tenants_davcna CHECK (LEN(davcna_stevilka) = 8)
);
GO

-- Users
IF OBJECT_ID('dbo.users') IS NULL
CREATE TABLE dbo.users (
  id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  tenant_id   UNIQUEIDENTIFIER NOT NULL,
  email       NVARCHAR(100)    NOT NULL UNIQUE,
  geslo_hash  VARCHAR(255)     NOT NULL,
  ime         NVARCHAR(50)     NOT NULL,
  priimek     NVARCHAR(50)     NOT NULL,
  vloga       VARCHAR(20)      NOT NULL DEFAULT 'Uporabnik',
  aktivno     BIT              NOT NULL DEFAULT 1,
  ustvarjen_ob DATETIME2       NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_users_tenant FOREIGN KEY (tenant_id) REFERENCES dbo.tenants(id) ON DELETE CASCADE,
  CONSTRAINT CK_users_vloga CHECK (vloga IN ('SistemskiAdmin','Skrbnik','Uporabnik'))
);
GO

-- Job positions (bo temporal — SYSTEM_VERSIONING se doda v 03_temporal.sql)
IF OBJECT_ID('dbo.job_positions') IS NULL
CREATE TABLE dbo.job_positions (
  id                       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  tenant_id                UNIQUEIDENTIFIER NOT NULL,
  naziv_delovnega_mesta    NVARCHAR(100)    NOT NULL,
  tarifni_razred           INT              NOT NULL,
  zahtevana_izobrazba      NVARCHAR(50)     NULL,
  SysStartTime             DATETIME2        GENERATED ALWAYS AS ROW START NOT NULL,
  SysEndTime               DATETIME2        GENERATED ALWAYS AS ROW END   NOT NULL,
  PERIOD FOR SYSTEM_TIME (SysStartTime, SysEndTime),
  CONSTRAINT FK_jobpos_tenant FOREIGN KEY (tenant_id) REFERENCES dbo.tenants(id),
  CONSTRAINT CK_jobpos_razred CHECK (tarifni_razred BETWEEN 1 AND 9)
)
WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.job_positions_History));
GO

-- Employees (bo temporal — SYSTEM_VERSIONING se doda v 03_temporal.sql)
IF OBJECT_ID('dbo.employees') IS NULL
CREATE TABLE dbo.employees (
  id                           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  tenant_id                    UNIQUEIDENTIFIER NOT NULL,
  job_position_id              UNIQUEIDENTIFIER NULL,
  ime                          NVARCHAR(50)     NOT NULL,
  priimek                      NVARCHAR(50)     NOT NULL,
  davcna_stevilka              VARCHAR(8)       NOT NULL,
  emso                         VARCHAR(13)      NOT NULL,
  trr                          VARCHAR(34)      NOT NULL,
  naslov                       NVARCHAR(150)    NULL,
  kraj                         NVARCHAR(100)    NULL,
  posta                        VARCHAR(10)      NULL,
  bruto_osnova                 DECIMAL(10,2)    NOT NULL,
  a004_rezident                CHAR(1)          NOT NULL DEFAULT 'R',
  a014_invalid_nad_kvoto       BIT              NOT NULL DEFAULT 0,
  a017_starost_60_let          BIT              NOT NULL DEFAULT 0,
  a031_zavezanec_ozp           BIT              NOT NULL DEFAULT 1,
  glavni_delodajalec           BIT              NOT NULL DEFAULT 1,
  olajsava_vzdrzevani_znesek   DECIMAL(10,2)    NOT NULL DEFAULT 0,
  b014_has_vozilo              BIT              NOT NULL DEFAULT 0,
  b014_vozilo_nv               DECIMAL(10,2)    NULL,
  b014_vozilo_gorivo           BIT              NOT NULL DEFAULT 0,
  b014_vozilo_el               BIT              NOT NULL DEFAULT 0,
  SysStartTime                 DATETIME2        GENERATED ALWAYS AS ROW START NOT NULL,
  SysEndTime                   DATETIME2        GENERATED ALWAYS AS ROW END   NOT NULL,
  PERIOD FOR SYSTEM_TIME (SysStartTime, SysEndTime),
  CONSTRAINT FK_emp_tenant  FOREIGN KEY (tenant_id) REFERENCES dbo.tenants(id),
  CONSTRAINT FK_emp_jobpos  FOREIGN KEY (job_position_id) REFERENCES dbo.job_positions(id),
  CONSTRAINT CK_emp_rezident CHECK (a004_rezident IN ('R','N')),
  CONSTRAINT CK_emp_bruto   CHECK (bruto_osnova > 0),
  CONSTRAINT CK_emp_davcna  CHECK (LEN(davcna_stevilka) = 8),
  CONSTRAINT CK_emp_emso    CHECK (LEN(emso) = 13)
)
WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.employees_History));
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_emp_davcna' AND object_id=OBJECT_ID('dbo.employees'))
  CREATE UNIQUE INDEX UX_emp_davcna ON dbo.employees (tenant_id, davcna_stevilka);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_emp_emso' AND object_id=OBJECT_ID('dbo.employees'))
  CREATE UNIQUE INDEX UX_emp_emso   ON dbo.employees (tenant_id, emso);
GO

-- Monthly hours
IF OBJECT_ID('dbo.monthly_hours') IS NULL
CREATE TABLE dbo.monthly_hours (
  id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  tenant_id       UNIQUEIDENTIFIER NOT NULL,
  employee_id     UNIQUEIDENTIFIER NOT NULL,
  leto            INT              NOT NULL,
  mesec           INT              NOT NULL,
  m01_redno_ure   INT              NOT NULL DEFAULT 0,
  m02_refund_ure  INT              NOT NULL DEFAULT 0,
  m03_nadure_ure  INT              NOT NULL DEFAULT 0,
  m06_odsot_ure   INT              NOT NULL DEFAULT 0,
  m07_preh_dnevi  INT              NOT NULL DEFAULT 0,
  m07_prevoz_km   DECIMAL(5,2)     NOT NULL DEFAULT 0,
  odtegljaji_kred DECIMAL(10,2)    NOT NULL DEFAULT 0,
  CONSTRAINT FK_mh_tenant   FOREIGN KEY (tenant_id)   REFERENCES dbo.tenants(id),
  CONSTRAINT FK_mh_employee FOREIGN KEY (employee_id) REFERENCES dbo.employees(id) ON DELETE CASCADE,
  CONSTRAINT CK_mh_mesec    CHECK (mesec BETWEEN 1 AND 12)
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_mh_emp_mesec' AND object_id=OBJECT_ID('dbo.monthly_hours'))
  CREATE UNIQUE INDEX UX_mh_emp_mesec ON dbo.monthly_hours (employee_id, leto, mesec);
GO

-- Payroll runs
IF OBJECT_ID('dbo.payroll_runs') IS NULL
CREATE TABLE dbo.payroll_runs (
  id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  tenant_id        UNIQUEIDENTIFIER NOT NULL,
  leto             INT              NOT NULL,
  mesec            INT              NOT NULL,
  datum_izplacila  DATE             NOT NULL,
  status_obracuna  VARCHAR(20)      NOT NULL DEFAULT 'Osnutek',
  progress_procent INT              NOT NULL DEFAULT 0,
  ustvarjen_ob     DATETIME2        NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_pr_tenant FOREIGN KEY (tenant_id) REFERENCES dbo.tenants(id),
  CONSTRAINT CK_pr_status   CHECK (status_obracuna IN ('Osnutek','Procesiranje','Zakljucen','Napaka')),
  CONSTRAINT CK_pr_progress CHECK (progress_procent BETWEEN 0 AND 100),
  CONSTRAINT CK_pr_mesec    CHECK (mesec BETWEEN 1 AND 12)
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_pr_tenant_mesec' AND object_id=OBJECT_ID('dbo.payroll_runs'))
  CREATE UNIQUE INDEX UX_pr_tenant_mesec ON dbo.payroll_runs (tenant_id, leto, mesec);
GO

-- Payroll lines
IF OBJECT_ID('dbo.payroll_lines') IS NULL
CREATE TABLE dbo.payroll_lines (
  id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  tenant_id             UNIQUEIDENTIFIER NOT NULL,
  payroll_run_id        UNIQUEIDENTIFIER NOT NULL,
  employee_id           UNIQUEIDENTIFIER NOT NULL,
  bruto_1               DECIMAL(10,2)    NOT NULL,
  boniteta_b014         DECIMAL(10,2)    NOT NULL DEFAULT 0,
  a071_piz_del          DECIMAL(10,2)    NOT NULL,
  a072_zz_del           DECIMAL(10,2)    NOT NULL,
  a072a_ozp_del         DECIMAL(10,2)    NOT NULL DEFAULT 35.00,
  a072b_do_del          DECIMAL(10,2)    NOT NULL,
  a073_star_del         DECIMAL(10,2)    NOT NULL,
  a074_zap_del          DECIMAL(10,2)    NOT NULL,
  davcna_osnova         DECIMAL(10,2)    NOT NULL,
  dohodnina             DECIMAL(10,2)    NOT NULL,
  neto_pred_ozp         DECIMAL(10,2)    NOT NULL,
  neto_po_ozp           DECIMAL(10,2)    NOT NULL,
  m07_prehrana          DECIMAL(10,2)    NOT NULL DEFAULT 0,
  m07_prevoz            DECIMAL(10,2)    NOT NULL DEFAULT 0,
  odtegljaji_kredit     DECIMAL(10,2)    NOT NULL DEFAULT 0,
  koncno_izplacilo_trr  DECIMAL(10,2)    NOT NULL,
  a081_piz_del_adr      DECIMAL(10,2)    NOT NULL,
  a082_do_del_adr       DECIMAL(10,2)    NOT NULL,
  a083_zz_del_adr       DECIMAL(10,2)    NOT NULL,
  a084_zap_del_adr      DECIMAL(10,2)    NOT NULL,
  a085_star_del_adr     DECIMAL(10,2)    NOT NULL,
  a086_posk_del_adr     DECIMAL(10,2)    NOT NULL,
  bruto_2_strosek       DECIMAL(10,2)    NOT NULL,
  CONSTRAINT FK_pl_tenant  FOREIGN KEY (tenant_id)      REFERENCES dbo.tenants(id),
  CONSTRAINT FK_pl_run     FOREIGN KEY (payroll_run_id) REFERENCES dbo.payroll_runs(id) ON DELETE CASCADE,
  CONSTRAINT FK_pl_emp     FOREIGN KEY (employee_id)    REFERENCES dbo.employees(id)
);
GO

-- Audit logs
IF OBJECT_ID('dbo.audit_logs') IS NULL
CREATE TABLE dbo.audit_logs (
  id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  tenant_id   UNIQUEIDENTIFIER NOT NULL,
  user_email  NVARCHAR(100)    NOT NULL,
  akcija      VARCHAR(20)      NOT NULL,
  entiteta    VARCHAR(50)      NOT NULL,
  opis        NVARCHAR(255)    NULL,
  ip_naslov   VARCHAR(45)      NULL,
  ustvarjen_ob DATETIME2       NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_al_tenant FOREIGN KEY (tenant_id) REFERENCES dbo.tenants(id),
  CONSTRAINT CK_al_akcija CHECK (akcija IN ('BRANJE','VNOS','POPRAVEK','BRISANJE','IZVOZ'))
);
GO

PRINT 'Schema created successfully.';
