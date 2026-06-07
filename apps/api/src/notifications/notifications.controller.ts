import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('my')
  async getMy(@Request() req) {
    return this.notificationsService.getMyNotifications(req.user.id);
  }
}

@Controller('ops/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPERATOR', 'ADMIN')
export class OpsNotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async listAll() {
    return this.notificationsService.listOpsNotifications();
  }
}