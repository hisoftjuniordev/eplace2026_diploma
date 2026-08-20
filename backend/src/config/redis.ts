import Redis from 'ioredis';
import 'dotenv/config';

let _client: Redis | null = null;

export function getRedis(): Redis {
  if (!_client) {
    _client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });
    _client.on('connect', () => console.log('[Redis] Connected'));
    _client.on('error', (err) => console.error('[Redis] Error:', err));
  }
  return _client;
}
