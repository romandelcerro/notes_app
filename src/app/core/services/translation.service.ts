import { Injectable, signal } from '@angular/core';

export type Language = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly _lang = signal<Language>('es');
  private _translations: Record<string, string> = {};

  readonly lang = this._lang.asReadonly();

  constructor() {
    const stored = localStorage.getItem('notes_lang') as Language | null;
    const initial: Language = stored === 'en' ? 'en' : 'es';
    this._load(initial);
  }

  async setLanguage(lang: Language) {
    await this._load(lang);
    localStorage.setItem('notes_lang', lang);
  }

  t(key: string, params?: Record<string, string>) {
    let value = this._translations[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, v);
      }
    }
    return value;
  }

  private async _load(lang: Language) {
    const res = await fetch(`/i18n/${lang}.json`);
    this._translations = await res.json() as Record<string, string>;
    this._lang.set(lang);
  }
}
