import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { initializeApp } from 'firebase/app';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

initializeApp(environment.firebase);

function initTranslate(translate: TranslateService) {
  return () => {
    const stored = localStorage.getItem('notes_lang') as 'es' | 'en' | null;
    const lang = stored === 'en' ? 'en' : 'es';
    translate.setFallbackLang('es');
    return firstValueFrom(translate.use(lang));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideTranslateService(),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    provideAppInitializer(() => initTranslate(inject(TranslateService))())
  ]
};
