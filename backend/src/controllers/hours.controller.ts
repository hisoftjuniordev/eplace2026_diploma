import { Router, Request, Response } from 'express';
import sql from 'mssql';
import { withTenant } from '../config/db';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { upsertHoursSchema } from '../middleware/schemas';

export const hoursRouter = Router();

// GET /hours?leto=2026&mesec=1
hoursRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.user!.tenantId;
  const leto  = parseInt(req.query['leto']  as string) || new Date().getFullYear();
  const mesec = parseInt(req.query['mesec'] as string) || new Date().getMonth() + 1;

  const rows = await withTenant(tenantId, async (tx) => {
    const r = new sql.Request(tx);
    r.input('tenantId', sql.UniqueIdentifier, tenantId);
    r.input('leto',     sql.Int, leto);
    r.input('mesec',    sql.Int, mesec);
    const result = await r.query(`
      SELECT
        e.id            AS employee_id,
        e.ime,
        e.priimek,
        e.bruto_osnova,
        e.urna_postavka,
        mh.id           AS hours_id,
        ISNULL(mh.m01_redno_ure,   0) AS m01_redno_ure,
        ISNULL(mh.m02_refund_ure,  0) AS m02_refund_ure,
        ISNULL(mh.m03_nadure_ure,  0) AS m03_nadure_ure,
        ISNULL(mh.m04_dopust_ure,  0) AS m04_dopust_ure,
        ISNULL(mh.m05_bolniske_ure,0) AS m05_bolniske_ure,
        ISNULL(mh.m06_odsot_ure,   0) AS m06_odsot_ure,
        ISNULL(mh.m07_preh_dnevi,  0) AS m07_preh_dnevi,
        ISNULL(mh.m07_prevoz_km,   0) AS m07_prevoz_km,
        ISNULL(mh.odtegljaji_kred, 0) AS odtegljaji_kred
      FROM dbo.employees e
      LEFT JOIN dbo.monthly_hours mh
        ON mh.employee_id = e.id AND mh.leto = @leto AND mh.mesec = @mesec
      WHERE e.aktivno = 1
      ORDER BY e.priimek, e.ime
    `);
    return result.recordset;
  });

  res.json({ leto, mesec, employees: rows });
});

// POST /hours — UPSERT ure za enega delavca/mesec
hoursRouter.post(
  '/',
  requireRole('Skrbnik', 'SistemskiAdmin'),
  validate(upsertHoursSchema),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.user!.tenantId;
    const {
      employee_id,
      leto,
      mesec,
      m01_redno_ure    = 0,
      m02_refund_ure   = 0,
      m03_nadure_ure   = 0,
      m04_dopust_ure   = 0,
      m05_bolniske_ure = 0,
      m06_odsot_ure    = 0,
      m07_preh_dnevi   = 0,
      m07_prevoz_km    = 0,
      odtegljaji_kred  = 0,
    } = req.body;

    const row = await withTenant(tenantId, async (tx) => {
      const r = new sql.Request(tx);
      r.input('tenantId',   sql.UniqueIdentifier, tenantId);
      r.input('employeeId', sql.UniqueIdentifier, employee_id);
      r.input('leto',       sql.Int,          leto);
      r.input('mesec',      sql.Int,          mesec);
      r.input('m01',        sql.Int,          m01_redno_ure);
      r.input('m02',        sql.Int,          m02_refund_ure);
      r.input('m03',        sql.Int,          m03_nadure_ure);
      r.input('m04',        sql.Int,          m04_dopust_ure);
      r.input('m05',        sql.Int,          m05_bolniske_ure);
      r.input('m06',        sql.Int,          m06_odsot_ure);
      r.input('m07d',       sql.Int,          m07_preh_dnevi);
      r.input('m07km',      sql.Decimal(5,2), m07_prevoz_km);
      r.input('odteg',      sql.Decimal(10,2),odtegljaji_kred);

      const result = await r.query(`
        MERGE dbo.monthly_hours AS target
        USING (SELECT @employeeId AS employee_id, @leto AS leto, @mesec AS mesec) AS src
          ON target.employee_id = src.employee_id
         AND target.leto        = src.leto
         AND target.mesec       = src.mesec
        WHEN MATCHED THEN
          UPDATE SET
            m01_redno_ure    = @m01,
            m02_refund_ure   = @m02,
            m03_nadure_ure   = @m03,
            m04_dopust_ure   = @m04,
            m05_bolniske_ure = @m05,
            m06_odsot_ure    = @m06,
            m07_preh_dnevi   = @m07d,
            m07_prevoz_km    = @m07km,
            odtegljaji_kred  = @odteg
        WHEN NOT MATCHED THEN
          INSERT (tenant_id, employee_id, leto, mesec,
                  m01_redno_ure, m02_refund_ure, m03_nadure_ure,
                  m04_dopust_ure, m05_bolniske_ure,
                  m06_odsot_ure, m07_preh_dnevi, m07_prevoz_km, odtegljaji_kred)
          VALUES (@tenantId, @employeeId, @leto, @mesec,
                  @m01, @m02, @m03, @m04, @m05, @m06, @m07d, @m07km, @odteg)
        OUTPUT INSERTED.*;
      `);
      return result.recordset[0];
    });

    res.json(row);
  }
);
