import { Queue } from 'bullmq';

const PING_QUEUE = 'atlasguard-redis-ping';

export function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is not set. Start Redis (npm run infra:up) or configure REDIS_URL.');
  }
  return { url };
}

export async function verifyRedisConnection(
  url: string,
  timeoutMs = 5000,
): Promise<boolean> {
  const queue = new Queue(PING_QUEUE, {
    connection: {
      url,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    },
  });

  queue.on('error', () => {});

  try {
    await Promise.race([
      queue.getJobCounts(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis verification timed out')), timeoutMs),
      ),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    try {
      await queue.close();
    } catch {
      // ignore close errors during failed verification
    }
  }
}