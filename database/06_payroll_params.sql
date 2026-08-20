-- ePlače 2026 — Tabela parametrov obračuna plač
-- Poženi: sqlcmd -S localhost -U sa -P <geslo> -d eplace2026 -i 06_payroll_params.sql

USE eplace2026;
GO

IF OBJECT_ID('dbo.payroll_params') IS NULL
CREATE TABLE dbo.payroll_params (
  id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  kljuc           VARCHAR(50)      NOT NULL,
  vrednost        NVARCHAR(2000)   NOT NULL,
  opis            NVARCHAR(300)    NOT NULL,
  veljavno_od     DATE             NOT NULL,
  veljavno_do     DATE             NULL,
  ustvarjen_ob    DATETIME2        NOT NULL DEFAULT GETDATE(),
  posodobljen_ob  DATETIME2        NOT NULL DEFAULT GETDATE(),
  CONSTRAINT UQ_payroll_params_kljuc_od UNIQUE (kljuc, veljavno_od)
);
GO

-- Seed: vrednosti za leto 2026
-- Prispevni stopnji delavca
IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_PIZ_DEL' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_PIZ_DEL', '0.1550', 'Prispevek delavca za PIZ (15.50%)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_ZZ_DEL' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_ZZ_DEL', '0.0636', 'Prispevek delavca za ZZ (6.36%)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_ZAP_DEL' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_ZAP_DEL', '0.0014', 'Prispevek delavca za zavarovanje za primer brezposelnosti (0.14%)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_STAR_DEL' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_STAR_DEL', '0.0010', 'Prispevek delavca za starševsko varstvo (0.10%)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_DO_DEL' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_DO_DEL', '0.0100', 'Prispevek delavca za dolgotrajno oskrbo (1.00%)', '2026-01-01');

-- Prispevni stopnji delodajalca
IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_PIZ_ADR' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_PIZ_ADR', '0.0885', 'Prispevek delodajalca za PIZ (8.85%)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_ZZ_ADR' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_ZZ_ADR', '0.0656', 'Prispevek delodajalca za ZZ (6.56%)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_ZAP_ADR' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_ZAP_ADR', '0.0006', 'Prispevek delodajalca za zavarovanje za primer brezposelnosti (0.06%)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_STAR_ADR' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_STAR_ADR', '0.0010', 'Prispevek delodajalca za starševsko varstvo (0.10%)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_POSK_ADR' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_POSK_ADR', '0.0053', 'Prispevek delodajalca za poškodbe pri delu (0.53%)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'STOPNJA_DO_ADR' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('STOPNJA_DO_ADR', '0.0100', 'Prispevek delodajalca za dolgotrajno oskrbo (1.00%)', '2026-01-01');

-- Fiksni odtegljaji in olajšave
IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'OZP_MESECNI' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('OZP_MESECNI', '35.00', 'Mesečni odtegljaj za OZP (€)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'SPLOSNA_OLAJSAVA' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('SPLOSNA_OLAJSAVA', '416.67', 'Splošna dohodninska olajšava na mesec (€)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'PREHRANA_DNEVNA_MEJA' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('PREHRANA_DNEVNA_MEJA', '7.96', 'Davčna meja povračila stroškov prehrane na dan (€)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'PREVOZ_KM_MEJA' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('PREVOZ_KM_MEJA', '0.21', 'Davčna meja povračila prevoza na km (€)', '2026-01-01');

IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'POLNI_MESEC_URE' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('POLNI_MESEC_URE', '168', 'Ure polnega delovnega meseca za pro-rata izračun', '2026-01-01');

-- Dohodninska lestvica 2026 (mesečne vrednosti)
-- Razredi: od, do (null=ni zgornje meje), stopnja, fiksni
IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'DOHODNINSKA_LESTVICA' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('DOHODNINSKA_LESTVICA',
    '[{"od":0,"do":728.31,"stopnja":0.16,"fiksni":0},{"od":728.31,"do":1260.40,"stopnja":0.26,"fiksni":116.53},{"od":1260.40,"do":2083.33,"stopnja":0.33,"fiksni":254.87},{"od":2083.33,"do":6416.67,"stopnja":0.39,"fiksni":526.43},{"od":6416.67,"do":null,"stopnja":0.50,"fiksni":2216.43}]',
    'Dohodninska lestvica — mesečne vrednosti (JSON)', '2026-01-01');
GO

PRINT 'payroll_params: tabela in seed podatki OK';
GO
