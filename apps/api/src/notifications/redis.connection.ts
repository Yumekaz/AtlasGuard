export function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is required for BullMQ notifications (Phase 5).');
  }
  return { url };
}