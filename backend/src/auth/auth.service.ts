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
import { SignUpDto } from './dto/sign-up.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { GuestDto } from './dto/guest.dto.js';
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
      displayName: dto.displayName,
    });
    await this.userRepo.save(user);

    this._logger.log(`User registered: ${user.email} (${user.uid})`);
    return this._buildResponse(user);
  }

  async signin(dto: SignInDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user)
      throw new UnauthorizedException('exception.auth.invalidCredentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid)
      throw new UnauthorizedException('exception.auth.invalidCredentials');

    this._logger.log(`User signed in: ${user.email} (${user.uid})`);
    return this._buildResponse(user);
  }

  async guest(dto: GuestDto) {
    await this._cleanupExpiredGuests();

    let user = await this.userRepo.findOne({
      where: { displayName: dto.displayName, isGuest: true },
    });
    const now = new Date();
    if (user && user.guestExpiresAt && user.guestExpiresAt < now) {
      await this.userRepo.delete(user.uid);
      user = null;
    }
    if (!user) {
      const email =
        dto.email ??
        `${dto.displayName.replace(/\s+/g, '.').toLowerCase()}.${crypto.randomUUID().slice(0, 8)}@guest.local`;
      user = this.userRepo.create({
        email,
        passwordHash: '',
        displayName: dto.displayName,
        isGuest: true,
        guestExpiresAt: new Date(Date.now() + GUEST_TTL_MS),
      });
      await this.userRepo.save(user);
    }

    this._logger.log(
      `Guest session created: ${user.displayName} (${user.uid})`,
    );
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
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepo.findOneOrFail({ where: { uid } });
    if (
      user.isGuest &&
      user.guestExpiresAt &&
      user.guestExpiresAt < new Date()
    ) {
      throw new GoneException('exception.auth.guestExpired');
    }
    const response = this._toUserResponse(user);
    await this.cache.set(cacheKey, response, CACHE_TTL.ITEM);
    return response;
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

  private _buildResponse(user: UserEntity, isGuest = false) {
    const expiresIn = isGuest ? '24h' : '7d';
    const payload = { sub: user.uid, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn }),
      user: this._toUserResponse(user),
    };
  }

  private _toUserResponse(user: UserEntity) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isGuest: user.isGuest,
      guestExpiresAt: user.guestExpiresAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
