import Dexie, { type Table } from 'dexie';
import type { Attachment, Note } from '../models/note.model';
import type { Section } from '../models/section.model';

export class NotesDatabase extends Dexie {
  notes!: Table<Note>;
  attachments!: Table<Attachment>;
  sections!: Table<Section>;

  constructor() {
    super('NotesAppDB');
    this.version(1).stores({
      notes: '++id, userId, type, pinned, createdAt, updatedAt',
      attachments: '++id, noteId, mimeType, createdAt',
    });
    this.version(2).stores({
      notes: '++id, userId, type, pinned, sectionId, createdAt, updatedAt',
      attachments: '++id, noteId, mimeType, createdAt',
      sections: '++id, userId, order, createdAt',
    });
  }
}

export const db = new NotesDatabase();
