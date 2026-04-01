import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { TranslationService } from './core/services/translation.service';

initializeApp(environment.firebase);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideAppInitializer(() => inject(TranslationService).init()),
  ],
};

