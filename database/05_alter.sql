-- ePlače 2026 — Migracijska skripta 05
-- Poženi PO 01_schema.sql + 02_rls.sql na obstoječi bazi
-- Varna za ponovno zaganjanje (vse spremembe so zaščitene z IF NOT EXISTS)

USE eplace2026;
GO

-- ============================================================
-- 1. NOVE KOLUMNE: dbo.employees
-- ============================================================

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.employees') AND name = 'aktivno'
)
BEGIN
  -- Temporal tables ne dovolijo ADD COLUMN direktno — treba izklopiti SYSTEM_VERSIONING
  ALTER TABLE dbo.employees SET (SYSTEM_VERSIONING = OFF);
  ALTER TABLE dbo.employees ADD aktivno BIT NOT NULL DEFAULT 1;
  ALTER TABLE dbo.employees_History ADD aktivno BIT NOT NULL DEFAULT 1;
  ALTER TABLE dbo.employees SET (
    SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.employees_History)
  );
  PRINT 'employees.aktivno dodano.';
END
ELSE
  PRINT 'employees.aktivno ze obstaja.';
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.employees') AND name = 'datum_zaposlitve'
)
BEGIN
  ALTER TABLE dbo.employees SET (SYSTEM_VERSIONING = OFF);
  ALTER TABLE dbo.employees ADD datum_zaposlitve DATE NOT NULL DEFAULT GETDATE();
  ALTER TABLE dbo.employees_History ADD datum_zaposlitve DATE NOT NULL DEFAULT GETDATE();
  ALTER TABLE dbo.employees SET (
    SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.employees_History)
  );
  PRINT 'employees.datum_zaposlitve dodano.';
END
ELSE
  PRINT 'employees.datum_zaposlitve ze obstaja.';
GO

-- ============================================================
-- 2. NOVE KOLUMNE: dbo.payroll_runs
-- ============================================================

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.payroll_runs') AND name = 'napaka_opis'
)
BEGIN
  ALTER TABLE dbo.payroll_runs ADD napaka_opis NVARCHAR(500) NULL;
  PRINT 'payroll_runs.napaka_opis dodano.';
END
ELSE
  PRINT 'payroll_runs.napaka_opis ze obstaja.';
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.payroll_runs') AND name = 'zakljucen_ob'
)
BEGIN
  ALTER TABLE dbo.payroll_runs ADD zakljucen_ob DATETIME2 NULL;
  PRINT 'payroll_runs.zakljucen_ob dodano.';
END
ELSE
  PRINT 'payroll_runs.zakljucen_ob ze obstaja.';
GO

-- ============================================================
-- 3. NOVA KOLUMNA: dbo.job_positions
-- ============================================================

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.job_positions') AND name = 'aktivno'
)
BEGIN
  ALTER TABLE dbo.job_positions SET (SYSTEM_VERSIONING = OFF);
  ALTER TABLE dbo.job_positions ADD aktivno BIT NOT NULL DEFAULT 1;
  ALTER TABLE dbo.job_positions_History ADD aktivno BIT NOT NULL DEFAULT 1;
  ALTER TABLE dbo.job_positions SET (
    SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.job_positions_History)
  );
  PRINT 'job_positions.aktivno dodano.';
END
ELSE
  PRINT 'job_positions.aktivno ze obstaja.';
GO

-- ============================================================
-- 4. UNIKATNI INDEKS: payroll_lines(payroll_run_id, employee_id)
-- ============================================================

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'UX_pl_run_emp'
  AND object_id = OBJECT_ID('dbo.payroll_lines')
)
BEGIN
  CREATE UNIQUE INDEX UX_pl_run_emp
    ON dbo.payroll_lines (payroll_run_id, employee_id);
  PRINT 'UX_pl_run_emp indeks dodan.';
END
ELSE
  PRINT 'UX_pl_run_emp ze obstaja.';
GO

-- ============================================================
-- 5. RLS — DODAJ users IN job_positions V POLITIKO
-- ============================================================

-- OPOMBA: ALTER SECURITY POLICY ADD PREDICATE bo vrgel napako ce predikat
-- ze obstaja. Vsako dodajanje je zapakirano v TRY/CATCH za varno ponovitev.

-- OPOMBA: users tabela NIMA FILTER predikata — login endpoint mora brati
-- vse vrstice po emailu brez tenant konteksta. BLOCK predikata zadostujeta.

BEGIN TRY
  ALTER SECURITY POLICY dbo.EmployeeRLSPolicy
    ADD BLOCK PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.users AFTER INSERT;
  PRINT 'RLS BLOCK AFTER INSERT dodan na users.';
END TRY
BEGIN CATCH
  PRINT 'RLS BLOCK AFTER INSERT na users ze obstaja (preskoceno).';
END CATCH;
GO

BEGIN TRY
  ALTER SECURITY POLICY dbo.EmployeeRLSPolicy
    ADD BLOCK PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.users AFTER UPDATE;
  PRINT 'RLS BLOCK AFTER UPDATE dodan na users.';
