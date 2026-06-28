import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: { uid: string }) {
    return this.usersService.findOne(user.uid);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: { uid: string },
    @Body() body: { displayName?: string; photoURL?: string; username?: string },
  ) {
    return this.usersService.update(user.uid, body);
  }
}
