import en from './en.js';
import es from './es.js';

const translations: Record<string, Record<string, string>> = { en, es };

export function getTranslation(key: string, lang: string = 'en'): string {
  const dict = translations[lang] ?? translations['en'];
  return dict?.[key] ?? key;
}

export { en, es };
