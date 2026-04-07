import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';

@Component({
  selector: 'app-settings-modal',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class SettingsModal {
  protected readonly _translateService = inject(TranslateService);

  private readonly _elementRef = inject(ElementRef);

  protected readonly isDark = signal(localStorage.getItem('notes_theme') === 'dark');
  protected readonly settingsOpen = signal(false);
  protected readonly currentLang = toSignal(this._translateService.onLangChange.pipe(map(e => e.lang)), { initialValue: this._translateService.currentLang });

  protected onDocumentClick(event: MouseEvent) {
    if (!this.settingsOpen()) return;
    if (!this._elementRef.nativeElement.contains(event.target as Node)) {
      this.settingsOpen.set(false);
    }
  }

  protected toggleTheme() {
    const dark = !this.isDark();
    this.isDark.set(dark);
    document.documentElement.classList.toggle('dark-theme', dark);
    localStorage.setItem('notes_theme', dark ? 'dark' : 'light');
  }

  protected toggleLanguage() {
    const next = this.currentLang() === 'es' ? 'en' : 'es';
    this._translateService.use(next);
    localStorage.setItem('notes_lang', next);
  }
}
