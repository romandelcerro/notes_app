import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SectionEntity } from '../entities/section.entity.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { UpdateSectionDto } from './dto/update-section.dto.js';
import { CacheService, CACHE_TTL } from '../common/cache.service.js';

@Injectable()
export class SectionsService {
  private readonly _logger = new Logger(SectionsService.name);

  constructor(
    @InjectRepository(SectionEntity)
    private readonly sectionRepo: Repository<SectionEntity>,
    private readonly cache: CacheService,
  ) {}

  async findAll(userId: string) {
    const cacheKey = `sections:${userId}:findAll:`;
    const cached = await this.cache.get<SectionEntity[]>(cacheKey);
    if (cached) return cached;

    const result = await this.sectionRepo.find({
      where: { userId, deletedAt: IsNull() },
      order: { order: 'ASC' },
    });
    await this.cache.set(cacheKey, result, CACHE_TTL.LIST);
    return result;
  }

  async findOne(id: number, userId: string) {
    const cacheKey = `sections:${userId}:findOne:${id}`;
    const cached = await this.cache.get<SectionEntity>(cacheKey);
    if (cached) return cached;

    const section = await this.sectionRepo.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });
    if (!section) throw new NotFoundException('exception.section.notFound');
    await this.cache.set(cacheKey, section);
    return section;
  }

  async create(userId: string, dto: CreateSectionDto) {
    const count = await this.sectionRepo.count({ where: { userId } });
    const section = this.sectionRepo.create({
      name: dto.name,
      userId,
      order: count,
      isDefault: dto.isDefault ?? false,
    });
    const saved = await this.sectionRepo.save(section);
    await this.cache.delByPrefix(`sections:${userId}:`);
    this._logger.log(`Section created: ${saved.id} by user ${userId}`);
    return saved;
  }

  async update(id: number, userId: string, dto: UpdateSectionDto) {
    const section = await this.findOne(id, userId);
    Object.assign(section, dto);
    const saved = await this.sectionRepo.save(section);
    await this.cache.set(`sections:${userId}:findOne:${id}`, saved);
    await this.cache.delByPrefix(`sections:${userId}:findAll:`);
    this._logger.log(`Section updated: ${saved.id}`);
    return saved;
  }

  async remove(id: number, userId: string) {
    const section = await this.findOne(id, userId);
    await this.sectionRepo.remove(section);
    await this.cache.del(`sections:${userId}:findOne:${id}`);
    await this.cache.delByPrefix(`sections:${userId}:findAll:`);
    this._logger.log(`Section removed: ${id}`);
  }
}
