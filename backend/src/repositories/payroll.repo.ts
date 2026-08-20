import sql from 'mssql';
import { withTenant } from '../config/db';
import { IPayrollRun, IPayrollLine, IMonthlyHours, IEmployee } from '../types/interfaces';
import { IPayrollResult } from '../types/interfaces';

export async function createPayrollRun(
  tenantId: string,
  leto: number,
  mesec: number,
  datumIzplacila: string
): Promise<IPayrollRun> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('tenantId', sql.UniqueIdentifier, tenantId);
    req.input('leto', sql.Int, leto);
    req.input('mesec', sql.Int, mesec);
    req.input('datum', sql.Date, datumIzplacila);
    const result = await req.query<IPayrollRun>(`
      INSERT INTO dbo.payroll_runs (tenant_id, leto, mesec, datum_izplacila, status_obracuna)
      OUTPUT INSERTED.*
      VALUES (@tenantId, @leto, @mesec, @datum, 'Procesiranje')
    `);
    return result.recordset[0];
  });
}

export async function getPayrollRuns(tenantId: string): Promise<IPayrollRun[]> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    const result = await req.query<IPayrollRun>(`
      SELECT * FROM dbo.payroll_runs ORDER BY ustvarjen_ob DESC
    `);
    return result.recordset;
  });
}

export async function getPayrollRunById(tenantId: string, id: string): Promise<IPayrollRun | null> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('id', sql.UniqueIdentifier, id);
    const result = await req.query<IPayrollRun>(`
      SELECT * FROM dbo.payroll_runs WHERE id = @id
    `);
    return result.recordset[0] ?? null;
  });
}

export async function getPayrollLines(tenantId: string, runId: string): Promise<IPayrollLine[]> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('runId', sql.UniqueIdentifier, runId);
    const result = await req.query<IPayrollLine>(`
      SELECT pl.*, e.ime, e.priimek, e.davcna_stevilka, e.trr
      FROM dbo.payroll_lines pl
      JOIN dbo.employees e ON e.id = pl.employee_id
      WHERE pl.payroll_run_id = @runId
      ORDER BY e.priimek, e.ime
    `);
    return result.recordset;
  });
}

// Used by the worker — operates on a provided transaction for atomicity
export async function insertPayrollLine(
  tx: sql.Transaction,
  tenantId: string,
  runId: string,
  employeeId: string,
  r: IPayrollResult
): Promise<void> {
  const req = new sql.Request(tx);
  req.input('tenantId',    sql.UniqueIdentifier, tenantId);
  req.input('runId',       sql.UniqueIdentifier, runId);
  req.input('empId',       sql.UniqueIdentifier, employeeId);
  req.input('bruto1',      sql.Decimal(10,2), r.bruto1);
  req.input('boniteta',    sql.Decimal(10,2), r.boniteta);
  req.input('pizDel',      sql.Decimal(10,2), r.pizDel);
  req.input('zzDel',       sql.Decimal(10,2), r.zzDel);
  req.input('ozpDel',      sql.Decimal(10,2), r.ozpDel);
  req.input('doDel',       sql.Decimal(10,2), r.doDel);
  req.input('starDel',     sql.Decimal(10,2), r.starDel);
  req.input('zapDel',      sql.Decimal(10,2), r.zapDel);
  req.input('davcnaOsn',   sql.Decimal(10,2), r.davcnaOsnova);
  req.input('dohodnina',   sql.Decimal(10,2), r.dohodnina);
  req.input('netoPred',    sql.Decimal(10,2), r.netoPredOzp);
  req.input('netoPoOzp',   sql.Decimal(10,2), r.netoPoOzp);
  req.input('prehrana',    sql.Decimal(10,2), r.prehranaPovracilo);
  req.input('prevoz',      sql.Decimal(10,2), r.prevozPovracilo);
  req.input('odtegljaji',  sql.Decimal(10,2), r.odtegljaji);
  req.input('koncno',      sql.Decimal(10,2), r.koncnoIzplaciloTrr);
  req.input('pizAdr',      sql.Decimal(10,2), r.pizDelAdr);
  req.input('doAdr',       sql.Decimal(10,2), r.doDelAdr);
  req.input('zzAdr',       sql.Decimal(10,2), r.zzDelAdr);
  req.input('zapAdr',      sql.Decimal(10,2), r.zapDelAdr);
  req.input('starAdr',     sql.Decimal(10,2), r.starDelAdr);
  req.input('poskAdr',     sql.Decimal(10,2), r.poskDelAdr);
  req.input('bruto2',      sql.Decimal(10,2), r.bruto2Strosek);
  req.input('m01Znesek',  sql.Decimal(10,2), r.m01RednoZnesek ?? null);
  req.input('m04Znesek',  sql.Decimal(10,2), r.m04DopustZnesek ?? null);
  req.input('m05Znesek',  sql.Decimal(10,2), r.m05BolniskaZnesek ?? null);

  await req.query(`
    INSERT INTO dbo.payroll_lines (
      tenant_id, payroll_run_id, employee_id,
      bruto_1, boniteta_b014,
      a071_piz_del, a072_zz_del, a072a_ozp_del, a072b_do_del, a073_star_del, a074_zap_del,
      davcna_osnova, dohodnina, neto_pred_ozp, neto_po_ozp,
      m07_prehrana, m07_prevoz, odtegljaji_kredit, koncno_izplacilo_trr,
      a081_piz_del_adr, a082_do_del_adr, a083_zz_del_adr,
      a084_zap_del_adr, a085_star_del_adr, a086_posk_del_adr, bruto_2_strosek,
      m01_redno_znesek, m04_dopust_znesek, m05_bolniska_znesek
    ) VALUES (
      @tenantId, @runId, @empId,
      @bruto1, @boniteta,
      @pizDel, @zzDel, @ozpDel, @doDel, @starDel, @zapDel,
      @davcnaOsn, @dohodnina, @netoPred, @netoPoOzp,
      @prehrana, @prevoz, @odtegljaji, @koncno,
      @pizAdr, @doAdr, @zzAdr, @zapAdr, @starAdr, @poskAdr, @bruto2,
      @m01Znesek, @m04Znesek, @m05Znesek
    )
  `);
}

