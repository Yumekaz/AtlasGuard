import { Module } from '@nestjs/common';
import { OperatorController, OperatorCompatController } from './operator.controller';
import { OperatorService } from './operator.service';
import { IncidentsModule } from '../incidents/incidents.module';
import { RiskZonesModule } from '../risk-zones/risk-zones.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [IncidentsModule, RiskZonesModule, PrismaModule],
  controllers: [OperatorController, OperatorCompatController],
  providers: [OperatorService],
})
export class OperatorModule {}