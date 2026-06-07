import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IncidentsService } from './incidents.service';
import { EvidenceService } from './evidence.service';
import { TriggerSosDto } from './dto/trigger-sos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly evidenceService: EvidenceService,
  ) {}

  @Post('sos')
  @Roles('TOURIST')
  async triggerSos(@Request() req, @Body() dto: TriggerSosDto) {
    return this.incidentsService.triggerSos(req.user.id, dto);
  }

  @Get('my')
  @Roles('TOURIST')
  async getMyIncidents(@Request() req) {
    return this.incidentsService.getMyIncidents(req.user.id);
  }

  @Get(':id/status')
  @Roles('TOURIST', 'OPERATOR', 'RESPONDER', 'ADMIN')
  async getStatus(@Request() req, @Param('id') id: string) {
    return this.incidentsService.getIncidentStatus(req.user.id, req.user.role, id);
  }

  @Post(':id/cancel')
  @Roles('TOURIST')
  async cancel(@Request() req, @Param('id') id: string) {
    return this.incidentsService.cancelIncident(req.user.id, id);
  }

  @Get(':id/evidence')
  @Roles('TOURIST', 'OPERATOR', 'RESPONDER', 'ADMIN')
  async listEvidence(@Request() req, @Param('id') id: string) {
    return this.evidenceService.listEvidence(req.user.id, req.user.role, id);
  }

  @Post(':id/evidence')
  @Roles('TOURIST', 'RESPONDER', 'OPERATOR', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description?: string,
  ) {
    return this.evidenceService.uploadEvidence(
      req.user.id,
      req.user.role,
      id,
      file,
      description,
    );
  }
}