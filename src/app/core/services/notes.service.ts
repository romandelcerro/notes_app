import { Injectable, computed, inject, signal } from '@angular/core';
import type { Attachment, NewNote, Note } from '../models/note.model';
import { CryptoService } from './crypto.service';
import { db } from './database.service';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly _cryptoService = inject(CryptoService);

  private readonly _notes = signal<Note[]>([]);
  private _currentUserId = '';

  readonly notes = this._notes.asReadonly();
  readonly pinnedNotes = computed(() => this._notes().filter((n) => n.pinned));
  readonly unpinnedNotes = computed(() => this._notes().filter((n) => !n.pinned));

  async loadNotes(userId: string) {
    this._currentUserId = userId;
    const raw = await db.notes.where('userId').equals(userId).reverse().sortBy('updatedAt');
    const decrypted = await Promise.all(raw.map((n) => this._decryptNote(n)));
    this._notes.set(decrypted);
  }

  async createNote(data: Omit<NewNote, 'userId'>) {
    const now = new Date();
    const encrypted = await this._encryptNote({ ...data, userId: this._currentUserId });
    const id = await db.notes.add({ ...encrypted, createdAt: now, updatedAt: now });
    const note: Note = { ...data, userId: this._currentUserId, id, createdAt: now, updatedAt: now };
    this._notes.update((current) => [note, ...current]);
    return note;
  }

  async updateNote(id: number, changes: Partial<Pick<Note, 'title' | 'content' | 'color' | 'pinned' | 'sectionId'>>) {
    const updatedAt = new Date();
    const encryptedChanges: Record<string, unknown> = { updatedAt };

    if (changes.title !== undefined) {
      encryptedChanges['title'] = await this._cryptoService.encrypt(changes.title);
    }
    if (changes.content !== undefined) {
      encryptedChanges['content'] = await this._cryptoService.encrypt(changes.content);
    }
    if (changes.color !== undefined) encryptedChanges['color'] = changes.color;
    if (changes.pinned !== undefined) encryptedChanges['pinned'] = changes.pinned;
    if (changes.sectionId !== undefined) encryptedChanges['sectionId'] = changes.sectionId;

    await db.notes.update(id, encryptedChanges);
    this._notes.update((current) =>
      current.map((n) => (n.id === id ? { ...n, ...changes, updatedAt } : n)),
    );
  }

  async deleteNote(id: number) {
    await db.notes.delete(id);
    await db.attachments.where('noteId').equals(id).delete();
    this._notes.update((current) => current.filter((n) => n.id !== id));
  }

  async addAttachment(noteId: number, file: File): Promise<Attachment> {
    const buffer = await file.arrayBuffer();
    const encryptedData = await this._cryptoService.encryptBuffer(buffer);
    const attachment: Omit<Attachment, 'id'> = {
      noteId,
      name: file.name,
      mimeType: file.type,
      encryptedData,
      size: file.size,
      createdAt: new Date(),
    };
    const id = await db.attachments.add(attachment as Attachment);
    return { ...attachment, id };
  }

  async getAttachments(noteId: number): Promise<Attachment[]> {
    return db.attachments.where('noteId').equals(noteId).toArray();
  }

  async deleteAttachment(attachmentId: number) {
    await db.attachments.delete(attachmentId);
  }

  async decryptAttachment(attachment: Attachment) {
    return this._cryptoService.decryptBuffer(attachment.encryptedData);
  }

  clearNotes() {
    this._notes.set([]);
    this._currentUserId = '';
  }

  removeNotesForSection(sectionId: number) {
    this._notes.update((notes) => notes.filter((n) => n.sectionId !== sectionId));
  }

  async clearAllData(userId: string) {
    await db.notes.where('userId').equals(userId).delete();
    const noteIds = (await db.notes.where('userId').equals(userId).toArray()).map((n) => n.id!);
    await db.attachments.where('noteId').anyOf(noteIds).delete();
    this._notes.set([]);
  }

  private async _encryptNote(note: NewNote): Promise<NewNote> {
    return {
      ...note,
      title: await this._cryptoService.encrypt(note.title),
      content: await this._cryptoService.encrypt(note.content),
    };
  }

  private async _decryptNote(note: Note): Promise<Note> {
    return {
      ...note,
      title: await this._cryptoService.decrypt(note.title),
      content: await this._cryptoService.decrypt(note.content),
    };
  }
}
