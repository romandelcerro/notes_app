import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Translations = Record<string, string>;

@Injectable()
export class I18nService {
  private readonly _logger = new Logger(I18nService.name);
  private readonly _translations: Map<string, Translations> = new Map();

  constructor() {
    this._load('en');
    this._load('es');
  }

  translate(key: string, lang: string = 'en'): string {
    const dict = this._translations.get(lang) ?? this._translations.get('en');
    return dict?.[key] ?? key;
  }

  private _load(lang: string): void {
    try {
      const path = join(__dirname, `${lang}.json`);
      const content = readFileSync(path, 'utf-8');
      const data = JSON.parse(content) as Translations;
      this._translations.set(lang, data);
    } catch (err) {
      this._logger.warn(`Failed to load i18n/${lang}.json: ${err}`);
      this._translations.set(lang, {});
    }
  }
}
