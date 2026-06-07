import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedRiskZones } from '../risk-zones/seed-risk-zones';
import { IncidentEventsService } from '../incidents/incident-events.service';

export const DEMO_PASSWORD = 'password123';

export const DEMO_MEDICAL_NOTES =
  'Severe asthma — carries rescue inhaler. High altitude sensitivity.';

export const DEMO_MOBILITY_NEEDS = 'Limited mobility — knee injury';

/** Realistic operator acknowledge delay shown on dashboard analytics (minutes). */
export const DEMO_ACKNOWLEDGE_DELAY_MINUTES = 2.5;

let demoSimLock: Promise<void> = Promise.resolve();

export async function withDemoSimLock<T>(fn: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = demoSimLock;
  demoSimLock = previous.then(() => gate);
  await previous;
  try {
    return await fn();
  } finally {
    release();
  }
}

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

  const operatorUser = await prisma.user.upsert({
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

  return { touristProfile, adminUser, responderUser, operatorUser };
}

export async function cancelOpenIncidents(
  tx: Prisma.TransactionClient,
  eventsService: IncidentEventsService,
  actorId: string,
) {
  const openIncidents = await tx.incident.findMany({
    where: { status: { notIn: ['RESOLVED', 'CANCELLED'] } },
    select: { id: true, status: true, tourist: { select: { userId: true } } },
  });

  for (const incident of openIncidents) {
    if (incident.status === 'CREATED') {
      await tx.incident.update({
        where: { id: incident.id },
        data: { status: 'CANCELLED' },
      });
      await eventsService.appendEvent(tx, {
        incidentId: incident.id,
        actorId: incident.tourist.userId,
        eventType: 'CANCELLED',
        metadata: { reason: 'demo_reset' },
      });
    } else {
      await tx.incident.update({
        where: { id: incident.id },
        data: { status: 'RESOLVED' },
      });
      await tx.responderAssignment.updateMany({
        where: { incidentId: incident.id, status: { in: ['ASSIGNED', 'ACCEPTED'] } },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await eventsService.appendEvent(tx, {
        incidentId: incident.id,
        actorId,
        eventType: 'RESOLVED',
        metadata: { reason: 'demo_reset' },
      });
    }
  }

  return openIncidents.length;
}

export async function prepareDemoScenario(
  prisma: PrismaClient,
  eventsService: IncidentEventsService,
  touristProfileId: string,
  adminUserId: string,
) {
  return prisma.$transaction(async (tx) => {
    const cancelledCount = await cancelOpenIncidents(tx, eventsService, adminUserId);

    await tx.touristProfile.update({
      where: { id: touristProfileId },
      data: {
        medicalNotes: DEMO_MEDICAL_NOTES,
        mobilityNeeds: DEMO_MOBILITY_NEEDS,
      },
    });

    await tx.responderProfile.updateMany({
      where: { user: { email: 'responder@demo.com' } },
      data: {
        lastLatitude: 27.31,
        lastLongitude: 88.58,
      },
    });

    return cancelledCount;
  });
}

/**
 * Backdates incident and audit events so dashboard averageResponseTimeMinutes
 * reflects a realistic ~2–3 minute operator acknowledge after simulate-demo.
 */
export async function applyDemoAcknowledgeTiming(
  prisma: PrismaClient,
  eventsService: IncidentEventsService,
  incidentId: string,
  responseMinutes = DEMO_ACKNOWLEDGE_DELAY_MINUTES,
) {
  const events = await prisma.incidentEvent.findMany({
    where: { incidentId },
    orderBy: { createdAt: 'asc' },
  });
  if (events.length === 0) return;

  const sosCreatedAt = new Date(
    Date.now() - (responseMinutes + 0.5) * 60 * 1000,
  );

  await prisma.incident.update({
    where: { id: incidentId },
    data: { createdAt: sosCreatedAt, updatedAt: new Date() },
  });

  let previousHash = 'GENESIS';
  for (const event of events) {
    const createdAt =
      event.eventType === 'SOS_TRIGGERED'
        ? sosCreatedAt
        : event.eventType === 'ACKNOWLEDGED'
          ? new Date(sosCreatedAt.getTime() + responseMinutes * 60 * 1000)
          : event.createdAt;

    const metadataStr = event.metadata ?? '{}';
    const currentHash = eventsService.computeHash(
      event.incidentId,
      event.actorId,
      event.eventType,
      metadataStr,
      createdAt,
      previousHash,
    );

    await prisma.incidentEvent.update({
      where: { id: event.id },
      data: { createdAt, previousHash, currentHash },
    });
    previousHash = currentHash;
  }
}