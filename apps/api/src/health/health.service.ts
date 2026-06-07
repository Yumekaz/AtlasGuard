import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { verifyRedisConnection } from '../redis.connection';

export interface HealthCheckResult {
  ok: boolean;
  error?: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  checks: {
    database: HealthCheckResult;
    redis: HealthCheckResult;
  };
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getStatus(): Promise<HealthStatus> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      status: database.ok && redis.ok ? 'ok' : 'degraded',
      checks: { database, redis },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    const url = process.env.REDIS_URL?.trim();
    if (!url) {
      return { ok: false, error: 'REDIS_URL is not set' };
    }

    const reachable = await verifyRedisConnection(url);
    return reachable ? { ok: true } : { ok: false, error: 'Redis unreachable' };
  }
}