import Dexie, { type Table } from 'dexie';
import { Attachment } from '../models/attachment.model';
import type { Note } from '../models/note.model';
import type { Section } from '../models/section.model';

export class DatabaseService extends Dexie {
  notes!: Table<Note>;
  attachments!: Table<Attachment>;
  sections!: Table<Section>;

  constructor() {
    super('NotesAppDB');
    this.version(2).stores({
      notes: '++id, userId, type, pinned, sectionId, createdAt, updatedAt',
      attachments: '++id, noteId, mimeType, createdAt',
      sections: '++id, userId, order, createdAt'
    });
  }
}

export const db = new DatabaseService();
