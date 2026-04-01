import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { NoteFilter } from '../../core/models/note-filter.model';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-toolbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TranslatePipe],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private readonly _authService = inject(AuthService);
  private readonly _destroyRef = inject(DestroyRef);
  protected readonly _translateService = inject(TranslationService);

  protected readonly searchQuery = signal('');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');

  private readonly _now = signal(new Date());
  private readonly _locale = computed(() => this._translateService.lang() === 'es' ? 'es-ES' : 'en-US');
  protected readonly isDark = signal(localStorage.getItem('notes_theme') === 'dark');

  protected readonly clockDay = computed(() =>
    this._now().toLocaleDateString(this._locale(), { weekday: 'long' }),
  );
  protected readonly clockDate = computed(() =>
    this._now().toLocaleDateString(this._locale(), { day: 'numeric', month: 'long', year: 'numeric' }),
  );
  protected readonly clockTime = computed(() =>
    this._now().toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit' }),
  );

  constructor() {
    const id = setInterval(() => this._now.set(new Date()), 1000);
    this._destroyRef.onDestroy(() => clearInterval(id));
    if (this.isDark()) {
      document.documentElement.classList.add('dark-theme');
    }
  }
  protected readonly user = this._authService.user;
  protected readonly hasDateFilter = computed(() => !!this.dateFrom() || !!this.dateTo());
  protected readonly avatarInitial = computed(() => {
    const name = this._authService.user()?.displayName ?? this._authService.user()?.email ?? '?';
    return name.charAt(0).toUpperCase();
  });

  readonly sidenavOpen = input(false);

  readonly filterChange = output<NoteFilter>();
  readonly profileClick = output<void>();
  readonly menuClick = output<void>();

  protected async signOut() {
    await this._authService.signOut();
  }

  protected onSearchInput(value: string) {
    this.searchQuery.set(value);
    this._emitFilter();
  }

  protected onDateFromChange(value: string) {
    this.dateFrom.set(value);
    this._emitFilter();
  }

  protected onDateToChange(value: string) {
    this.dateTo.set(value);
    this._emitFilter();
  }

  protected clearDateFilter() {
    this.dateFrom.set('');
    this.dateTo.set('');
    this._emitFilter();
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

  protected onProfileClick() {
    this.profileClick.emit();
  }

  protected onMenuClick() {
    this.menuClick.emit();
  }

  private _emitFilter() {
    this.filterChange.emit({
      query: this.searchQuery(),
      dateFrom: this.dateFrom() ? new Date(this.dateFrom()) : null,
      dateTo: this.dateTo() ? new Date(this.dateTo()) : null,
    });
  }
}
