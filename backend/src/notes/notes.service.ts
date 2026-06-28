import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { NoteEntity } from '../entities/note.entity.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { NoteQueryDto } from './dto/note-query.dto.js';
import { CacheService, CACHE_TTL } from '../common/cache.service.js';

@Injectable()
export class NotesService {
  private readonly _logger = new Logger(NotesService.name);

  constructor(
    @InjectRepository(NoteEntity)
    private readonly noteRepo: Repository<NoteEntity>,
    private readonly cache: CacheService,
  ) {}

  async findAll(userId: string, query?: NoteQueryDto) {
    const cacheKey = `notes:${userId}:findAll:${JSON.stringify(query ?? {})}`;
    const cached = await this.cache.get<NoteEntity[]>(cacheKey);
    if (cached) return cached;

    const qb = this.noteRepo
      .createQueryBuilder('note')
      .where('note.userId = :userId', { userId })
      .andWhere('note.deletedAt IS NULL');

    if (query?.sectionId) {
      qb.andWhere('note.sectionId = :sectionId', {
        sectionId: Number(query.sectionId),
      });
    }
    if (query?.pinned !== undefined) {
      qb.andWhere('note.pinned = :pinned', { pinned: query.pinned === 'true' });
    }
    if (query?.query) {
      qb.andWhere('(note.title LIKE :q OR note.content LIKE :q)', {
        q: `%${query.query}%`,
      });
    }
    if (query?.dateFrom) {
      qb.andWhere('note.createdAt >= :dateFrom', {
        dateFrom: new Date(query.dateFrom),
      });
    }
    if (query?.dateTo) {
      qb.andWhere('note.createdAt <= :dateTo', {
        dateTo: new Date(query.dateTo),
      });
    }

    qb.orderBy('note.pinned', 'DESC').addOrderBy('note.updatedAt', 'DESC');

    const result = await qb.getMany();
    await this.cache.set(cacheKey, result, CACHE_TTL.LIST);
    return result;
  }

  async findOne(id: number, userId: string) {
    const cacheKey = `notes:${userId}:findOne:${id}`;
    const cached = await this.cache.get<NoteEntity>(cacheKey);
    if (cached) return cached;

    const note = await this.noteRepo.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });
    if (!note) throw new NotFoundException('exception.note.notFound');
    await this.cache.set(cacheKey, note);
    return note;
  }

  async create(userId: string, dto: CreateNoteDto) {
    const note = this.noteRepo.create({ ...dto, userId });
    const saved = await this.noteRepo.save(note);
    await this.cache.delByPrefix(`notes:${userId}:`);
    this._logger.log(`Note created: ${saved.id} by user ${userId}`);
    return saved;
  }

  async update(id: number, userId: string, dto: UpdateNoteDto) {
    const note = await this.findOne(id, userId);
    Object.assign(note, dto);
    const saved = await this.noteRepo.save(note);
    await this.cache.set(`notes:${userId}:findOne:${id}`, saved);
    await this.cache.delByPrefix(`notes:${userId}:findAll:`);
    this._logger.log(`Note updated: ${saved.id}`);
    return saved;
  }

  async remove(id: number, userId: string) {
    const note = await this.findOne(id, userId);
    await this.noteRepo.remove(note);
    await this.cache.del(`notes:${userId}:findOne:${id}`);
    await this.cache.delByPrefix(`notes:${userId}:findAll:`);
    this._logger.log(`Note removed: ${id}`);
  }

  async reorder(userId: string, groupKey: string, noteIds: number[]) {
    const sectionId = groupKey === '__default' ? null : Number(groupKey.replace(/^sec-/, ''));
    if (groupKey !== '__default' && Number.isNaN(sectionId)) {
      throw new BadRequestException(`Invalid groupKey: ${groupKey}`);
    }
    const notes = await this.noteRepo.find({
      where:
        sectionId === null
          ? { userId, sectionId: IsNull(), deletedAt: IsNull() }
          : { userId, sectionId, deletedAt: IsNull() },
    });
    const noteMap = new Map(notes.map((n) => [n.id, n]));
    const ordered = noteIds.filter((id) => noteMap.has(id));
    for (let i = 0; i < ordered.length; i++) {
      const note = noteMap.get(ordered[i]);
      if (note) {
        note.pinned = i < ordered.length ? note.pinned : false;
        await this.noteRepo.save(note);
      }
    }
    await this.cache.delByPrefix(`notes:${userId}:findAll:`);
    this._logger.log(`Notes reordered in group ${groupKey}`);
  }
}