END TRY
BEGIN CATCH
  PRINT 'RLS BLOCK AFTER UPDATE na users ze obstaja (preskoceno).';
END CATCH;
GO

BEGIN TRY
  ALTER SECURITY POLICY dbo.EmployeeRLSPolicy
    ADD FILTER PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.job_positions;
  PRINT 'RLS FILTER dodan na job_positions.';
END TRY
BEGIN CATCH
  PRINT 'RLS FILTER na job_positions ze obstaja (preskoceno).';
END CATCH;
GO

BEGIN TRY
  ALTER SECURITY POLICY dbo.EmployeeRLSPolicy
    ADD BLOCK PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.job_positions AFTER INSERT;
  PRINT 'RLS BLOCK AFTER INSERT dodan na job_positions.';
END TRY
BEGIN CATCH
  PRINT 'RLS BLOCK AFTER INSERT na job_positions ze obstaja (preskoceno).';
END CATCH;
GO

BEGIN TRY
  ALTER SECURITY POLICY dbo.EmployeeRLSPolicy
    ADD BLOCK PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.job_positions AFTER UPDATE;
  PRINT 'RLS BLOCK AFTER UPDATE dodan na job_positions.';
END TRY
BEGIN CATCH
  PRINT 'RLS BLOCK AFTER UPDATE na job_positions ze obstaja (preskoceno).';
END CATCH;
GO

-- ============================================================
-- 6. RLS — DODAJ AFTER UPDATE BLOKE NA VSE OBSTOJEČE TABELE
-- ============================================================

BEGIN TRY
  ALTER SECURITY POLICY dbo.EmployeeRLSPolicy
    ADD BLOCK PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.employees AFTER UPDATE;
  PRINT 'RLS BLOCK AFTER UPDATE dodan na employees.';
END TRY
BEGIN CATCH
  PRINT 'RLS BLOCK AFTER UPDATE na employees ze obstaja (preskoceno).';
END CATCH;
GO

BEGIN TRY
  ALTER SECURITY POLICY dbo.EmployeeRLSPolicy
    ADD BLOCK PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.monthly_hours AFTER UPDATE;
  PRINT 'RLS BLOCK AFTER UPDATE dodan na monthly_hours.';
END TRY
BEGIN CATCH
  PRINT 'RLS BLOCK AFTER UPDATE na monthly_hours ze obstaja (preskoceno).';
END CATCH;
GO

BEGIN TRY
  ALTER SECURITY POLICY dbo.EmployeeRLSPolicy
    ADD BLOCK PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.payroll_runs AFTER UPDATE;
  PRINT 'RLS BLOCK AFTER UPDATE dodan na payroll_runs.';
END TRY
BEGIN CATCH
  PRINT 'RLS BLOCK AFTER UPDATE na payroll_runs ze obstaja (preskoceno).';
END CATCH;
GO

BEGIN TRY
  ALTER SECURITY POLICY dbo.EmployeeRLSPolicy
    ADD BLOCK PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.payroll_lines AFTER UPDATE;
  PRINT 'RLS BLOCK AFTER UPDATE dodan na payroll_lines.';
END TRY
BEGIN CATCH
  PRINT 'RLS BLOCK AFTER UPDATE na payroll_lines ze obstaja (preskoceno).';
END CATCH;
GO

BEGIN TRY
  ALTER SECURITY POLICY dbo.EmployeeRLSPolicy
    ADD BLOCK PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.audit_logs AFTER UPDATE;
  PRINT 'RLS BLOCK AFTER UPDATE dodan na audit_logs.';
END TRY
BEGIN CATCH
  PRINT 'RLS BLOCK AFTER UPDATE na audit_logs ze obstaja (preskoceno).';
END CATCH;
GO

-- ============================================================
-- 7. VERIFIKACIJA — preveri da so vse spremembe prisotne
-- ============================================================

SELECT
  t.name AS tabela,
  c.name AS kolumna,
  tp.name AS tip
FROM sys.columns c
JOIN sys.tables t ON t.object_id = c.object_id
JOIN sys.types tp ON tp.user_type_id = c.user_type_id
WHERE
  (t.name = 'employees'     AND c.name IN ('aktivno', 'datum_zaposlitve'))
  OR (t.name = 'payroll_runs' AND c.name IN ('napaka_opis', 'zakljucen_ob'))
  OR (t.name = 'job_positions' AND c.name = 'aktivno')
ORDER BY t.name, c.name;

SELECT
  sp.name AS politika,
  OBJECT_NAME(spp.major_id) AS tabela,
  spp.predicate_type_desc AS tip_predikata
FROM sys.security_policies sp
JOIN sys.security_predicates spp ON spp.object_id = sp.object_id
ORDER BY tabela, tip_predikata;

PRINT '';
PRINT '✅ Migracija 05 uspesno zakljucena.';
