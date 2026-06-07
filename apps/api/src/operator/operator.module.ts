import { Module } from '@nestjs/common';
import { OperatorController, OperatorCompatController } from './operator.controller';
import { OperatorService } from './operator.service';
import { IncidentsModule } from '../incidents/incidents.module';
import { RiskZonesModule } from '../risk-zones/risk-zones.module';

@Module({
  imports: [IncidentsModule, RiskZonesModule],
  controllers: [OperatorController, OperatorCompatController],
  providers: [OperatorService],
})
export class OperatorModule {}