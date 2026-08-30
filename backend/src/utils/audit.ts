import sql from 'mssql';
import { withTenant } from '../config/db';

type Akcija = 'BRANJE' | 'VNOS' | 'POPRAVEK' | 'BRISANJE' | 'IZVOZ';

export async function logAudit(
  tenantId: string,
  userEmail: string,
  akcija: Akcija,
  entiteta: string,
  opis?: string,
  ipNaslov?: string,
): Promise<void> {
  try {
    await withTenant(tenantId, async (tx) => {
      const r = new sql.Request(tx);
      r.input('tenantId',  sql.UniqueIdentifier, tenantId);
      r.input('email',     sql.NVarChar(100),    userEmail);
      r.input('akcija',    sql.VarChar(20),       akcija);
      r.input('entiteta',  sql.VarChar(50),       entiteta);
      r.input('opis',      sql.NVarChar(255),     opis    ?? null);
      r.input('ip',        sql.VarChar(45),       ipNaslov ?? null);
      await r.query(`
        INSERT INTO dbo.audit_logs (tenant_id, user_email, akcija, entiteta, opis, ip_naslov)
        VALUES (@tenantId, @email, @akcija, @entiteta, @opis, @ip)
      `);
    });
  } catch (err) {
    // Audit failures must never break the main request
    console.error('[Audit] Failed to write audit log:', err);
  }
}
