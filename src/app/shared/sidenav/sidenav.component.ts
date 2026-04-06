import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Section } from '../../core/models/section.model';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-sidenav',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TranslatePipe],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SidenavComponent {
  protected readonly _translateService = inject(TranslationService);
  private readonly _elementRef = inject(ElementRef);

  readonly selectedSectionId = input.required<number | null>();
  readonly sections = input.required<Section[]>();

  readonly closeClick = output<void>();
  readonly sectionSelect = output<number | null>();
  readonly newSectionClick = output<void>();
  readonly editSectionClick = output<Section>();
  readonly deleteSectionClick = output<Section>();
  readonly signOutClick = output<void>();

  protected readonly isDark = signal(localStorage.getItem('notes_theme') === 'dark');
  protected readonly settingsOpen = signal(false);

  protected onDocumentClick(event: MouseEvent) {
    if (!this.settingsOpen()) return;
    const header = this._elementRef.nativeElement.querySelector('.header-settings');
    if (header && !header.contains(event.target as Node)) {
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
