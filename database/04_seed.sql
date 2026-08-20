-- ePlače 2026 — Testni podatki (SQL seed)
-- Za gesla/bcrypt: cd backend && npm run seed
-- Ta datoteka vsebuje vse razen uporabnikov (ker bcrypt zahteva Node.js).
-- Varna za ponoven zagon — vse guardano z IF NOT EXISTS.
--
-- UUIDs so isti kot v backend/src/scripts/seed.ts.

USE eplace2026;
GO

-- ============================================================
-- 1. TENANTS (brez RLS)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM dbo.tenants WHERE id = '11111111-1111-1111-1111-111111111111')
  INSERT INTO dbo.tenants (id, naziv_podjetja, davcna_stevilka, maticna_stevilka, naslov, kraj, posta, iban)
  VALUES (
    '11111111-1111-1111-1111-111111111111',
    N'Podjetje A d.o.o.',
    '12345670',
    '1234567000',
    N'Industrijska ulica 1',
    N'Ljubljana',
    '1000',
    'SI5601000000000001'
  );

IF NOT EXISTS (SELECT 1 FROM dbo.tenants WHERE id = '22222222-2222-2222-2222-222222222222')
  INSERT INTO dbo.tenants (id, naziv_podjetja, davcna_stevilka, maticna_stevilka, naslov, kraj, posta, iban)
  VALUES (
    '22222222-2222-2222-2222-222222222222',
    N'Podjetje B d.o.o.',
    '87654321',
    '8765432100',
    N'Mestna cesta 2',
    N'Maribor',
    '2000',
    'SI5602000000000002'
  );
GO

PRINT 'Tenants vneseni.';
GO

-- ============================================================
-- 2. JOB POSITIONS — Tenant A
-- ============================================================

EXEC sp_set_session_context
  @key    = N'tenant_id',
  @value  = CAST('11111111-1111-1111-1111-111111111111' AS UNIQUEIDENTIFIER),
  @readonly = 0;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.job_positions WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc')
  INSERT INTO dbo.job_positions (id, tenant_id, naziv_delovnega_mesta, tarifni_razred, zahtevana_izobrazba)
  VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    N'Razvijalec programske opreme',
    5,
    N'Visoka strokovna izobrazba'
  );
GO

PRINT 'Job positions (Tenant A) vneseni.';
GO

-- ============================================================
-- 3. EMPLOYEES — Tenant A (Janez, Ana)
-- ============================================================

-- SESSION_CONTEXT je ze nastavljen na Tenant A
IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd')
  INSERT INTO dbo.employees (
    id, tenant_id, job_position_id,
    ime, priimek, davcna_stevilka, emso, trr,
    naslov, kraj, posta,
    bruto_osnova,
    a004_rezident, a014_invalid_nad_kvoto, a017_starost_60_let,
    a031_zavezanec_ozp, glavni_delodajalec,
    olajsava_vzdrzevani_znesek,
    b014_has_vozilo, b014_vozilo_gorivo, b014_vozilo_el
  ) VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    N'Janez', N'Novak',
    '12345678', '0101990500006', 'SI5601000000000100',
    N'Dunajska cesta 10', N'Ljubljana', '1000',
    2000.00,
    'R', 0, 0, 1, 1,
    0.00,
    0, 0, 0
  );

IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
  INSERT INTO dbo.employees (
    id, tenant_id, job_position_id,
    ime, priimek, davcna_stevilka, emso, trr,
    naslov, kraj, posta,
    bruto_osnova,
    a004_rezident, a014_invalid_nad_kvoto, a017_starost_60_let,
    a031_zavezanec_ozp, glavni_delodajalec,
    olajsava_vzdrzevani_znesek,
    b014_has_vozilo, b014_vozilo_gorivo, b014_vozilo_el
  ) VALUES (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    N'Ana', N'Kovač',
    '87654321', '1505985505521', 'SI5601000000000200',
    N'Šmartinska cesta 5', N'Ljubljana', '1000',
    1500.00,
    'R', 0, 0, 1, 1,
    0.00,
    0, 0, 0
  );
GO

PRINT 'Employees (Tenant A) vneseni.';
GO

-- ============================================================
-- 4. MONTHLY HOURS — Tenant A (tekoči mesec)
-- ============================================================

-- SESSION_CONTEXT je ze nastavljen na Tenant A
IF NOT EXISTS (
  SELECT 1 FROM dbo.monthly_hours
  WHERE employee_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
    AND leto = 2026 AND mesec = 1
)
  INSERT INTO dbo.monthly_hours (tenant_id, employee_id, leto, mesec, m01_redno_ure, m07_preh_dnevi, m07_prevoz_km)
  VALUES ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2026, 1, 168, 21, 20.5);

