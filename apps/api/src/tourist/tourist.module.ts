// apps/api/src/tourist/tourist.module.ts
import { Module } from '@nestjs/common';
import { TouristController } from './tourist.controller';
import { TouristService } from './tourist.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TouristController],
  providers: [TouristService],
  exports: [TouristService],
})
export class TouristModule {}
