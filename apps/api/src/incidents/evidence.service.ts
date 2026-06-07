import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EvidenceFile, UserRole } from '@atlasguard/shared';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentEventsService } from './incident-events.service';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'text/plain']);
const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class EvidenceService {
  private uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private eventsService: IncidentEventsService,
  ) {
    this.uploadDir = path.resolve(process.cwd(), 'uploads/evidence');
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  private async assertIncidentAccess(userId: string, role: UserRole, incidentId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: { tourist: true },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    if (role === 'TOURIST') {
      const profile = await this.prisma.touristProfile.findUnique({ where: { userId } });
      if (!profile || incident.touristId !== profile.id) {
        throw new ForbiddenException('You can only access your own incidents');
      }
    } else if (role === 'RESPONDER') {
      const responder = await this.prisma.responderProfile.findUnique({ where: { userId } });
      const assignment = await this.prisma.responderAssignment.findFirst({
        where: {
          incidentId,
          responderId: responder?.id,
          status: { in: ['ASSIGNED', 'ACCEPTED'] },
        },
      });
      if (!responder || !assignment) {
        throw new ForbiddenException('You can only access incidents assigned to you');
      }
    }

    return incident;
  }

  async uploadEvidence(
    userId: string,
    role: UserRole,
    incidentId: string,
    file: Express.Multer.File,
    description?: string,
  ): Promise<EvidenceFile> {
    await this.assertIncidentAccess(userId, role, incidentId);

    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, plain text');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('File must be under 5MB');
    }

    const ext = path.extname(file.originalname) || (file.mimetype === 'text/plain' ? '.txt' : '.jpg');
    const filename = `${incidentId}-${Date.now()}${ext}`;
    const dest = path.join(this.uploadDir, filename);
    fs.writeFileSync(dest, file.buffer);

    const fileType = file.mimetype.startsWith('image/') ? 'image' : 'text';
    const fileUrl = `/uploads/evidence/${filename}`;

    const evidence = await this.prisma.$transaction(async (tx) => {
      const created = await tx.evidenceFile.create({
        data: {
          incidentId,
          uploadedById: userId,
          fileUrl,
          fileType,
          description,
        },
        include: { uploadedBy: true },
      });

      await this.eventsService.appendEvent(tx, {
        incidentId,
        actorId: userId,
        eventType: 'NOTE_ADDED',
        metadata: {
          evidenceId: created.id,
          fileType,
          fileUrl,
          description,
        },
      });

      return created;
    });

    return {
      id: evidence.id,
      incidentId: evidence.incidentId,
      uploadedById: evidence.uploadedById,
      uploadedByName: evidence.uploadedBy.name,
      fileUrl: evidence.fileUrl,
      fileType: evidence.fileType,
      description: evidence.description ?? undefined,
      createdAt: evidence.createdAt.toISOString(),
    };
  }

  async listEvidence(userId: string, role: UserRole, incidentId: string): Promise<EvidenceFile[]> {
    await this.assertIncidentAccess(userId, role, incidentId);

    const files = await this.prisma.evidenceFile.findMany({
      where: { incidentId },
      include: { uploadedBy: true },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((f) => ({
      id: f.id,
      incidentId: f.incidentId,
      uploadedById: f.uploadedById,
      uploadedByName: f.uploadedBy.name,
      fileUrl: f.fileUrl,
      fileType: f.fileType,
      description: f.description ?? undefined,
      createdAt: f.createdAt.toISOString(),
    }));
  }
}