IF NOT EXISTS (
  SELECT 1 FROM dbo.monthly_hours
  WHERE employee_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
    AND leto = 2026 AND mesec = 1
)
  INSERT INTO dbo.monthly_hours (tenant_id, employee_id, leto, mesec, m01_redno_ure, m07_preh_dnevi, m07_prevoz_km)
  VALUES ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2026, 1, 160, 20, 30.0);
GO

PRINT 'Monthly hours (Tenant A) vneseni.';
GO

-- ============================================================
-- 5. JOB POSITIONS — Tenant B
-- ============================================================

EXEC sp_set_session_context
  @key    = N'tenant_id',
  @value  = CAST('22222222-2222-2222-2222-222222222222' AS UNIQUEIDENTIFIER),
  @readonly = 0;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.job_positions
  WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
    AND naziv_delovnega_mesta = N'Vodja projekta')
  INSERT INTO dbo.job_positions (tenant_id, naziv_delovnega_mesta, tarifni_razred, zahtevana_izobrazba)
  VALUES (
    '22222222-2222-2222-2222-222222222222',
    N'Vodja projekta',
    7,
    N'Visokošolska izobrazba'
  );
GO

-- ============================================================
-- 6. EMPLOYEES — Tenant B (Peter)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff')
  INSERT INTO dbo.employees (
    id, tenant_id, job_position_id,
    ime, priimek, davcna_stevilka, emso, trr,
    naslov, kraj, posta,
    bruto_osnova,
    a004_rezident, a014_invalid_nad_kvoto, a017_starost_60_let,
    a031_zavezanec_ozp, glavni_delodajalec,
    olajsava_vzdrzevani_znesek,
    b014_has_vozilo, b014_vozilo_nv, b014_vozilo_gorivo, b014_vozilo_el
  ) VALUES (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '22222222-2222-2222-2222-222222222222',
    NULL,
    N'Peter', N'Hočevar',
    '11223344', '2203988500123', 'SI5602000000000300',
    N'Partizanska cesta 3', N'Maribor', '2000',
    3000.00,
    'R', 0, 0, 1, 1,
    0.00,
    1, 12000.00, 1, 0
  );
GO

PRINT 'Employees (Tenant B) vneseni.';
GO

-- ============================================================
-- 7. MONTHLY HOURS — Tenant B (Peter)
-- ============================================================

IF NOT EXISTS (
  SELECT 1 FROM dbo.monthly_hours
  WHERE employee_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
    AND leto = 2026 AND mesec = 1
)
  INSERT INTO dbo.monthly_hours (tenant_id, employee_id, leto, mesec, m01_redno_ure, m07_preh_dnevi, m07_prevoz_km)
  VALUES ('22222222-2222-2222-2222-222222222222', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 2026, 1, 176, 22, 50.0);
GO

PRINT 'Monthly hours (Tenant B) vneseni.';
PRINT '';
PRINT 'OPOMBA: Uporabniki niso vneseni — za gesla pogeni: cd backend && npm run seed';
PRINT '';
GO

-- ============================================================
-- 8. H3 VERIFIKACIJA — RLS izolacija med tenanti
-- ============================================================

PRINT 'H3 RLS test:';

-- Test 1: Brez SESSION_CONTEXT -> 0 vrstic
EXEC sp_set_session_context @key=N'tenant_id', @value=NULL, @readonly=0;
SELECT COUNT(*) AS [Brez_konteksta_pricakovano_0] FROM dbo.employees;

-- Test 2: Tenant A -> 2 delavca
EXEC sp_set_session_context
  @key    = N'tenant_id',
  @value  = CAST('11111111-1111-1111-1111-111111111111' AS UNIQUEIDENTIFIER),
  @readonly = 0;
SELECT COUNT(*) AS [Podjetje_A_pricakovano_2] FROM dbo.employees;

-- Test 3: Tenant B -> 1 delavec (Peter)
EXEC sp_set_session_context
  @key    = N'tenant_id',
  @value  = CAST('22222222-2222-2222-2222-222222222222' AS UNIQUEIDENTIFIER),
  @readonly = 0;
SELECT COUNT(*) AS [Podjetje_B_pricakovano_1] FROM dbo.employees;
SELECT priimek, ime FROM dbo.employees;  -- samo Peter Hocevar

PRINT 'Pricakovani rezultati: 0 / 2 / 1';
GO
