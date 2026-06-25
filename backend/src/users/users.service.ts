import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity.js';

@Injectable()
export class UsersService {
  private readonly _logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findOne(uid: string) {
    const user = await this.userRepo.findOne({ where: { uid } });
    if (!user) throw new NotFoundException('exception.user.notFound');
    return user;
  }

  async update(uid: string, data: { displayName?: string; photoURL?: string }) {
    const user = await this.findOne(uid);
    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.photoURL !== undefined) user.photoURL = data.photoURL;
    const saved = await this.userRepo.save(user);
    this._logger.log(`User updated: ${uid}`);
    return saved;
  }
}
