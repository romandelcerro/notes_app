import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.userRepo.findOne({ where: { uid: payload.sub } });
    if (!user) throw new UnauthorizedException();
    if (user.isGuest && user.guestExpiresAt && user.guestExpiresAt < new Date()) {
      throw new UnauthorizedException('exception.auth.guestExpired');
    }
    return { uid: user.uid, email: user.email, isGuest: user.isGuest };
  }
}
