import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SectionEntity } from '../entities/section.entity.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { UpdateSectionDto } from './dto/update-section.dto.js';

@Injectable()
export class SectionsService {
  private readonly _logger = new Logger(SectionsService.name);

  constructor(
    @InjectRepository(SectionEntity)
    private readonly sectionRepo: Repository<SectionEntity>,
  ) {}

  async findAll(userId: string) {
    return this.sectionRepo.find({
      where: { userId },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: number, userId: string) {
    const section = await this.sectionRepo.findOne({ where: { id, userId } });
    if (!section) throw new NotFoundException('exception.section.notFound');
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
    this._logger.log(`Section created: ${saved.id} by user ${userId}`);
    return saved;
  }

  async update(id: number, userId: string, dto: UpdateSectionDto) {
    const section = await this.findOne(id, userId);
    Object.assign(section, dto);
    const saved = await this.sectionRepo.save(section);
    this._logger.log(`Section updated: ${saved.id}`);
    return saved;
  }

  async remove(id: number, userId: string) {
    const section = await this.findOne(id, userId);
    await this.sectionRepo.remove(section);
    this._logger.log(`Section removed: ${id}`);
  }
}
