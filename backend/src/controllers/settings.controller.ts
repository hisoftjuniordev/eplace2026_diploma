import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { sysQuery } from '../config/db';
import sql from 'mssql';

export const settingsRouter = Router();

settingsRouter.get('/me', async (req: Request, res: Response): Promise<void> => {
  const { tenantId } = req.user!;
  const result = await sysQuery(
    `SELECT id, naziv_podjetja, davcna_stevilka, maticna_stevilka, naslov, kraj, posta, iban, ustvarjen_ob
     FROM dbo.tenants WHERE id = @id`,
    (r) => r.input('id', sql.UniqueIdentifier, tenantId)
  );
  if (!result.recordset[0]) { res.status(404).json({ error: 'Podjetje ne obstaja' }); return; }
  res.json(result.recordset[0]);
});

settingsRouter.put('/me', requireRole('Skrbnik', 'SistemskiAdmin'), async (req: Request, res: Response): Promise<void> => {
  const { tenantId } = req.user!;
  const { naziv_podjetja, naslov, kraj, posta, iban } = req.body;

  if (!naziv_podjetja?.trim()) {
    res.status(400).json({ error: 'Naziv podjetja je obvezen' }); return;
  }

  const result = await sysQuery(
    `UPDATE dbo.tenants
     SET naziv_podjetja = @naziv, naslov = @naslov, kraj = @kraj, posta = @posta, iban = @iban
     OUTPUT INSERTED.id, INSERTED.naziv_podjetja, INSERTED.davcna_stevilka,
            INSERTED.maticna_stevilka, INSERTED.naslov, INSERTED.kraj, INSERTED.posta, INSERTED.iban
     WHERE id = @id`,
    (r) => {
      r.input('id',     sql.UniqueIdentifier,  tenantId);
      r.input('naziv',  sql.NVarChar(150),      naziv_podjetja.trim());
      r.input('naslov', sql.NVarChar(150),      naslov ?? null);
      r.input('kraj',   sql.NVarChar(100),      kraj ?? null);
      r.input('posta',  sql.VarChar(10),        posta ?? null);
      r.input('iban',   sql.VarChar(34),        iban ?? null);
    }
  );
  if (!result.recordset[0]) { res.status(404).json({ error: 'Podjetje ne obstaja' }); return; }
  res.json(result.recordset[0]);
});
