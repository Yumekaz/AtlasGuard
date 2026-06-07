import { Module } from '@nestjs/common';
import { RiskZonesController } from './risk-zones.controller';
import { RiskZonesService } from './risk-zones.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RiskZonesController],
  providers: [RiskZonesService],
  exports: [RiskZonesService],
})
export class RiskZonesModule {}