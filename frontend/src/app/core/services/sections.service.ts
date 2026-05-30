import { Injectable, inject, signal } from '@angular/core';
import { mapNewSection } from '../mappers/section.mapper';
import type { Section } from '../models/section.model';
import { DatabaseService } from './database.service';

@Injectable({ providedIn: 'root' })
export class SectionsService {
  private readonly _databaseService = inject(DatabaseService);

  readonly sections = signal<Section[]>([]);

  private _currentUserId = '';

  async loadSections(userId: string) {
    this._currentUserId = userId;
    const loaded = await this._databaseService.sections.where('userId').equals(userId).sortBy('order');
    this.sections.set(loaded);
  }

  async createSection(name: string): Promise<Section> {
    const order = this.sections().length;
    const section = mapNewSection(name, this._currentUserId, order);
    const id = await this._databaseService.sections.add(section);
    const newSection = { ...section, id };
    this.sections.update(s => [...s, newSection]);
    return newSection;
  }

  async renameSection(id: number, name: string) {
    await this._databaseService.sections.update(id, { name });
    this.sections.update(s => s.map(sec => (sec.id === id ? { ...sec, name } : sec)));
  }

  async deleteSection(id: number) {
    const noteIds = (await this._databaseService.notes.where('sectionId').equals(id).toArray()).map(n => n.id!);
    await this._databaseService.attachments.where('noteId').anyOf(noteIds).delete();
    await this._databaseService.notes.where('sectionId').equals(id).delete();
    await this._databaseService.sections.delete(id);
    this.sections.update(s => s.filter(sec => sec.id !== id));
  }

  clearSections() {
    this.sections.set([]);
    this._currentUserId = '';
  }

  async clearAllData(userId: string) {
    await this._databaseService.sections.where('userId').equals(userId).delete();
    this.sections.set([]);
  }
}
