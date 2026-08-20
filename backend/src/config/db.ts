import sql from 'mssql';
import 'dotenv/config';

const config: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'eplace2026',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let _pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!_pool) {
    _pool = await new sql.ConnectionPool(config).connect();
    console.log('[DB] Connected to MS SQL Server');
  }
  return _pool;
}

// Runs fn inside a transaction with SESSION_CONTEXT set for RLS
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: sql.Transaction) => Promise<T>
): Promise<T> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const setup = new sql.Request(transaction);
    setup.input('tenantId', sql.UniqueIdentifier, tenantId);
    await setup.query(
      `EXEC sp_set_session_context @key=N'tenant_id', @value=@tenantId, @readonly=0`
    );
    const result = await fn(transaction);
    await transaction.commit();
    return result;
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

// For system-level queries (auth, no tenant context)
export async function sysQuery<T = any>(
  queryText: string,
  bind?: (req: sql.Request) => void
): Promise<sql.IResult<T>> {
  const pool = await getPool();
  const req = pool.request();
  if (bind) bind(req);
  return req.query<T>(queryText);
}
