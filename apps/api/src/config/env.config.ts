export interface AppEnv {
  nodeEnv: string;
  port: number;
  redisUrl: string;
  jwtSecret: string;
  isProduction: boolean;
}

export function loadAppEnv(): AppEnv {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';

  const redisUrl = process.env.REDIS_URL?.trim();
  if (isProduction && !redisUrl) {
    throw new Error('REDIS_URL is required when NODE_ENV=production.');
  }

  return {
    nodeEnv,
    port: Number(process.env.PORT ?? 3001),
    redisUrl: redisUrl ?? 'redis://127.0.0.1:6380',
    jwtSecret: process.env.JWT_SECRET ?? 'fallback_secret_key_change_me_in_production',
    isProduction,
  };
}