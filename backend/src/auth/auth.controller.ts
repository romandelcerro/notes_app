import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { GuestDto } from './dto/guest.dto.js';
import { ConvertGuestDto } from './dto/convert-guest.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignUpDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  signin(@Body() dto: SignInDto) {
    return this.authService.signin(dto);
  }

  @Post('guest')
  guest(@Body() dto: GuestDto) {
    return this.authService.guest(dto);
  }

  @Post('convert-guest')
  @UseGuards(JwtAuthGuard)
  convertGuest(
    @Body() dto: ConvertGuestDto,
    @CurrentUser() user: { uid: string },
  ) {
    return this.authService.convertGuest(user.uid, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: { uid: string; email: string }) {
    return this.authService.getProfile(user.uid);
  }
}
