import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { decryptNote, encryptNote } from '../mappers/note.mapper';
import type { Note, NoteFilter } from '../models/note.model';
import type { NoteResponse } from '@notes-app/shared';
import { CryptoService } from './crypto.service';

@Service()
export class NotesService {
  private readonly _http = inject(HttpClient);
  private readonly _cryptoService = inject(CryptoService);

  public readonly notes = signal<Note[]>([]);
  public readonly filter = signal<NoteFilter>({ query: '' });
  private readonly _orderMap = signal<Record<string, number[]>>({});

  public async loadNotes() {
    const f = this.filter();
    const params: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(f)) {
      if (v !== undefined && v !== '' && v !== null) params[k] = v;
    }
    const raw = await firstValueFrom(
      this._http.get<NoteResponse[]>(`${environment.apiUrl}/notes`, { params }),
    );
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

  public async createNote(note: Note) {
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

  public async updateNote(id: number, note: Note) {
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

  public async deleteNote(id: number) {
    await firstValueFrom(this._http.delete(`${environment.apiUrl}/notes/${id}`));
    this.notes.update((current) => current.filter((n) => n.id !== id));
  }

  public clearNotes() {
    this.notes.set([]);
    this._orderMap.set({});
  }

  public async clearAllData() {
    const notes = this.notes();
    const results = await Promise.allSettled(
      notes
        .filter((n) => n.id)
        .map((n) => firstValueFrom(this._http.delete(`${environment.apiUrl}/notes/${n.id}`))),
    );
    for (const r of results)
      if (r.status === 'rejected') console.error('Failed to delete note', r.reason);
    this.notes.set([]);
    this._orderMap.set({});
  }

  public ordered(notes: Note[], key: string) {
    const order = this._orderMap()[key];
    if (!order) return notes;
    const byId = new Map(notes.map((n) => [n.id!, n]));
    return [
      ...order.filter((id) => byId.has(id)).map((id) => byId.get(id)!),
      ...notes.filter((n) => !order.includes(n.id!)),
    ];
  }

  public notesForSection(sectionId: number) {
    if (!sectionId) return [];
    const { query } = this.filter();
    const notes = this.notes();
    const filtered = query
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(query.toLowerCase()) ||
            n.content.toLowerCase().includes(query.toLowerCase()),
        )
      : notes;
    return filtered.filter((n) => n.sectionId === sectionId);
  }

  public async saveOrder(groupKey: string, ids: number[]) {
    this._orderMap.update((m) => {
      const updated = { ...m, [groupKey]: ids };
      return updated;
    });
    await firstValueFrom(
      this._http.post(`${environment.apiUrl}/notes/reorder`, { groupKey, noteIds: ids }),
    ).catch(() => {});
  }
}