export async function updatePayrollProgress(
  tx: sql.Transaction,
  runId: string,
  procent: number
): Promise<void> {
  const req = new sql.Request(tx);
  req.input('runId',   sql.UniqueIdentifier, runId);
  req.input('procent', sql.Int, procent);
  await req.query(`
    UPDATE dbo.payroll_runs SET progress_procent = @procent WHERE id = @runId
  `);
}

export async function updatePayrollProgressDirect(
  pool: sql.ConnectionPool,
  tenantId: string,
  runId: string,
  procent: number
): Promise<void> {
  const req = pool.request();
  req.input('tenantId', sql.UniqueIdentifier, tenantId);
  req.input('runId',    sql.UniqueIdentifier, runId);
  req.input('procent',  sql.Int, procent);
  // Set tenant context on this bare-pool request so RLS FILTER allows the UPDATE
  await req.query(`
    EXEC sp_set_session_context @key=N'tenant_id', @value=@tenantId, @readonly=0;
    UPDATE dbo.payroll_runs SET progress_procent = @procent WHERE id = @runId;
  `);
}

export async function completePayrollRun(tx: sql.Transaction, runId: string): Promise<void> {
  const req = new sql.Request(tx);
  req.input('runId', sql.UniqueIdentifier, runId);
  await req.query(`
    UPDATE dbo.payroll_runs
    SET status_obracuna = 'Zakljucen', progress_procent = 100, zakljucen_ob = GETDATE()
    WHERE id = @runId
  `);
}

export async function failPayrollRun(
  tx: sql.Transaction,
  runId: string,
  napakaSporocilo: string
): Promise<void> {
  const req = new sql.Request(tx);
  req.input('runId',  sql.UniqueIdentifier, runId);
  req.input('napaka', sql.NVarChar(500), napakaSporocilo.slice(0, 500));
  await req.query(`
    UPDATE dbo.payroll_runs
    SET status_obracuna = 'Napaka', napaka_opis = @napaka, zakljucen_ob = GETDATE()
    WHERE id = @runId
  `);
}

export async function getEmployeesForWorker(
  tx: sql.Transaction,
  tenantId: string
): Promise<IEmployee[]> {
  const req = new sql.Request(tx);
  const result = await req.query<IEmployee>(`
    SELECT id, tenant_id, ime, priimek, trr, davcna_stevilka,
           bruto_osnova, urna_postavka, a031_zavezanec_ozp, glavni_delodajalec,
           olajsava_vzdrzevani_znesek, b014_has_vozilo, b014_vozilo_nv,
           b014_vozilo_gorivo, b014_vozilo_el
    FROM dbo.employees WHERE aktivno = 1
  `);
  return result.recordset;
}

export async function getMonthlyHoursForWorker(
  tx: sql.Transaction,
  employeeId: string,
  leto: number,
  mesec: number
): Promise<IMonthlyHours | null> {
  const req = new sql.Request(tx);
  req.input('empId', sql.UniqueIdentifier, employeeId);
  req.input('leto', sql.Int, leto);
  req.input('mesec', sql.Int, mesec);
  const result = await req.query<IMonthlyHours>(`
    SELECT * FROM dbo.monthly_hours
    WHERE employee_id = @empId AND leto = @leto AND mesec = @mesec
  `);
  return result.recordset[0] ?? null;
}
