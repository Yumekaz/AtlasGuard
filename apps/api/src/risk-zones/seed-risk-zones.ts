import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface GeoJsonFeature {
  type: 'Feature';
  properties: {
    name: string;
    description: string;
    riskLevel: string;
  };
  geometry: object;
}

interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export async function seedRiskZones(prisma: PrismaClient, adminUserId: string) {
  const candidates = [
    path.resolve(process.cwd(), 'data/risk-zones.geojson'),
    path.resolve(process.cwd(), '../../data/risk-zones.geojson'),
    path.resolve(__dirname, '../../../../data/risk-zones.geojson'),
  ];
  const geoPath = candidates.find((p) => fs.existsSync(p));
  if (!geoPath) throw new Error('risk-zones.geojson not found');
  const raw = fs.readFileSync(geoPath, 'utf-8');
  const collection: GeoJsonCollection = JSON.parse(raw);

  for (const feature of collection.features) {
    const name = feature.properties.name;
    const existing = await prisma.riskZone.findFirst({ where: { name } });

    const data = {
      name,
      description: feature.properties.description,
      riskLevel: feature.properties.riskLevel,
      polygon: JSON.stringify(feature.geometry),
      active: true,
      createdBy: adminUserId,
    };

    if (existing) {
      await prisma.riskZone.update({ where: { id: existing.id }, data });
    } else {
      await prisma.riskZone.create({ data });
    }
  }
}