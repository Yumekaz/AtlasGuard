import { Module } from '@nestjs/common';
import { ResponderController } from './responder.controller';
import { ResponderService } from './responder.service';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [IncidentsModule],
  controllers: [ResponderController],
  providers: [ResponderService],
})
export class ResponderModule {}