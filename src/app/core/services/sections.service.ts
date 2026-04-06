import { Injectable, signal } from '@angular/core';
import type { Section } from '../models/section.model';
import { db } from './database.service';

@Injectable({ providedIn: 'root' })
export class SectionsService {
  private readonly _sections = signal<Section[]>([]);
  private _currentUserId = '';

  readonly sections = this._sections.asReadonly();

  async loadSections(userId: string) {
    this._currentUserId = userId;
    const loaded = await db.sections.where('userId').equals(userId).sortBy('order');
    this._sections.set(loaded);
  }

  async createSection(name: string): Promise<Section> {
    const order = this._sections().length;
    const section: Omit<Section, 'id'> = {
      name,
      userId: this._currentUserId,
      order,
      createdAt: new Date(),
    };
    const id = await db.sections.add(section as Section);
    const created = { ...section, id };
    this._sections.update((s) => [...s, created]);
    return created;
  }

  async renameSection(id: number, name: string) {
    await db.sections.update(id, { name });
    this._sections.update((s) => s.map((sec) => (sec.id === id ? { ...sec, name } : sec)));
  }

  async deleteSection(id: number) {
    const noteIds = (await db.notes.where('sectionId').equals(id).toArray()).map((n) => n.id!);
    await db.attachments.where('noteId').anyOf(noteIds).delete();
    await db.notes.where('sectionId').equals(id).delete();
    await db.sections.delete(id);
    this._sections.update((s) => s.filter((sec) => sec.id !== id));
  }

  clearSections() {
    this._sections.set([]);
    this._currentUserId = '';
  }

  async clearAllData(userId: string) {
    await db.sections.where('userId').equals(userId).delete();
    this._sections.set([]);
  }
}
