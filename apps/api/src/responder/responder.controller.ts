import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponderService } from './responder.service';

@Controller('responder')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RESPONDER', 'ADMIN')
export class ResponderController {
  constructor(private readonly responderService: ResponderService) {}

  @Get('assignments')
  async getAssignments(@Request() req) {
    return this.responderService.getAssignments(req.user.id);
  }

  @Post('incidents/:id/dispatched')
  async markDispatched(@Request() req, @Param('id') id: string) {
    return this.responderService.markDispatched(id, req.user.id, req.user.role);
  }

  @Post('incidents/:id/reached')
  async markReached(@Request() req, @Param('id') id: string) {
    return this.responderService.markReached(id, req.user.id, req.user.role);
  }

  @Post('incidents/:id/resolved')
  async markResolved(@Request() req, @Param('id') id: string) {
    return this.responderService.markResolved(id, req.user.id, req.user.role);
  }
}