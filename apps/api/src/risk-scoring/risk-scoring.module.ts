import { Module } from '@nestjs/common';
import { RiskScoringService } from './risk-scoring.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RiskZonesModule } from '../risk-zones/risk-zones.module';

@Module({
  imports: [PrismaModule, RiskZonesModule],
  providers: [RiskScoringService],
  exports: [RiskScoringService],
})
export class RiskScoringModule {}