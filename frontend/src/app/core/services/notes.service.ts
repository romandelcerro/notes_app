import { Injectable, inject, signal } from '@angular/core';
import { decryptNote, encryptNote, mapUpdatedNote } from '../mappers/note.mapper';
import type { Note, NoteFilter } from '../models/note.model';
import { CryptoService } from './crypto.service';
import { DatabaseService } from './database.service';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly _cryptoService = inject(CryptoService);
  private readonly _databaseService = inject(DatabaseService);

  readonly notes = signal<Note[]>([]);
  readonly filter = signal<NoteFilter>({ query: '', dateFrom: null, dateTo: null });
  private readonly _orderMap = signal<Record<string, number[]>>({});

  private _currentUserId = '';

  async loadNotes(userId: string) {
    this._currentUserId = userId;
    const raw = await this._databaseService.notes.where('userId').equals(userId).reverse().sortBy('updatedAt');
    const decryptedNotes = await Promise.all(raw.map(n => decryptNote(n, this._cryptoService)));
    this.notes.set(decryptedNotes);
    this._loadOrderMap(userId);
  }

  async createNote(note: Note) {
    const now = new Date();
    const encryptedNotes = await encryptNote({ ...note, userId: this._currentUserId }, this._cryptoService);
    const id = await this._databaseService.notes.add({ ...encryptedNotes, createdAt: now, updatedAt: now });
    const newNote: Note = { ...note, userId: this._currentUserId, id, createdAt: now, updatedAt: now };
    this.notes.update(current => [newNote, ...current]);
    return newNote;
  }

  async updateNote(id: number, note: Note) {
    const updatedAt = new Date();
    const updatedNote = await mapUpdatedNote(note, updatedAt, this._cryptoService);
    await this._databaseService.notes.update(id, updatedNote);
    this.notes.update(current => current.map(n => (n.id === id ? { ...n, ...note, updatedAt } : n)));
  }

  async deleteNote(id: number) {
    await this._databaseService.notes.delete(id);
    await this._databaseService.attachments.where('noteId').equals(id).delete();
    this.notes.update(current => current.filter(n => n.id !== id));
  }

  clearNotes() {
    this.notes.set([]);
    this._orderMap.set({});
    this._currentUserId = '';
  }

  removeNotesForSection(sectionId: number) {
    this.notes.update(notes => notes.filter(n => n.sectionId !== sectionId));
  }

  async clearAllData(userId: string) {
    await this._databaseService.notes.where('userId').equals(userId).delete();
    const noteIds = (await this._databaseService.notes.where('userId').equals(userId).toArray()).map(n => n.id!);
    await this._databaseService.attachments.where('noteId').anyOf(noteIds).delete();
    this.notes.set([]);
    this._orderMap.set({});
    localStorage.removeItem(`notes_order_${userId}`);
  }

  ordered(notes: Note[], key: string): Note[] {
    const order = this._orderMap()[key];
    if (!order) return notes;
    const byId = new Map(notes.map(n => [n.id!, n]));
    return [...order.filter(id => byId.has(id)).map(id => byId.get(id)!), ...notes.filter(n => !order.includes(n.id!))];
  }

  saveOrder(groupKey: string, ids: number[]) {
    this._orderMap.update(m => {
      const updated = { ...m, [groupKey]: ids };
      localStorage.setItem(`notes_order_${this._currentUserId}`, JSON.stringify(updated));
      return updated;
    });
  }

  private _loadOrderMap(userId: string) {
    const stored = localStorage.getItem(`notes_order_${userId}`);
    this._orderMap.set(stored ? (JSON.parse(stored) as Record<string, number[]>) : {});
  }
}
