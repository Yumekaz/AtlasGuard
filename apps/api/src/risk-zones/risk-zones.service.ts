import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeoJsonPolygon, RiskZone } from '@atlasguard/shared';

@Injectable()
export class RiskZonesService {
  constructor(private prisma: PrismaService) {}

  private mapZone(zone: any): RiskZone {
    return {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      riskLevel: zone.riskLevel,
      polygon: JSON.parse(zone.polygon) as GeoJsonPolygon,
      active: zone.active,
      createdAt: zone.createdAt.toISOString(),
    };
  }

  async listActiveZones(): Promise<RiskZone[]> {
    const zones = await this.prisma.riskZone.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return zones.map((z) => this.mapZone(z));
  }

  async listAllZones(): Promise<RiskZone[]> {
    const zones = await this.prisma.riskZone.findMany({
      orderBy: { name: 'asc' },
    });
    return zones.map((z) => this.mapZone(z));
  }

  async getZonesForCheck() {
    const zones = await this.listActiveZones();
    return zones.map((z) => ({
      id: z.id,
      name: z.name,
      description: z.description,
      riskLevel: z.riskLevel,
      polygon: z.polygon,
    }));
  }
}