import sql from 'mssql';
import { withTenant } from '../config/db';
import { IJobPosition, ICreateJobPositionDto } from '../types/interfaces';

const SELECT_COLS = `id, tenant_id, naziv_delovnega_mesta, tarifni_razred, zahtevana_izobrazba, aktivno`;

export async function findAllJobPositions(tenantId: string): Promise<IJobPosition[]> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    const result = await req.query<IJobPosition>(`
      SELECT ${SELECT_COLS} FROM dbo.job_positions
      WHERE aktivno = 1
      ORDER BY naziv_delovnega_mesta
    `);
    return result.recordset;
  });
}

export async function findJobPositionById(tenantId: string, id: string): Promise<IJobPosition | null> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('id', sql.UniqueIdentifier, id);
    const result = await req.query<IJobPosition>(`
      SELECT ${SELECT_COLS} FROM dbo.job_positions WHERE id = @id AND aktivno = 1
    `);
    return result.recordset[0] ?? null;
  });
}

export async function createJobPosition(tenantId: string, dto: ICreateJobPositionDto): Promise<IJobPosition> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('tenantId',  sql.UniqueIdentifier, tenantId);
    req.input('naziv',     sql.NVarChar, dto.naziv_delovnega_mesta);
    req.input('razred',    sql.Int, dto.tarifni_razred);
    req.input('izobrazba', sql.NVarChar, dto.zahtevana_izobrazba ?? null);
    const result = await req.query<IJobPosition>(`
      INSERT INTO dbo.job_positions (tenant_id, naziv_delovnega_mesta, tarifni_razred, zahtevana_izobrazba)
      OUTPUT INSERTED.id, INSERTED.tenant_id, INSERTED.naziv_delovnega_mesta,
             INSERTED.tarifni_razred, INSERTED.zahtevana_izobrazba, INSERTED.aktivno
      VALUES (@tenantId, @naziv, @razred, @izobrazba)
    `);
    return result.recordset[0];
  });
}

export async function updateJobPosition(
  tenantId: string,
  id: string,
  dto: Partial<ICreateJobPositionDto>
): Promise<IJobPosition | null> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('id', sql.UniqueIdentifier, id);
    const sets: string[] = [];
    if (dto.naziv_delovnega_mesta !== undefined) {
      req.input('naziv', sql.NVarChar, dto.naziv_delovnega_mesta);
      sets.push('naziv_delovnega_mesta = @naziv');
    }
    if (dto.tarifni_razred !== undefined) {
      req.input('razred', sql.Int, dto.tarifni_razred);
      sets.push('tarifni_razred = @razred');
    }
    if (dto.zahtevana_izobrazba !== undefined) {
      req.input('izobrazba', sql.NVarChar, dto.zahtevana_izobrazba ?? null);
      sets.push('zahtevana_izobrazba = @izobrazba');
    }
    if (sets.length === 0) return findJobPositionById(tenantId, id);
    const result = await req.query<IJobPosition>(`
      UPDATE dbo.job_positions SET ${sets.join(', ')}
      OUTPUT INSERTED.id, INSERTED.tenant_id, INSERTED.naziv_delovnega_mesta,
             INSERTED.tarifni_razred, INSERTED.zahtevana_izobrazba, INSERTED.aktivno
      WHERE id = @id AND aktivno = 1
    `);
    return result.recordset[0] ?? null;
  });
}

export async function softDeleteJobPosition(tenantId: string, id: string): Promise<boolean> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('id', sql.UniqueIdentifier, id);
    const result = await req.query(`
      UPDATE dbo.job_positions SET aktivno = 0 WHERE id = @id AND aktivno = 1
    `);
    return (result.rowsAffected[0] ?? 0) > 0;
  });
}
