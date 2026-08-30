import 'express-async-errors';
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { authRouter } from './controllers/auth.controller';
import { employeesRouter } from './controllers/employees.controller';
import { hoursRouter } from './controllers/hours.controller';
import { payrollRouter } from './controllers/payroll.controller';
import { exportRouter } from './controllers/export.controller';
import { jobPositionsRouter } from './controllers/jobpositions.controller';
import { payrollParamsRouter } from './controllers/payroll-params.controller';
import { settingsRouter } from './controllers/settings.controller';
import { authMiddleware } from './middleware/auth.middleware';
import { getPool } from './config/db';
import './workers/payroll.worker';

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.use('/api/v1/auth',          authRouter);
app.use('/api/v1/employees',     authMiddleware, employeesRouter);
app.use('/api/v1/hours',         authMiddleware, hoursRouter);
app.use('/api/v1/payroll',       authMiddleware, payrollRouter);
app.use('/api/v1/export',        authMiddleware, exportRouter);
app.use('/api/v1/job-positions',   authMiddleware, jobPositionsRouter);
app.use('/api/v1/payroll-params',  authMiddleware, payrollParamsRouter);
app.use('/api/v1/settings',        authMiddleware, settingsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Global error handler — must have 4 params so Express recognises it as error middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.message, err.stack);
  res.status(500).json({ error: 'Interna napaka strežnika', detail: err.message });
});

const PORT = parseInt(process.env.PORT || '3000');

async function main() {
  await getPool();
  app.listen(PORT, () => {
    console.log(`[App] ePlače 2026 backend running on http://localhost:${PORT}`);
    console.log('[App] Payroll worker running in-process');
  });
}

main().catch(console.error);
