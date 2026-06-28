import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll(@CurrentUser() user: { uid: string }) {
    return this.sessionsService.findActiveByUser(user.uid);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: { uid: string }, @Param('id') id: string) {
    return this.sessionsService.revoke(id);
  }
}
