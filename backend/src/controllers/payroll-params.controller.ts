import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { upsertPayrollParamSchema } from '../middleware/schemas';
import { getAllPayrollParams, upsertPayrollParam, REQUIRED_KEYS } from '../repositories/payroll-params.repo';

export const payrollParamsRouter = Router();

payrollParamsRouter.get('/', async (_req: Request, res: Response) => {
  const rows = await getAllPayrollParams();
  res.json(rows);
});

payrollParamsRouter.put(
  '/:kljuc',
  requireRole('Skrbnik', 'SistemskiAdmin'),
  validate(upsertPayrollParamSchema),
  async (req: Request, res: Response) => {
    const { kljuc } = req.params;
    if (!(REQUIRED_KEYS as readonly string[]).includes(kljuc)) {
      res.status(400).json({ error: `Neveljaven ključ parametra: ${kljuc}` });
      return;
    }
    const { vrednost, opis, veljavno_od, veljavno_do } = req.body;
    const row = await upsertPayrollParam(kljuc, vrednost, opis, veljavno_od, veljavno_do ?? null);
    res.json(row);
  }
);
