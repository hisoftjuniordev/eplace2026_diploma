-- ePlače 2026 — Dual-Mode Payroll: schema & parameter razširitev
-- Poženi: sqlcmd -S localhost -U sa -P <geslo> -d eplace2026 -i 07_alter2.sql

USE eplace2026;
GO

-- ── 1. EMPLOYEES: urna postavka za parametrični način (Mode B) ──────────────
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.employees') AND name = 'urna_postavka'
)
  ALTER TABLE dbo.employees
    ADD urna_postavka DECIMAL(10,4) NULL;
GO

-- Relaxiraj CHECK: bruto_osnova > 0 OR urna_postavka > 0 (ne oboje 0)
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_emp_bruto')
  ALTER TABLE dbo.employees DROP CONSTRAINT CK_emp_bruto;
GO
ALTER TABLE dbo.employees
  ADD CONSTRAINT CK_emp_salary_mode
  CHECK (bruto_osnova > 0 OR (urna_postavka IS NOT NULL AND urna_postavka > 0));
GO

-- ── 2. MONTHLY_HOURS: dopustne in bolniške ure ───────────────────────────────
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.monthly_hours') AND name = 'm04_dopust_ure'
)
  ALTER TABLE dbo.monthly_hours
    ADD m04_dopust_ure   INT NOT NULL DEFAULT 0,
        m05_bolniske_ure INT NOT NULL DEFAULT 0;
GO

-- ── 3. PAYROLL_LINES: razčlenitev za listek (samo Mode B, sicer NULL) ────────
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.payroll_lines') AND name = 'm01_redno_znesek'
)
  ALTER TABLE dbo.payroll_lines
    ADD m01_redno_znesek    DECIMAL(10,2) NULL,
        m04_dopust_znesek   DECIMAL(10,2) NULL,
        m05_bolniska_znesek DECIMAL(10,2) NULL;
GO

-- ── 4. PAYROLL_PARAMS: 5 novih parametrov (zakonska podlaga) ─────────────────

-- MINIMALNA_PLACA — ZMinP, Ur. l. RS št. 6, 30. 1. 2026
IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'MINIMALNA_PLACA' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('MINIMALNA_PLACA', '1481.88',
          'Minimalna mesečna bruto plača 2026 (ZMinP, Ur. l. RS 6/2026)', '2026-01-01');

-- MINIMALNA_URNA_POSTAVKA — ZMinP (izpeljano: 1481.88 / 173.08 h)
IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'MINIMALNA_URNA_POSTAVKA' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('MINIMALNA_URNA_POSTAVKA', '8.56',
          'Minimalna bruto urna postavka 2026 — ZMinP (izpeljano)', '2026-01-01');

-- BOLNISKA_FAKTOR_DEL — ZDR-1, 137. člen/3 (0–30 dni, breme delodajalca)
IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'BOLNISKA_FAKTOR_DEL' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('BOLNISKA_FAKTOR_DEL', '0.80',
          'Stopnja nadomestila bolniške — delodajalec, dnevi 1–30 (ZDR-1 137/3)', '2026-01-01');

-- NADURE_FAKTOR — ZDR-1, 127.–128., 144. člen (min. 30% dodatek)
IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'NADURE_FAKTOR' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('NADURE_FAKTOR', '1.30',
          'Množitelj nadurnega dela — min. zakonski (ZDR-1 127–128, 144)', '2026-01-01');

-- DOPUST_FAKTOR — ZDR-1, 137. člen/9 (polna osnova)
IF NOT EXISTS (SELECT 1 FROM dbo.payroll_params WHERE kljuc = 'DOPUST_FAKTOR' AND veljavno_od = '2026-01-01')
  INSERT INTO dbo.payroll_params (kljuc, vrednost, opis, veljavno_od)
  VALUES ('DOPUST_FAKTOR', '1.00',
          'Faktor nadomestila za letni dopust — polna osnova (ZDR-1 137/9)', '2026-01-01');
GO

PRINT '07_alter2.sql: dual-mode shema in parametri OK';
GO
