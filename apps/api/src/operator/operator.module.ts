import { Module } from '@nestjs/common';
import { OperatorController, OperatorCompatController } from './operator.controller';
import { OperatorService } from './operator.service';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [IncidentsModule],
  controllers: [OperatorController, OperatorCompatController],
  providers: [OperatorService],
})
export class OperatorModule {}