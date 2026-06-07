import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TouristModule } from './tourist/tourist.module';
import { AdminController } from './admin/admin.controller';
import { IncidentsModule } from './incidents/incidents.module';
import { OperatorModule } from './operator/operator.module';
import { ResponderModule } from './responder/responder.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TouristModule,
    EventsModule,
    IncidentsModule,
    OperatorModule,
    ResponderModule,
  ],
  controllers: [AppController, AdminController],
  providers: [AppService],
})
export class AppModule {}