import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoteEntity } from '../entities/note.entity.js';
import { SectionEntity } from '../entities/section.entity.js';
import { AttachmentEntity } from '../entities/attachment.entity.js';

interface BackupNote {
  title: string;
  content: string;
  type: string;
  color: string;
  pinned: boolean;
  userId: string;
  sectionId?: number;
  createdAt: string;
  updatedAt: string;
  __newId?: number;
}

interface BackupSection {
  name: string;
  userId: string;
  order: number;
  createdAt: string;
  __newId?: number;
}

interface BackupAttachment {
  noteId: number;
  name: string;
  mimeType: string;
  encryptedData: string;
  size: number;
  createdAt: string;
}

export interface BackupPayload {
  version: number;
  userId: string;
  notes: BackupNote[];
  sections: BackupSection[];
  attachments: BackupAttachment[];
}

@Injectable()
export class BackupService {
  private readonly _logger = new Logger(BackupService.name);

  constructor(
    @InjectRepository(NoteEntity)
    private readonly noteRepo: Repository<NoteEntity>,
    @InjectRepository(SectionEntity)
    private readonly sectionRepo: Repository<SectionEntity>,
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepo: Repository<AttachmentEntity>,
  ) {}

  async exportBackup(userId: string) {
    this._logger.log(`Exporting backup for user ${userId}`);
    const notes = await this.noteRepo.find({ where: { userId } });
    const sections = await this.sectionRepo.find({ where: { userId } });
    const noteIds = notes.map((n) => n.id);
    const attachments = noteIds.length
      ? await this.attachmentRepo.find({
          where: noteIds.map((id) => ({ noteId: id })),
        })
      : [];

    return {
      version: 1 as const,
      userId,
      notes: notes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      sections: sections.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
      attachments: attachments.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  async importBackup(userId: string, data: BackupPayload) {
    if (data.version !== 1 || data.userId !== userId) {
      throw new ForbiddenException('exception.backup.versionMismatch');
    }

    this._logger.log(`Importing backup for user ${userId}`);

    const existingNotes = await this.noteRepo.find({ where: { userId } });
    const existingNoteIds = existingNotes.map((n) => n.id);
    if (existingNoteIds.length) {
      await this.attachmentRepo.delete(
        existingNoteIds.map((id) => ({ noteId: id })),
      );
    }
    await this.noteRepo.delete({ userId });
    await this.sectionRepo.delete({ userId });

    for (const s of data.sections) {
      const section = this.sectionRepo.create({
        name: s.name,
        userId: s.userId,
        order: s.order,
        createdAt: new Date(s.createdAt),
      });
      await this.sectionRepo.save(section);
    }

    for (const n of data.notes) {
      const note = this.noteRepo.create({
        title: n.title,
        content: n.content,
        type: n.type,
        color: n.color,
        pinned: n.pinned,
        userId: n.userId,
        sectionId: n.sectionId ?? null,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      });
      await this.noteRepo.save(note);
    }

    for (const a of data.attachments) {
      const attachment = this.attachmentRepo.create({
        noteId: a.noteId,
        name: a.name,
        mimeType: a.mimeType,
        encryptedData: a.encryptedData,
        size: a.size,
        createdAt: new Date(a.createdAt),
      });
      await this.attachmentRepo.save(attachment);
    }

    this._logger.log(`Backup imported for user ${userId}`);
    return { imported: true };
  }
}
