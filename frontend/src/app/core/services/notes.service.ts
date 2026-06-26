import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { decryptNote, encryptNote } from '../mappers/note.mapper';
import type { Note, NoteFilter } from '../models/note.model';
import { CryptoService } from './crypto.service';

interface NoteResponse {
  id: number;
  title: string;
  content: string;
  type: string;
  color: string;
  pinned: boolean;
  hasAttachments: boolean;
  userId: string;
  sectionId: number | null;
  createdAt: string;
  updatedAt: string;
}

@Service()
export class NotesService {
  private readonly _http = inject(HttpClient);
  private readonly _cryptoService = inject(CryptoService);

  readonly notes = signal<Note[]>([]);
  readonly filter = signal<NoteFilter>({ query: '', dateFrom: null, dateTo: null });
  private readonly _orderMap = signal<Record<string, number[]>>({});

  async loadNotes() {
    const raw = await firstValueFrom(this._http.get<NoteResponse[]>(`${environment.apiUrl}/notes`));
    const parsed = raw.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      type: r.type as Note['type'],
      color: r.color,
      pinned: r.pinned,
      hasAttachments: r.hasAttachments,
      userId: r.userId,
      sectionId: r.sectionId ?? undefined,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    }));
    const decryptedNotes = await Promise.all(
      parsed.map((n) => decryptNote(n, this._cryptoService)),
    );
    this.notes.set(decryptedNotes);
  }

  async createNote(note: Note): Promise<Note> {
    const encrypted = await encryptNote(note, this._cryptoService);
    const created = await firstValueFrom(
      this._http.post<NoteResponse>(`${environment.apiUrl}/notes`, {
        title: encrypted.title,
        content: encrypted.content,
        type: note.type,
        color: note.color,
        pinned: note.pinned,
        sectionId: note.sectionId,
      }),
    );
    const newNote: Note = {
      ...note,
      id: created.id,
      createdAt: new Date(created.createdAt),
      updatedAt: new Date(created.updatedAt),
    };
    this.notes.update((current) => [newNote, ...current]);
    return newNote;
  }

  async updateNote(id: number, note: Note) {
    const encrypted = await encryptNote(note, this._cryptoService);
    const updated = await firstValueFrom(
      this._http.patch<NoteResponse>(`${environment.apiUrl}/notes/${id}`, {
        title: encrypted.title,
        content: encrypted.content,
        color: note.color,
        pinned: note.pinned,
        sectionId: note.sectionId ?? null,
      }),
    );
    this.notes.update((current) =>
      current.map((n) =>
        n.id === id ? { ...n, ...note, updatedAt: new Date(updated.updatedAt) } : n,
      ),
    );
  }

  async deleteNote(id: number) {
    await firstValueFrom(this._http.delete(`${environment.apiUrl}/notes/${id}`));
    this.notes.update((current) => current.filter((n) => n.id !== id));
  }

  clearNotes() {
    this.notes.set([]);
    this._orderMap.set({});
  }

  removeNotesForSection(sectionId: number) {
    this.notes.update((notes) => notes.filter((n) => n.sectionId !== sectionId));
  }

  async clearAllData() {
    const all = this.notes();
    for (const note of all) {
      if (note.id)
        await firstValueFrom(this._http.delete(`${environment.apiUrl}/notes/${note.id}`));
    }
    this.notes.set([]);
    this._orderMap.set({});
  }

  ordered(notes: Note[], key: string): Note[] {
    const order = this._orderMap()[key];
    if (!order) return notes;
    const byId = new Map(notes.map((n) => [n.id!, n]));
    return [
      ...order.filter((id) => byId.has(id)).map((id) => byId.get(id)!),
      ...notes.filter((n) => !order.includes(n.id!)),
    ];
  }

  saveOrder(groupKey: string, ids: number[]) {
    this._orderMap.update((m) => {
      const updated = { ...m, [groupKey]: ids };
      return updated;
    });
  }
}
