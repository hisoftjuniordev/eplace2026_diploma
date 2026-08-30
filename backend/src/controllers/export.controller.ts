import { Router, Request, Response } from 'express';
import { getPayrollRunById, getPayrollLines } from '../repositories/payroll.repo';
import { sysQuery, withTenant } from '../config/db';
import { generateSepaXml } from '../xml/sepa.generator';
import { generateVodXml } from '../xml/vod.generator';
import { generateRekoXml } from '../xml/reko.generator';
import { logAudit } from '../utils/audit';
import sql from 'mssql';

export const exportRouter = Router();

async function getTenant(tenantId: string) {
  const result = await sysQuery(
    `SELECT id, naziv_podjetja, davcna_stevilka, maticna_stevilka, iban FROM dbo.tenants WHERE id = @id`,
    (req) => req.input('id', sql.UniqueIdentifier, tenantId)
  );
  return result.recordset[0] ?? null;
}

exportRouter.get('/sepa/:runId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.user!;
    const run = await getPayrollRunById(tenantId, req.params.runId);
    if (!run) { res.status(404).json({ error: 'Obračun ne obstaja' }); return; }
    if (run.status_obracuna !== 'Zakljucen') {
      res.status(409).json({ error: 'Obračun še ni zaključen' }); return;
    }

    const [lines, tenant] = await Promise.all([
      getPayrollLines(tenantId, run.id),
      getTenant(tenantId),
    ]);

    if (!tenant) { res.status(500).json({ error: 'Podjetje ne obstaja' }); return; }

    const xml = generateSepaXml(run, lines as any, tenant);
    const mesecStr = String(run.mesec).padStart(2, '0');
    const filename = `sepa_${run.leto}_${mesecStr}_${tenant.davcna_stevilka}.xml`;

    void logAudit(tenantId, req.user!.email, 'IZVOZ', 'payroll_runs', `SEPA ${run.leto}/${run.mesec}`, req.ip);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xml);
  } catch (err) {
    console.error('[Export] SEPA error:', err);
    res.status(500).json({ error: 'Napaka pri generiranju SEPA XML' });
  }
});

exportRouter.get('/vod/:runId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.user!;
    const run = await getPayrollRunById(tenantId, req.params.runId);
    if (!run) { res.status(404).json({ error: 'Obračun ne obstaja' }); return; }
    if (run.status_obracuna !== 'Zakljucen') {
      res.status(409).json({ error: 'Obračun še ni zaključen' }); return;
    }

    const lines = await getPayrollLines(tenantId, run.id);
    const xml = generateVodXml(run, lines);

    const mesecStr = String(run.mesec).padStart(2, '0');
    const tenant = await getTenant(tenantId);
    const filename = `vod_${run.leto}_${mesecStr}_${tenant?.davcna_stevilka ?? 'export'}.xml`;

    void logAudit(tenantId, req.user!.email, 'IZVOZ', 'payroll_runs', `VOD ${run.leto}/${run.mesec}`, req.ip);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xml);
  } catch (err) {
    console.error('[Export] VOD error:', err);
    res.status(500).json({ error: 'Napaka pri generiranju VOD XML' });
  }
});

exportRouter.get('/rek/:runId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.user!;
    const run = await getPayrollRunById(tenantId, req.params.runId);
    if (!run) { res.status(404).json({ error: 'Obračun ne obstaja' }); return; }
    if (run.status_obracuna !== 'Zakljucen') {
      res.status(409).json({ error: 'Obračun še ni zaključen' }); return;
    }

    // Fetch payroll lines enriched with emso + monthly hours for REK-O
    const rekoLines = await withTenant(tenantId, async (tx) => {
      const r = new sql.Request(tx);
      r.input('runId', sql.UniqueIdentifier, run.id);
      r.input('leto',  sql.SmallInt, run.leto);
      r.input('mesec', sql.TinyInt,  run.mesec);
      const result = await r.query(`
        SELECT
          pl.*,
          e.ime, e.priimek, e.emso,
          e.davcna_stevilka AS davcna_stevilka_del,
          ISNULL(h.m01_redno_ure, 0) AS m01_ure,
          ISNULL(h.m03_nadure_ure,0) AS m03_nadure_ure
        FROM dbo.payroll_lines pl
        JOIN dbo.employees e ON e.id = pl.employee_id
        LEFT JOIN dbo.monthly_hours h
          ON h.employee_id = pl.employee_id AND h.leto = @leto AND h.mesec = @mesec
        WHERE pl.payroll_run_id = @runId
        ORDER BY e.priimek, e.ime
      `);
      return result.recordset;
    });

    const tenant = await getTenant(tenantId);
    if (!tenant) { res.status(500).json({ error: 'Podjetje ne obstaja' }); return; }

    const xml = generateRekoXml(run, rekoLines as any, tenant);

    const mesecStr = String(run.mesec).padStart(2, '0');
    const filename = `reko_${run.leto}_${mesecStr}_${tenant.davcna_stevilka}.xml`;

    void logAudit(tenantId, req.user!.email, 'IZVOZ', 'payroll_runs', `REK-O ${run.leto}/${run.mesec}`, req.ip);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xml);
  } catch (err: any) {
    console.error('[Export] REK-O error:', err);
    res.status(500).json({ error: err?.message ?? 'Napaka pri generiranju REK-O XML' });
  }
});
