import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  GoneException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../entities/user.entity.js';
import { CacheService, CACHE_TTL } from '../common/cache.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { GuestDto } from './dto/guest.dto.js';
import type { UserResponse } from '@notes-app/shared';
import { ConvertGuestDto } from './dto/convert-guest.dto.js';

const GUEST_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly _logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly cache: CacheService,
    private readonly sessionsService: SessionsService,
  ) {}

  async signup(dto: SignUpDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('exception.auth.emailRegistered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      username: dto.username,
    });
    await this.userRepo.save(user);

    this._logger.log(`User registered: ${user.email} (${user.uid})`);
    return this._buildResponse(user);
  }

  async signin(dto: SignInDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('exception.auth.invalidCredentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('exception.auth.invalidCredentials');

    this._logger.log(`User signed in: ${user.email} (${user.uid})`);
    return this._buildResponse(user);
  }

  async guest(dto: GuestDto) {
    await this._cleanupExpiredGuests();

    let user = await this.userRepo.findOne({
      where: { username: dto.username, isGuest: true },
    });
    const now = new Date();
    if (user && user.guestExpiresAt && user.guestExpiresAt < now) {
      await this.userRepo.delete(user.uid);
      user = null;
    }
    if (!user) {
      const email =
        dto.email ??
        `${dto.username.replace(/\s+/g, '.').toLowerCase()}.${crypto.randomUUID().slice(0, 8)}@guest.local`;
      user = this.userRepo.create({
        email,
        passwordHash: '',
        username: dto.username,
        isGuest: true,
        guestExpiresAt: new Date(Date.now() + GUEST_TTL_MS),
      });
      await this.userRepo.save(user);
    }

    this._logger.log(`Guest session created: ${user.username} (${user.uid})`);
    return this._buildResponse(user, true);
  }

  async convertGuest(uid: string, dto: ConvertGuestDto) {
    const user = await this.userRepo.findOneOrFail({ where: { uid } });
    if (!user.isGuest) throw new BadRequestException('exception.auth.notGuest');

    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing && existing.uid !== uid) {
      throw new ConflictException('exception.auth.emailRegistered');
    }

    user.email = dto.email;
    user.passwordHash = await bcrypt.hash(dto.password, 10);
    user.isGuest = false;
    user.guestExpiresAt = null;
    await this.userRepo.save(user);
    await this.cache.del(`auth:profile:${uid}`);

    this._logger.log(`Guest converted: ${user.email} (${user.uid})`);
    return this._buildResponse(user);
  }

  async getProfile(uid: string) {
    const cacheKey = `auth:profile:${uid}`;
    const cached = await this.cache.get<UserResponse>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepo.findOneOrFail({ where: { uid } });
    if (user.isGuest && user.guestExpiresAt && user.guestExpiresAt < new Date()) {
      throw new GoneException('exception.auth.guestExpired');
    }
    const response = this._toUserResponse(user);
    await this.cache.set(cacheKey, response, CACHE_TTL.ITEM);
    return response;
  }

  async refresh(refreshToken: string, _deviceInfo?: string, _ipAddress?: string) {
    const session = await this.sessionsService.findByRefreshToken(refreshToken);
    if (!session) throw new UnauthorizedException('exception.auth.invalidRefreshToken');

    const user = await this.userRepo.findOne({ where: { uid: session.userId } });
    if (!user) throw new UnauthorizedException('exception.auth.userNotFound');

    const { rawToken: newRaw } = await this.sessionsService.rotate(session);

    const payload = { sub: user.uid, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      accessToken,
      refreshToken: newRaw,
    };
  }

  async logout(uid: string, refreshToken: string) {
    const ses = await this.sessionsService.findByRefreshToken(refreshToken);
    if (ses) {
      await this.sessionsService.revoke(ses.id);
    }
    await this.cache.delByPrefix(`auth:profile:${uid}`);
  }

  async logoutAll(uid: string) {
    await this.sessionsService.revokeAllForUser(uid);
    await this.cache.delByPrefix(`auth:profile:${uid}`);
  }

  private async _cleanupExpiredGuests() {
    const result = await this.userRepo.delete({
      isGuest: true,
      guestExpiresAt: LessThan(new Date()),
    });
    if (result.affected && result.affected > 0) {
      this._logger.log(`Cleaned up ${result.affected} expired guest(s)`);
    }
  }

  private async _buildResponse(user: UserEntity, isGuest = false) {
    const { rawToken } = await this.sessionsService.create(user.uid, 'Auth login');
    const expiresIn = isGuest ? '24h' : '7d';
    const payload = { sub: user.uid, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn }),
      refreshToken: rawToken,
      user: this._toUserResponse(user),
    };
  }

  private _toUserResponse(user: UserEntity): UserResponse {
    return {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL,
      username: user.username,
      isGuest: user.isGuest,
      isVerified: user.isVerified,
      plan: (user.plan as 'basic' | 'pro') ?? 'basic',
      storageUsedBytes: Number(user.storageUsedBytes),
      guestExpiresAt: user.guestExpiresAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
