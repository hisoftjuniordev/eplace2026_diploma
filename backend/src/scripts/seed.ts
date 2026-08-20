import 'dotenv/config';
import bcrypt from 'bcrypt';
import sql from 'mssql';
import { getPool } from '../config/db';

const TENANT_A_ID = '11111111-1111-1111-1111-111111111111';
const TENANT_B_ID = '22222222-2222-2222-2222-222222222222';

async function seed() {
  const pool = await getPool();
  const hash = await bcrypt.hash('Test1234!', 12);
  console.log('[Seed] Password hash generated');

  // Tenants
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.tenants WHERE id = '${TENANT_A_ID}')
    INSERT INTO dbo.tenants (id, naziv_podjetja, davcna_stevilka, maticna_stevilka, naslov, kraj, posta, iban)
    VALUES (
      '${TENANT_A_ID}',
      'Testno podjetje A d.o.o.',
      '12345678', '1234567000',
      'Testna ulica 1', 'Ljubljana', '1000',
      'SI5601000000000001'
    );
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.tenants WHERE id = '${TENANT_B_ID}')
    INSERT INTO dbo.tenants (id, naziv_podjetja, davcna_stevilka, maticna_stevilka, naslov, kraj, posta, iban)
    VALUES (
      '${TENANT_B_ID}',
      'Drugo podjetje B d.o.o.',
      '87654321', '9876543000',
      'Druga ulica 2', 'Maribor', '2000',
      'SI5602000000000002'
    );
  `);
  console.log('[Seed] Tenants created');

  // Users
  const req1 = pool.request();
  req1.input('hash', sql.VarChar, hash);
  await req1.query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'admin@a.si')
    INSERT INTO dbo.users (tenant_id, email, geslo_hash, ime, priimek, vloga)
    VALUES ('${TENANT_A_ID}', 'admin@a.si', @hash, 'Administrator', 'A', 'Skrbnik');
  `);

  const req2 = pool.request();
  req2.input('hash', sql.VarChar, hash);
  await req2.query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'admin@b.si')
    INSERT INTO dbo.users (tenant_id, email, geslo_hash, ime, priimek, vloga)
    VALUES ('${TENANT_B_ID}', 'admin@b.si', @hash, 'Administrator', 'B', 'Skrbnik');
  `);
  console.log('[Seed] Users created (email: admin@a.si / admin@b.si, geslo: Test1234!)');

  // Set context for Tenant A inserts
  const setCtxA = pool.request();
  setCtxA.input('tIdA', sql.UniqueIdentifier, TENANT_A_ID);
  await setCtxA.query(`EXEC sp_set_session_context @key=N'tenant_id', @value=@tIdA, @readonly=0`);

  // Job positions
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.job_positions WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc')
    INSERT INTO dbo.job_positions (id, tenant_id, naziv_delovnega_mesta, tarifni_razred, zahtevana_izobrazba)
    VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '${TENANT_A_ID}', 'Programer', 6, 'Visoka strokovna izobrazba')
  `);

  // Employees A (Janez + Ana)
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE davcna_stevilka = '12345678')
    INSERT INTO dbo.employees (id, tenant_id, job_position_id, ime, priimek, davcna_stevilka, emso, trr, bruto_osnova, a031_zavezanec_ozp, glavni_delodajalec, olajsava_vzdrzevani_znesek)
    VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', '${TENANT_A_ID}', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Janez', 'Novak', '12345678', '0101990500006', 'SI5601000000000100', 2000.00, 1, 1, 0.00)
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE davcna_stevilka = '87654321')
    INSERT INTO dbo.employees (id, tenant_id, job_position_id, ime, priimek, davcna_stevilka, emso, trr, bruto_osnova, a031_zavezanec_ozp, glavni_delodajalec, olajsava_vzdrzevani_znesek)
    VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '${TENANT_A_ID}', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Ana', 'Kovac', '87654321', '1505985505521', 'SI5601000000000200', 1500.00, 1, 1, 0.00)
  `);

  // Monthly hours for Tenant A (Jan 2026)
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.monthly_hours WHERE employee_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' AND leto = 2026 AND mesec = 1)
    INSERT INTO dbo.monthly_hours (tenant_id, employee_id, leto, mesec, m01_redno_ure, m07_preh_dnevi, m07_prevoz_km)
    VALUES ('${TENANT_A_ID}', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2026, 1, 174, 20, 15.0)
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.monthly_hours WHERE employee_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' AND leto = 2026 AND mesec = 1)
    INSERT INTO dbo.monthly_hours (tenant_id, employee_id, leto, mesec, m01_redno_ure, m07_preh_dnevi, m07_prevoz_km)
    VALUES ('${TENANT_A_ID}', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2026, 1, 174, 20, 8.0)
  `);
  console.log('[Seed] Employees + monthly hours created (Janez Novak 2000€, Ana Kovač 1500€)');

  // Set context for Tenant B inserts
  const setCtxB = pool.request();
  setCtxB.input('tIdB', sql.UniqueIdentifier, TENANT_B_ID);
  await setCtxB.query(`EXEC sp_set_session_context @key=N'tenant_id', @value=@tIdB, @readonly=0`);

  // Employee B (Peter)
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.employees WHERE davcna_stevilka = '11223344')
    INSERT INTO dbo.employees (id, tenant_id, ime, priimek, davcna_stevilka, emso, trr, bruto_osnova, a031_zavezanec_ozp, glavni_delodajalec, olajsava_vzdrzevani_znesek)
    VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff', '${TENANT_B_ID}', 'Peter', 'Hocevar', '11223344', '2203988500123', 'SI5602000000000300', 3000.00, 1, 1, 0.00)
  `);
  console.log('[Seed] Employee B created (Peter Hocevar 3000€)');
  console.log('[Seed] Monthly hours created for January 2026');

  console.log('\n✅ Seed complete!');
  console.log('   Tenant A: admin@a.si / Test1234! → Janez Novak + Ana Kovač');
  console.log('   Tenant B: admin@b.si / Test1234! → Peter Hočevar');
  console.log('\nH3 test (SSMS):');
  console.log(`   SELECT COUNT(*) FROM dbo.employees;  -- pričakovano: 0`);
  console.log(`   EXEC sp_set_session_context @key=N'tenant_id', @value=CAST('${TENANT_A_ID}' AS UNIQUEIDENTIFIER), @readonly=0;`);
  console.log(`   SELECT COUNT(*) FROM dbo.employees;  -- pričakovano: 2`);

  await pool.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
