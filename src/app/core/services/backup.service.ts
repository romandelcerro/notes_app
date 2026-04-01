import { Injectable, inject } from '@angular/core';
import type { Attachment, Note } from '../models/note.model';
import type { Section } from '../models/section.model';
import { CryptoService } from './crypto.service';
import { db } from './database.service';
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
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);

  async exportBackup(userId: string) {
    const saltJson = localStorage.getItem(`notes_salt_${userId}`);
    if (!saltJson) throw new Error('backup.noSalt');

    const salt = JSON.parse(saltJson) as number[];
    const notes = await db.notes.where('userId').equals(userId).toArray();
    const sections = await db.sections.where('userId').equals(userId).toArray();
    const noteIds = notes.map((n) => n.id!).filter(Boolean);
    const attachments = noteIds.length
      ? await db.attachments.where('noteId').anyOf(noteIds).toArray()
      : [];

    const backup: BackupData = { version: 1, userId, salt, notes, sections, attachments };
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

    localStorage.setItem(`notes_salt_${userId}`, JSON.stringify(backup.salt));

    const existingNotes = await db.notes.where('userId').equals(userId).toArray();
    const existingNoteIds = existingNotes.map((n) => n.id!).filter(Boolean);
    await db.notes.where('userId').equals(userId).delete();
    await db.sections.where('userId').equals(userId).delete();
    if (existingNoteIds.length) {
      await db.attachments.where('noteId').anyOf(existingNoteIds).delete();
    }

    const notes = backup.notes.map((n) => ({
      ...n,
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
    }));
    const sections = backup.sections.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
    }));
    const attachments = backup.attachments.map((a) => ({
      ...a,
      createdAt: new Date(a.createdAt),
    }));

    await db.notes.bulkAdd(notes);
    await db.sections.bulkAdd(sections);
    if (attachments.length) await db.attachments.bulkAdd(attachments);

    await this._cryptoService.initKey(userId);
    await Promise.all([
      this._notesService.loadNotes(userId),
      this._sectionsService.loadSections(userId),
    ]);
  }
}
