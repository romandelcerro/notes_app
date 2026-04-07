import { Injectable, signal } from '@angular/core';
import { mapNewSection } from '../mappers/section.mapper';
import type { Section } from '../models/section.model';
import { db } from './database.service';

@Injectable({ providedIn: 'root' })
export class SectionsService {
  readonly sections = signal<Section[]>([]);

  private _currentUserId = '';

  async loadSections(userId: string) {
    this._currentUserId = userId;
    const loaded = await db.sections.where('userId').equals(userId).sortBy('order');
    this.sections.set(loaded);
  }

  async createSection(name: string): Promise<Section> {
    const order = this.sections().length;
    const section = mapNewSection(name, this._currentUserId, order);
    const id = await db.sections.add(section);
    const newSection = { ...section, id };
    this.sections.update(s => [...s, newSection]);
    return newSection;
  }

  async renameSection(id: number, name: string) {
    await db.sections.update(id, { name });
    this.sections.update(s => s.map(sec => (sec.id === id ? { ...sec, name } : sec)));
  }

  async deleteSection(id: number) {
    const noteIds = (await db.notes.where('sectionId').equals(id).toArray()).map(n => n.id!);
    await db.attachments.where('noteId').anyOf(noteIds).delete();
    await db.notes.where('sectionId').equals(id).delete();
    await db.sections.delete(id);
    this.sections.update(s => s.filter(sec => sec.id !== id));
  }

  clearSections() {
    this.sections.set([]);
    this._currentUserId = '';
  }

  async clearAllData(userId: string) {
    await db.sections.where('userId').equals(userId).delete();
    this.sections.set([]);
  }
}
