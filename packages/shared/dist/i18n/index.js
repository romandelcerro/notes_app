import en from './en.js';
import es from './es.js';
const translations = { en, es };
export function getTranslation(key, lang = 'en') {
    const dict = translations[lang] ?? translations['en'];
    return dict?.[key] ?? key;
}
export { en, es };
