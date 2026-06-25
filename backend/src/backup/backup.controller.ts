import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BackupService, type BackupPayload } from './backup.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('export')
  exportBackup(@CurrentUser() user: { uid: string }) {
    return this.backupService.exportBackup(user.uid);
  }

  @Post('import')
  importBackup(
    @CurrentUser() user: { uid: string },
    @Body() data: BackupPayload,
  ) {
    return this.backupService.importBackup(user.uid, data);
  }
}
