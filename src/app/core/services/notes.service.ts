import { Injectable, inject, signal } from '@angular/core';
import { decryptNote, encryptNote, mapUpdatedNote } from '../mappers/note.mapper';
import type { Note, NoteFilter } from '../models/note.model';
import { CryptoService } from './crypto.service';
import { db } from './database.service';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly _cryptoService = inject(CryptoService);

  readonly notes = signal<Note[]>([]);
  readonly filter = signal<NoteFilter>({ query: '', dateFrom: null, dateTo: null });

  private _currentUserId = '';

  async loadNotes(userId: string) {
    this._currentUserId = userId;
    const raw = await db.notes.where('userId').equals(userId).reverse().sortBy('updatedAt');
    const decryptedNotes = await Promise.all(raw.map(n => decryptNote(n, this._cryptoService)));
    this.notes.set(decryptedNotes);
  }

  async createNote(note: Note) {
    const now = new Date();
    const encryptedNotes = await encryptNote({ ...note, userId: this._currentUserId }, this._cryptoService);
    const id = await db.notes.add({ ...encryptedNotes, createdAt: now, updatedAt: now });
    const newNote: Note = { ...note, userId: this._currentUserId, id, createdAt: now, updatedAt: now };
    this.notes.update(current => [newNote, ...current]);
    return newNote;
  }

  async updateNote(id: number, note: Note) {
    const updatedAt = new Date();
    const updatedNote = await mapUpdatedNote(note, updatedAt, this._cryptoService);
    await db.notes.update(id, updatedNote);
    this.notes.update(current => current.map(n => (n.id === id ? { ...n, ...note, updatedAt } : n)));
  }

  async deleteNote(id: number) {
    await db.notes.delete(id);
    await db.attachments.where('noteId').equals(id).delete();
    this.notes.update(current => current.filter(n => n.id !== id));
  }

  clearNotes() {
    this.notes.set([]);
    this._currentUserId = '';
  }

  removeNotesForSection(sectionId: number) {
    this.notes.update(notes => notes.filter(n => n.sectionId !== sectionId));
  }

  async clearAllData(userId: string) {
    await db.notes.where('userId').equals(userId).delete();
    const noteIds = (await db.notes.where('userId').equals(userId).toArray()).map(n => n.id!);
    await db.attachments.where('noteId').anyOf(noteIds).delete();
    this.notes.set([]);
  }
}
