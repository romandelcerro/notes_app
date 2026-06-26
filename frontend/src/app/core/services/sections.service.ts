import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Section } from '../models/section.model';

interface SectionResponse {
  id: number;
  name: string;
  userId: string;
  order: number;
  isDefault: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SectionsService {
  private readonly _http = inject(HttpClient);
  private readonly _translateService = inject(TranslateService);

  readonly sections = signal<Section[]>([]);

  async loadSections() {
    const raw = await firstValueFrom(
      this._http.get<SectionResponse[]>(`${environment.apiUrl}/sections`),
    );
    this.sections.set(raw.map((r) => ({ ...r, createdAt: new Date(r.createdAt) })));
  }

  async createSection(name: string, isDefault = false): Promise<Section> {
    const created = await firstValueFrom(
      this._http.post<SectionResponse>(`${environment.apiUrl}/sections`, { name, isDefault }),
    );
    const newSection: Section = { ...created, createdAt: new Date(created.createdAt) };
    this.sections.update((s) => [...s, newSection]);
    return newSection;
  }

  getDisplayName(section: { name: string; isDefault: boolean }): string {
    if (section.isDefault) {
      return this._translateService.instant('home.defaultSectionName');
    }
    return section.name;
  }

  async renameSection(id: number, name: string) {
    const section = this.sections().find((s) => s.id === id);
    const payload: Record<string, unknown> = { name };
    if (section?.isDefault) {
      payload['isDefault'] = false;
    }
    await firstValueFrom(
      this._http.patch<SectionResponse>(`${environment.apiUrl}/sections/${id}`, payload),
    );
    this.sections.update((s) =>
      s.map((sec) =>
        sec.id === id ? { ...sec, name, isDefault: sec.isDefault ? false : sec.isDefault } : sec,
      ),
    );
  }

  async deleteSection(id: number) {
    await firstValueFrom(this._http.delete(`${environment.apiUrl}/sections/${id}`));
    this.sections.update((s) => s.filter((sec) => sec.id !== id));
  }

  clearSections() {
    this.sections.set([]);
  }

  async clearAllData() {
    const all = this.sections();
    for (const section of all) {
      if (section.id)
        await firstValueFrom(this._http.delete(`${environment.apiUrl}/sections/${section.id}`));
    }
    this.sections.set([]);
  }
}
