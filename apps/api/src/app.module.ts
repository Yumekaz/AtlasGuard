import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminController } from './admin/admin.controller';
import { OperatorController } from './operator/operator.controller';
import { ResponderController } from './responder/responder.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AppController, AdminController, OperatorController, ResponderController],
  providers: [AppService],
})
export class AppModule {}
