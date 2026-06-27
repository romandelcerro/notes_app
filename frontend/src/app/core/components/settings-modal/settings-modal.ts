import { Component, ElementRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { LANG, THEME } from '../../constants/app.constants';

@Component({
  selector: 'app-settings-modal',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SettingsModal {
  protected readonly _translateService = inject(TranslateService);

  private readonly _elementRef = inject(ElementRef);

  protected readonly isDark = signal(localStorage.getItem(THEME.STORAGE_KEY) === THEME.DARK);
  protected readonly settingsOpen = signal(false);
  protected readonly currentLang = toSignal(
    this._translateService.onLangChange.pipe(map((e) => e.lang)),
    { initialValue: this._translateService.currentLang() ?? LANG.ES },
  );

  protected onDocumentClick(event: MouseEvent) {
    if (!this.settingsOpen()) return;
    if (!this._elementRef.nativeElement.contains(event.target)) {
      this.settingsOpen.set(false);
    }
  }

  protected toggleTheme() {
    const dark = !this.isDark();
    this.isDark.set(dark);
    document.documentElement.classList.toggle(THEME.CSS_CLASS, dark);
    localStorage.setItem(THEME.STORAGE_KEY, dark ? THEME.DARK : THEME.LIGHT);
  }

  protected toggleLanguage() {
    const next = this.currentLang() === LANG.ES ? LANG.EN : LANG.ES;
    this._translateService.use(next);
    localStorage.setItem(LANG.STORAGE_KEY, next);
  }
}
