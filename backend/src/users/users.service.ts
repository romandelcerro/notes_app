import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity.js';
import { CacheService } from '../common/cache.service.js';

@Injectable()
export class UsersService {
  private readonly _logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly cache: CacheService,
  ) {}

  async findOne(uid: string) {
    const cacheKey = `users:${uid}:findOne`;
    const cached = await this.cache.get<UserEntity>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepo.findOne({ where: { uid } });
    if (!user) throw new NotFoundException('exception.user.notFound');
    await this.cache.set(cacheKey, user);
    return user;
  }

  async update(uid: string, data: { displayName?: string; photoURL?: string; username?: string }) {
    const user = await this.findOne(uid);
    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.photoURL !== undefined) user.photoURL = data.photoURL;
    if (data.username !== undefined) user.username = data.username;
    const saved = await this.userRepo.save(user);
    await this.cache.set(`users:${uid}:findOne`, saved);
    this._logger.log(`User updated: ${uid}`);
    return saved;
  }
}
