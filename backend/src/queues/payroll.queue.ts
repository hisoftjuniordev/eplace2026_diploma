import { Queue } from 'bullmq';
import { getRedis } from '../config/redis';

export interface PayrollJobData {
  payrollRunId: string;
  tenantId: string;
  leto: number;
  mesec: number;
}

export const payrollQueue = new Queue<PayrollJobData>('payrollQueue', {
  connection: getRedis(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});
