import { RedisMemoryServer } from 'redis-memory-server';

let memoryServer: RedisMemoryServer | null = null;

export async function bootstrapRedis(): Promise<string> {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  memoryServer = new RedisMemoryServer({
    instance: { port: 6380 },
  });
  await memoryServer.start();
  const host = await memoryServer.getHost();
  const port = await memoryServer.getPort();
  const url = `redis://${host}:${port}`;
  process.env.REDIS_URL = url;
  return url;
}

export async function teardownRedis() {
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}