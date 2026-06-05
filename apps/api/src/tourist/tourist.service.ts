// apps/api/src/tourist/tourist.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CreateTripDtoImpl } from './dto/create-trip.dto';

@Injectable()
export class TouristService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.touristProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Tourist profile not found');
    }
    return profile;
  }

  async upsertProfile(userId: string, data: CreateProfileDto) {
    return this.prisma.touristProfile.upsert({
      where: { userId },
      update: {
        phone: data.phone,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        medicalNotes: data.medicalNotes,
        mobilityNeeds: data.mobilityNeeds,
        languagePreference: data.languagePreference,
      },
      create: {
        userId,
        phone: data.phone,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        medicalNotes: data.medicalNotes,
        mobilityNeeds: data.mobilityNeeds,
        languagePreference: data.languagePreference,
      },
    });
  }

  async getActiveTrip(userId: string) {
    const profile = await this.prisma.touristProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException('Please complete your safety profile first.');
    }

    return this.prisma.trip.findFirst({
      where: {
        touristId: profile.id,
        status: 'ACTIVE',
      },
    });
  }

  async createTrip(userId: string, data: CreateTripDtoImpl) {
    const profile = await this.prisma.touristProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException('Please complete your safety profile first.');
    }

    // Set any existing ACTIVE trips for this tourist to COMPLETED
    await this.prisma.trip.updateMany({
      where: {
        touristId: profile.id,
        status: 'ACTIVE',
      },
      data: {
        status: 'COMPLETED',
      },
    });

    // Generate unique Safety ID: AG-[DESTINATION_PREFIX]-[RANDOM_KEY]
    const destAbbrev = data.destinationName
      .trim()
      .replace(/[^a-zA-Z]/g, '') // strip spaces/special chars
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
    const randomKey = Math.random().toString(36).substring(2, 6).toUpperCase();
    const safetyId = `AG-${destAbbrev}-${randomKey}`;

    return this.prisma.trip.create({
      data: {
        touristId: profile.id,
        destinationName: data.destinationName,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        safetyId,
        status: 'ACTIVE',
      },
    });
  }
}
