// apps/api/prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedRiskZones } from '../src/risk-zones/seed-risk-zones';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password for all demo accounts
  const plainPassword = 'password123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  // 1. Seed Tourist Account
  console.log('Seeding tourist account...');
  const touristUser = await prisma.user.upsert({
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

  const touristProfile = await prisma.touristProfile.upsert({
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

  // Seed an active trip so SOS demo works out of the box
  const existingTrip = await prisma.trip.findFirst({
    where: { touristId: touristProfile.id, status: 'ACTIVE' },
  });
  if (!existingTrip) {
    await prisma.trip.create({
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
  console.log('Seeding operator account...');
  await prisma.user.upsert({
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
  console.log('Seeding responder account...');
  const responderUser = await prisma.user.upsert({
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

  await prisma.responderProfile.upsert({
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
  console.log('Seeding admin account...');
  const adminUser = await prisma.user.upsert({
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

  console.log('Seeding risk zones...');
  await seedRiskZones(prisma, adminUser.id);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
