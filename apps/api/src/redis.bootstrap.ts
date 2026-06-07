import { RedisMemoryServer } from 'redis-memory-server';
import { verifyRedisConnection } from './redis.connection';

let memoryServer: RedisMemoryServer | null = null;

async function startMemoryRedis(): Promise<string> {
  memoryServer = new RedisMemoryServer({
    instance: { port: 6380 },
  });
  await memoryServer.start();
  const host = await memoryServer.getHost();
  const port = await memoryServer.getPort();
  return `redis://${host}:${port}`;
}

export async function bootstrapRedis(isProduction: boolean): Promise<string> {
  const explicitUrl = process.env.REDIS_URL?.trim();
  const candidates: string[] = [];

  if (explicitUrl) {
    candidates.push(explicitUrl);
  } else if (!isProduction) {
    candidates.push('redis://127.0.0.1:6379');
  }

  for (const url of candidates) {
    if (await verifyRedisConnection(url)) {
      process.env.REDIS_URL = url;
      return url;
    }
  }

  if (!isProduction && process.env.REDIS_FALLBACK_MEMORY === 'true') {
    const memoryUrl = await startMemoryRedis();
    if (await verifyRedisConnection(memoryUrl)) {
      process.env.REDIS_URL = memoryUrl;
      console.warn(
        'WARNING: Using embedded redis-memory-server. For proper dev, run: npm run infra:up',
      );
      return memoryUrl;
    }
  }

  if (isProduction) {
    throw new Error(
      `Cannot connect to Redis at ${explicitUrl}. Production requires a reachable Redis 5+ instance.`,
    );
  }

  throw new Error(
    [
      'Redis 5+ is required but not reachable.',
      'Fix options:',
      '  1. npm run infra:up   (Docker Redis 7 on port 6379)',
      '  2. Set REDIS_URL to your Redis 5+ instance',
      '  3. Set REDIS_FALLBACK_MEMORY=true for embedded dev-only Redis (not for production)',
      'Note: Legacy Windows Redis 3.x is incompatible with BullMQ.',
    ].join('\n'),
  );
}

export async function teardownRedis() {
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}