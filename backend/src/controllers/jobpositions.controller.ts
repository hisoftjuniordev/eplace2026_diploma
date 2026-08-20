import { Router } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createJobPositionSchema, updateJobPositionSchema } from '../middleware/schemas';
import {
  findAllJobPositions,
  findJobPositionById,
  createJobPosition,
  updateJobPosition,
  softDeleteJobPosition,
} from '../repositories/jobpositions.repo';
import { IJwtPayload } from '../types/interfaces';

export const jobPositionsRouter = Router();

jobPositionsRouter.get('/', async (req, res) => {
  const { tenantId } = req.user as IJwtPayload;
  const data = await findAllJobPositions(tenantId);
  res.json(data);
});

jobPositionsRouter.get('/:id', async (req, res) => {
  const { tenantId } = req.user as IJwtPayload;
  const item = await findJobPositionById(tenantId, req.params.id);
  if (!item) { res.status(404).json({ error: 'Delovno mesto ne obstaja' }); return; }
  res.json(item);
});

jobPositionsRouter.post('/', requireRole('Skrbnik', 'SistemskiAdmin'), validate(createJobPositionSchema), async (req, res) => {
  const { tenantId } = req.user as IJwtPayload;
  const item = await createJobPosition(tenantId, req.body);
  res.status(201).json(item);
});

jobPositionsRouter.put('/:id', requireRole('Skrbnik', 'SistemskiAdmin'), validate(updateJobPositionSchema), async (req, res) => {
  const { tenantId } = req.user as IJwtPayload;
  const item = await updateJobPosition(tenantId, req.params.id, req.body);
  if (!item) { res.status(404).json({ error: 'Delovno mesto ne obstaja' }); return; }
  res.json(item);
});

jobPositionsRouter.delete('/:id', requireRole('Skrbnik', 'SistemskiAdmin'), async (req, res) => {
  const { tenantId } = req.user as IJwtPayload;
  const ok = await softDeleteJobPosition(tenantId, req.params.id);
  if (!ok) { res.status(404).json({ error: 'Delovno mesto ne obstaja' }); return; }
  res.status(204).send();
});
