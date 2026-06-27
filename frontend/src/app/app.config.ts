import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { LANG } from './core/constants/app.constants';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

function initTranslate(translate: TranslateService) {
  return () => {
    const stored = localStorage.getItem(LANG.STORAGE_KEY) as typeof LANG.ES | typeof LANG.EN | null;
    const lang = stored === LANG.EN ? LANG.EN : LANG.ES;
    translate.setFallbackLang(LANG.ES);
    return firstValueFrom(translate.use(lang));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    provideTranslateService(),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    provideAppInitializer(() => initTranslate(inject(TranslateService))()),
  ],
};
