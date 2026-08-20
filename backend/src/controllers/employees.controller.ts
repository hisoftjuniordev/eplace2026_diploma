import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createEmployeeSchema, updateEmployeeSchema } from '../middleware/schemas';
import {
  findAllEmployees,
  findEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../repositories/employee.repo';

export const employeesRouter = Router();

employeesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const page  = parseInt(req.query['page']  as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 50;
  const includeInactive = req.query['includeInactive'] === 'true';
  const result = await findAllEmployees(req.user!.tenantId, page, limit, includeInactive);
  res.json(result);
});

employeesRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const emp = await findEmployeeById(req.user!.tenantId, req.params.id);
  if (!emp) { res.status(404).json({ error: 'Delavec ne obstaja' }); return; }
  res.json(emp);
});

employeesRouter.post(
  '/',
  requireRole('Skrbnik', 'SistemskiAdmin'),
  validate(createEmployeeSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const emp = await createEmployee(req.user!.tenantId, req.body);
      res.status(201).json(emp);
    } catch (err: any) {
      if (err?.number === 2627 || err?.number === 2601) {
        res.status(409).json({ error: 'Delavec s to davčno ali EMŠO že obstaja' });
        return;
      }
      throw err;
    }
  }
);

employeesRouter.put(
  '/:id',
  requireRole('Skrbnik', 'SistemskiAdmin'),
  validate(updateEmployeeSchema),
  async (req: Request, res: Response): Promise<void> => {
    const emp = await updateEmployee(req.user!.tenantId, req.params.id, req.body);
    if (!emp) { res.status(404).json({ error: 'Delavec ne obstaja' }); return; }
    res.json(emp);
  }
);

employeesRouter.delete(
  '/:id',
  requireRole('Skrbnik', 'SistemskiAdmin'),
  async (req: Request, res: Response): Promise<void> => {
    const deleted = await deleteEmployee(req.user!.tenantId, req.params.id);
    if (!deleted) { res.status(404).json({ error: 'Delavec ne obstaja' }); return; }
    res.status(204).send();
  }
);
