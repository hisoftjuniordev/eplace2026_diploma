import { Router, Request, Response } from 'express';
import { roleMiddleware } from '../middleware/roles.middleware';
import {
  createPayrollRun,
  getPayrollRuns,
  getPayrollRunById,
  getPayrollLines,
} from '../repositories/payroll.repo';
import { payrollQueue } from '../queues/payroll.queue';

export const payrollRouter = Router();

// H1 DOKAZ: vrne 202 Accepted v <20ms, worker teče v ozadju
payrollRouter.post('/runs', roleMiddleware('Skrbnik', 'SistemskiAdmin'), async (req: Request, res: Response): Promise<void> => {
  const { leto, mesec, datum_izplacila } = req.body;
  if (!leto || !mesec || !datum_izplacila) {
    res.status(400).json({ error: 'Leto, mesec in datum_izplacila so obvezni' });
    return;
  }

  try {
    const run = await createPayrollRun(req.user!.tenantId, leto, mesec, datum_izplacila);

    // Async — ne čakamo na worker
    await payrollQueue.add('calculatePayroll', {
      payrollRunId: run.id,
      tenantId: req.user!.tenantId,
      leto,
      mesec,
    });

    // H1: HTTP 202 takoj
    res.status(202).json({ id: run.id, status: 'Procesiranje' });
  } catch (err: any) {
    if (err?.number === 2601) {
      res.status(409).json({ error: 'Obračun za ta mesec že obstaja' });
      return;
    }
    console.error('[Payroll] POST runs error:', err);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});

payrollRouter.get('/runs', async (req: Request, res: Response): Promise<void> => {
  try {
    const runs = await getPayrollRuns(req.user!.tenantId);
    res.json(runs);
  } catch (err) {
    console.error('[Payroll] GET runs error:', err);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});

payrollRouter.get('/runs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const run = await getPayrollRunById(req.user!.tenantId, req.params.id);
    if (!run) { res.status(404).json({ error: 'Obračun ne obstaja' }); return; }
    res.json(run);
  } catch (err) {
    console.error('[Payroll] GET run/:id error:', err);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});

payrollRouter.get('/runs/:id/lines', async (req: Request, res: Response): Promise<void> => {
  try {
    const lines = await getPayrollLines(req.user!.tenantId, req.params.id);
    res.json(lines);
  } catch (err) {
    console.error('[Payroll] GET lines error:', err);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});
