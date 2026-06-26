import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AttachmentEntity } from '../entities/attachment.entity.js';
import { CreateAttachmentDto } from './dto/create-attachment.dto.js';
import { NoteEntity } from '../entities/note.entity.js';
import { CacheService, CACHE_TTL } from '../common/cache.service.js';

@Injectable()
export class AttachmentsService {
  private readonly _logger = new Logger(AttachmentsService.name);

  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepo: Repository<AttachmentEntity>,
    @InjectRepository(NoteEntity)
    private readonly noteRepo: Repository<NoteEntity>,
    private readonly cache: CacheService,
  ) {}

  async findByNoteIds(noteIds: number[], userId: string) {
    const cacheKey = `attachments:${userId}:findByNoteIds:${noteIds.sort().join(',')}`;
    const cached = await this.cache.get<AttachmentEntity[]>(cacheKey);
    if (cached) return cached;

    const notes = await this.noteRepo.find({
      where: { id: In(noteIds), userId },
    });
    if (notes.length !== noteIds.length) {
      throw new NotFoundException('exception.note.notFound');
    }
    const result = await this.attachmentRepo.find({
      where: { noteId: In(noteIds) },
      order: { noteId: 'ASC', createdAt: 'ASC' },
    });
    await this.cache.set(cacheKey, result, CACHE_TTL.LIST);
    return result;
  }

  async findByNoteId(noteId: number, userId: string) {
    const cacheKey = `attachments:${userId}:findByNoteId:${noteId}`;
    const cached = await this.cache.get<AttachmentEntity[]>(cacheKey);
    if (cached) return cached;

    const note = await this.noteRepo.findOne({ where: { id: noteId, userId } });
    if (!note) throw new NotFoundException('exception.note.notFound');
    const result = await this.attachmentRepo.find({
      where: { noteId },
      order: { createdAt: 'ASC' },
    });
    await this.cache.set(cacheKey, result, CACHE_TTL.LIST);
    return result;
  }

  async create(userId: string, dto: CreateAttachmentDto) {
    const note = await this.noteRepo.findOne({
      where: { id: dto.noteId, userId },
    });
    if (!note) throw new NotFoundException('exception.note.notFound');
    const attachment = this.attachmentRepo.create(dto);
    const saved = await this.attachmentRepo.save(attachment);
    if (!note.hasAttachments) {
      note.hasAttachments = true;
      await this.noteRepo.save(note);
    }
    await this.cache.delByPrefix(`attachments:${userId}:`);
    this._logger.log(`Attachment created: ${saved.id} for note ${dto.noteId}`);
    return saved;
  }

  async findOne(id: number) {
    const cacheKey = `attachments:findOne:${id}`;
    const cached = await this.cache.get<AttachmentEntity>(cacheKey);
    if (cached) return cached;

    const attachment = await this.attachmentRepo.findOne({ where: { id } });
    if (!attachment) throw new NotFoundException('exception.attachment.notFound');
    await this.cache.set(cacheKey, attachment);
    return attachment;
  }

  async remove(id: number, userId: string) {
    const attachment = await this.findOne(id);
    const note = await this.noteRepo.findOne({
      where: { id: attachment.noteId, userId },
    });
    if (!note) throw new NotFoundException('exception.attachment.notFound');
    await this.attachmentRepo.remove(attachment);
    const remaining = await this.attachmentRepo.count({
      where: { noteId: attachment.noteId },
    });
    if (remaining === 0 && note.hasAttachments) {
      note.hasAttachments = false;
      await this.noteRepo.save(note);
    }
    await this.cache.del(`attachments:findOne:${id}`);
    await this.cache.delByPrefix(`attachments:${userId}:`);
    this._logger.log(`Attachment removed: ${id}`);
  }
}
