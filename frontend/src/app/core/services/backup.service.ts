import { Injectable, inject } from '@angular/core';
import { mapBackupAttachment, mapBackupNote, mapBackupSection } from '../mappers/backup.mapper';
import { Attachment } from '../models/attachment.model';
import type { Note } from '../models/note.model';
import type { Section } from '../models/section.model';
import { CryptoService } from './crypto.service';
import { DatabaseService } from './database.service';
import { NotesService } from './notes.service';
import { SectionsService } from './sections.service';

interface BackupData {
  version: 1;
  userId: string;
  salt: number[];
  notes: Note[];
  sections: Section[];
  attachments: Attachment[];
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly _cryptoService = inject(CryptoService);
  private readonly _databaseService = inject(DatabaseService);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);

  async exportBackup(userId: string) {
    const backup = await this._buildBackupData(userId);
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importBackup(file: File, userId: string) {
    const text = await file.text();
    const backup = JSON.parse(text) as BackupData;

    if (backup.version !== 1) throw new Error('backup.unsupportedVersion');
    if (backup.userId !== userId) throw new Error('backup.wrongAccount');

    await this._restoreBackupData(backup, userId);
    await this._cryptoService.initKey(userId);
    await Promise.all([this._notesService.loadNotes(userId), this._sectionsService.loadSections(userId)]);
  }

  private async _buildBackupData(userId: string): Promise<BackupData> {
    const saltJson = localStorage.getItem(`notes_salt_${userId}`);
    if (!saltJson) throw new Error('backup.noSalt');

    const salt = JSON.parse(saltJson) as number[];
    const notes = await this._databaseService.notes.where('userId').equals(userId).toArray();
    const sections = await this._databaseService.sections.where('userId').equals(userId).toArray();
    const noteIds = notes.map(n => n.id!).filter(Boolean);
    const attachments = noteIds.length ? await this._databaseService.attachments.where('noteId').anyOf(noteIds).toArray() : [];

    return { version: 1, userId, salt, notes, sections, attachments };
  }

  private async _restoreBackupData(backup: BackupData, userId: string) {
    localStorage.setItem(`notes_salt_${userId}`, JSON.stringify(backup.salt));

    const existingNotes = await this._databaseService.notes.where('userId').equals(userId).toArray();
    const existingNoteIds = existingNotes.map(n => n.id!).filter(Boolean);
    await this._databaseService.notes.where('userId').equals(userId).delete();
    await this._databaseService.sections.where('userId').equals(userId).delete();
    if (existingNoteIds.length) {
      await this._databaseService.attachments.where('noteId').anyOf(existingNoteIds).delete();
    }

    const notes = backup.notes.map(mapBackupNote);
    const sections = backup.sections.map(mapBackupSection);
    const attachments = backup.attachments.map(mapBackupAttachment);

    await this._databaseService.notes.bulkAdd(notes);
    await this._databaseService.sections.bulkAdd(sections);
    if (attachments.length) await this._databaseService.attachments.bulkAdd(attachments);
  }
}
