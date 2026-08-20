import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import sql from 'mssql';
import { getRedis } from '../config/redis';
import { getPool } from '../config/db';
import { SlovenianPayrollEngine } from '../engine/slovenian-payroll-engine';
import {
  insertPayrollLine,
  updatePayrollProgressDirect,
  completePayrollRun,
  failPayrollRun,
  getEmployeesForWorker,
  getMonthlyHoursForWorker,
} from '../repositories/payroll.repo';
import { PayrollJobData } from '../queues/payroll.queue';
import { IPayrollInput } from '../types/interfaces';
import { getActivePayrollParams } from '../repositories/payroll-params.repo';

const engine = new SlovenianPayrollEngine();

async function processPayroll(job: Job<PayrollJobData>): Promise<void> {
  const { payrollRunId, tenantId, leto, mesec } = job.data;
  console.log(`[Worker] Processing payroll run ${payrollRunId} for tenant ${tenantId}`);

  // Load params before transaction — sysQuery (no tenant context needed)
  const params = await getActivePayrollParams();

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Set RLS context for this worker transaction
    const setup = new sql.Request(transaction);
    setup.input('tenantId', sql.UniqueIdentifier, tenantId);
    await setup.query(
      `EXEC sp_set_session_context @key=N'tenant_id', @value=@tenantId, @readonly=0`
    );

    const employees = await getEmployeesForWorker(transaction, tenantId);
    const total = employees.length;

    if (total === 0) {
      await completePayrollRun(transaction, payrollRunId);
      await transaction.commit();
      return;
    }

    for (let i = 0; i < total; i++) {
      const emp = employees[i];

      const hours = await getMonthlyHoursForWorker(transaction, emp.id, leto, mesec);

      // Calculate bonus (vehicle)
      let boniteta = 0;
      if (emp.b014_has_vozilo && !emp.b014_vozilo_el && emp.b014_vozilo_nv) {
        const rate = emp.b014_vozilo_gorivo ? 0.0175 : 0.015;
        boniteta = parseFloat((emp.b014_vozilo_nv * rate).toFixed(2));
      }

      const input: IPayrollInput = {
        tenantId,
        employeeId: emp.id,
        brutoOsnova:        parseFloat(emp.bruto_osnova.toString()),
        urnaPostavka:       emp.urna_postavka ? parseFloat(emp.urna_postavka.toString()) : null,
        olajsavaVzdrzevani: parseFloat((emp.olajsava_vzdrzevani_znesek ?? 0).toString()),
        glavniDelodajalec:  !!emp.glavni_delodajalec,
        zavezanecOzp:       !!emp.a031_zavezanec_ozp,
        boniteta,
        m01Ure:          hours?.m01_redno_ure   ?? 174,
        m03NadureUre:    hours?.m03_nadure_ure   ?? 0,
        m04DopustUre:    hours?.m04_dopust_ure   ?? 0,
        m05BolniskeUre:  hours?.m05_bolniske_ure ?? 0,
        m07PrehranaDnevi: hours?.m07_preh_dnevi ?? 0,
        m07PrevozKm:     parseFloat((hours?.m07_prevoz_km  ?? 0).toString()),
        odtegljaji:      parseFloat((hours?.odtegljaji_kred ?? 0).toString()),
      };

      const result = engine.calculate(input, params);
      await insertPayrollLine(transaction, tenantId, payrollRunId, emp.id, result);

      const progress = Math.round(((i + 1) / total) * 100);
      await updatePayrollProgressDirect(pool, tenantId, payrollRunId, progress);

      console.log(`[Worker] Employee ${emp.priimek} ${emp.ime}: neto=${result.netoPoOzp}, koncno=${result.koncnoIzplaciloTrr}`);
    }

    await completePayrollRun(transaction, payrollRunId);
    await transaction.commit();
    console.log(`[Worker] Payroll run ${payrollRunId} completed.`);
  } catch (err) {
    await transaction.rollback();

    const errMsg = err instanceof Error ? err.message : String(err);
    const errorTx = new sql.Transaction(pool);
    await errorTx.begin();
    try {
      const setup2 = new sql.Request(errorTx);
      setup2.input('tid', sql.UniqueIdentifier, tenantId);
      await setup2.query(`EXEC sp_set_session_context @key=N'tenant_id', @value=@tid, @readonly=0`);
      await failPayrollRun(errorTx, payrollRunId, errMsg);
      await errorTx.commit();
    } catch {
      await errorTx.rollback();
    }
    throw err;
  }
}

const worker = new Worker<PayrollJobData>('payrollQueue', processPayroll, {
  connection: getRedis(),
  concurrency: 1,
});

worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));

console.log('[Worker] Payroll worker started. Waiting for jobs...');
