import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttachmentEntity } from '../entities/attachment.entity.js';
import { CreateAttachmentDto } from './dto/create-attachment.dto.js';
import { NoteEntity } from '../entities/note.entity.js';

@Injectable()
export class AttachmentsService {
  private readonly _logger = new Logger(AttachmentsService.name);

  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepo: Repository<AttachmentEntity>,
    @InjectRepository(NoteEntity)
    private readonly noteRepo: Repository<NoteEntity>,
  ) {}

  async findByNoteId(noteId: number, userId: string) {
    const note = await this.noteRepo.findOne({ where: { id: noteId, userId } });
    if (!note) throw new NotFoundException('exception.note.notFound');
    return this.attachmentRepo.find({
      where: { noteId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(userId: string, dto: CreateAttachmentDto) {
    const note = await this.noteRepo.findOne({
      where: { id: dto.noteId, userId },
    });
    if (!note) throw new NotFoundException('exception.note.notFound');
    const attachment = this.attachmentRepo.create(dto);
    const saved = await this.attachmentRepo.save(attachment);
    this._logger.log(`Attachment created: ${saved.id} for note ${dto.noteId}`);
    return saved;
  }

  async findOne(id: number) {
    const attachment = await this.attachmentRepo.findOne({ where: { id } });
    if (!attachment)
      throw new NotFoundException('exception.attachment.notFound');
    return attachment;
  }

  async remove(id: number, userId: string) {
    const attachment = await this.findOne(id);
    const note = await this.noteRepo.findOne({
      where: { id: attachment.noteId, userId },
    });
    if (!note) throw new NotFoundException('exception.attachment.notFound');
    await this.attachmentRepo.remove(attachment);
    this._logger.log(`Attachment removed: ${id}`);
  }
}
