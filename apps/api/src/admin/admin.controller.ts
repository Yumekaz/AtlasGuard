import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RiskZonesService } from '../risk-zones/risk-zones.service';
import { seedRiskZones } from '../risk-zones/seed-risk-zones';
import * as bcrypt from 'bcryptjs';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private riskZonesService: RiskZonesService,
  ) {}

  @Get('risk-zones')
  async getRiskZones() {
    return this.riskZonesService.listAllZones();
  }

  @Get('users')
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  @Post('seed')
  async seed() {
    const plainPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // 1. Seed Tourist Account
    const touristUser = await this.prisma.user.upsert({
      where: { email: 'tourist@demo.com' },
      update: { passwordHash: hashedPassword },
      create: {
        name: 'Demo Tourist',
        email: 'tourist@demo.com',
        passwordHash: hashedPassword,
        role: 'TOURIST',
        status: 'ACTIVE',
      },
    });

    const touristProfile = await this.prisma.touristProfile.upsert({
      where: { userId: touristUser.id },
      update: {},
      create: {
        userId: touristUser.id,
        phone: '+15550199',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '+15550200',
        medicalNotes: 'No major allergies.',
        mobilityNeeds: 'None',
        languagePreference: 'en',
      },
    });

    const existingTrip = await this.prisma.trip.findFirst({
      where: { touristId: touristProfile.id, status: 'ACTIVE' },
    });
    if (!existingTrip) {
      await this.prisma.trip.create({
        data: {
          touristId: touristProfile.id,
          destinationName: 'Gangtok, Sikkim',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          safetyId: 'AG-GAN-DEMO',
          status: 'ACTIVE',
        },
      });
    }

    // 2. Seed Operator Account
    await this.prisma.user.upsert({
      where: { email: 'operator@demo.com' },
      update: { passwordHash: hashedPassword },
      create: {
        name: 'Demo Operator',
        email: 'operator@demo.com',
        passwordHash: hashedPassword,
        role: 'OPERATOR',
        status: 'ACTIVE',
      },
    });

    // 3. Seed Responder Account
    const responderUser = await this.prisma.user.upsert({
      where: { email: 'responder@demo.com' },
      update: { passwordHash: hashedPassword },
      create: {
        name: 'Demo Responder',
        email: 'responder@demo.com',
        passwordHash: hashedPassword,
        role: 'RESPONDER',
        status: 'ACTIVE',
      },
    });

    await this.prisma.responderProfile.upsert({
      where: { userId: responderUser.id },
      update: {},
      create: {
        userId: responderUser.id,
        phone: '+15550300',
        unitName: 'Gangtok Safety Unit Alpha',
        availabilityStatus: 'AVAILABLE',
        lastLatitude: 27.3314,
        lastLongitude: 88.6138,
      },
    });

    // 4. Seed Admin Account
    const adminUser = await this.prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: { passwordHash: hashedPassword },
      create: {
        name: 'Demo Admin',
        email: 'admin@demo.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    await seedRiskZones(this.prisma, adminUser.id);

    return { message: 'Seeding completed successfully' };
  }
}
