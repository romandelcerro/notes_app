import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-settings',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class SettingsComponent {
  protected readonly _translateService = inject(TranslationService);
  private readonly _elementRef = inject(ElementRef);

  protected readonly isDark = signal(localStorage.getItem('notes_theme') === 'dark');
  protected readonly settingsOpen = signal(false);

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
    const next = this._translateService.lang() === 'es' ? 'en' : 'es';
    this._translateService.setLanguage(next);
  }
}
