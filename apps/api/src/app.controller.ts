import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { UserRole } from '@atlasguard/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('roles')
  getRoles(): UserRole[] {
    return ['TOURIST', 'OPERATOR', 'RESPONDER', 'ADMIN'];
  }
}
