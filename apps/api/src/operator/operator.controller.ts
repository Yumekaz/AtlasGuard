import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OperatorService } from './operator.service';
import { AssignResponderDto } from '../incidents/dto/assign-responder.dto';

@Controller('ops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPERATOR', 'ADMIN')
export class OperatorController {
  constructor(private readonly operatorService: OperatorService) {}

  @Get('incidents')
  async getIncidents() {
    return this.operatorService.listIncidents();
  }

  @Get('incidents/:id')
  async getIncident(@Param('id') id: string) {
    return this.operatorService.getIncident(id);
  }

  @Post('incidents/:id/acknowledge')
  async acknowledge(@Request() req, @Param('id') id: string) {
    return this.operatorService.acknowledge(id, req.user.id, req.user.role);
  }

  @Post('incidents/:id/assign')
  async assign(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AssignResponderDto,
  ) {
    return this.operatorService.assign(id, dto.responderId, req.user.id, req.user.role);
  }

  @Get('responders')
  async getResponders() {
    return this.operatorService.listResponders();
  }
}

@Controller('operator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPERATOR', 'ADMIN')
export class OperatorCompatController {
  constructor(private readonly operatorService: OperatorService) {}

  @Get('incidents')
  async getIncidents() {
    return this.operatorService.listIncidents();
  }
}