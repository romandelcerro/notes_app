import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Section } from '../models/section.model';
import type { SectionResponse } from '@notes-app/shared';

@Service()
export class SectionsService {
  private readonly _http = inject(HttpClient);
  private readonly _translateService = inject(TranslateService);

  public readonly sections = signal<Section[]>([]);
  public readonly currentSectionSelected = signal<Section | null>(null);

  public displaySectionName(section: { name: string; isDefault: boolean }) {
    return section.isDefault
      ? this._translateService.instant('home.defaultSectionName')
      : section.name;
  }

  private _toSection(r: SectionResponse): Section {
    return { ...r, createdAt: new Date(r.createdAt), displayName: this.displaySectionName(r) };
  }

  public async loadSections() {
    const raw = await firstValueFrom(
      this._http.get<SectionResponse[]>(`${environment.apiUrl}/sections`),
    );
    this.sections.set(raw.map((r) => this._toSection(r)));
  }

  public async createSection(name: string, isDefault = false) {
    const created = await firstValueFrom(
      this._http.post<SectionResponse>(`${environment.apiUrl}/sections`, { name, isDefault }),
    );
    const newSection = this._toSection(created);
    this.sections.update((s) => [...s, newSection]);
    return newSection;
  }

  public async renameSection(id: number, name: string) {
    const section = this.sections().find((s) => s.id === id);
    const payload: Record<string, unknown> = { name };
    if (section?.isDefault) {
      payload['isDefault'] = false;
    }
    const updated = await firstValueFrom(
      this._http.patch<SectionResponse>(`${environment.apiUrl}/sections/${id}`, payload),
    );
    this.sections.update((s) => s.map((sec) => (sec.id === id ? this._toSection(updated) : sec)));
  }

  public async deleteSection(id: number) {
    await firstValueFrom(this._http.delete(`${environment.apiUrl}/sections/${id}`));
    this.sections.update((s) => s.filter((sec) => sec.id !== id));
  }

  public async clearAllData() {
    const sections = this.sections();
    const results = await Promise.allSettled(
      sections
        .filter((s) => s.id)
        .map((s) => firstValueFrom(this._http.delete(`${environment.apiUrl}/sections/${s.id}`))),
    );
    for (const r of results)
      if (r.status === 'rejected') console.error('Failed to delete section', r.reason);
    this.sections.set([]);
  }
}
