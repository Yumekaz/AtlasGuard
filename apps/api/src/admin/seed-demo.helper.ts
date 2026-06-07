import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedRiskZones } from '../risk-zones/seed-risk-zones';

export const DEMO_PASSWORD = 'password123';

export const DEMO_MEDICAL_NOTES =
  'Severe asthma — carries rescue inhaler. High altitude sensitivity.';

export async function seedDemoAccounts(prisma: PrismaClient) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, salt);

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

  await seedRiskZones(prisma, adminUser.id);

  return { touristProfile, adminUser };
}

export async function cancelOpenIncidents(prisma: PrismaClient) {
  const openIncidents = await prisma.incident.findMany({
    where: { status: { notIn: ['RESOLVED', 'CANCELLED'] } },
    select: { id: true, status: true, tourist: { select: { userId: true } } },
  });

  for (const incident of openIncidents) {
    if (incident.status === 'CREATED') {
      await prisma.incident.update({
        where: { id: incident.id },
        data: { status: 'CANCELLED' },
      });
      await prisma.incidentEvent.create({
        data: {
          incidentId: incident.id,
          actorId: incident.tourist.userId,
          eventType: 'CANCELLED',
          metadata: JSON.stringify({ reason: 'demo_reset' }),
          previousHash: 'GENESIS',
          currentHash: `demo-cancel-${incident.id}`,
        },
      });
    } else {
      await prisma.incident.update({
        where: { id: incident.id },
        data: { status: 'RESOLVED' },
      });
      await prisma.responderAssignment.updateMany({
        where: { incidentId: incident.id, status: { in: ['ASSIGNED', 'ACCEPTED'] } },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
  }

  return openIncidents.length;
}