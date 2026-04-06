import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { NoteFilter } from '../../core/models/note-filter.model';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { ClockComponent } from '../clock/clock.component';
import { SearchInputComponent } from '../search-input/search-input.component';
import { TranslatePipe } from '../translate.pipe';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

@Component({
  selector: 'app-toolbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TranslatePipe, SearchInputComponent, UserAvatarComponent, ClockComponent],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  private readonly _authService = inject(AuthService);
  private readonly _destroyRef = inject(DestroyRef);
  protected readonly _translateService = inject(TranslationService);

  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');

  constructor() {}
  readonly sidenavOpen = input(false);

  readonly filterChange = output<NoteFilter>();
  readonly profileClick = output<void>();
  readonly menuClick = output<void>();

  protected async signOut() {
    await this._authService.signOut();
  }

  protected onSearchInput(value: string) {
    this._emitFilter(value);
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

  protected onProfileClick() {
    this.profileClick.emit();
  }

  protected onMenuClick() {
    this.menuClick.emit();
  }

  private _emitFilter(query = '') {
    this.filterChange.emit({
      query,
      dateFrom: this.dateFrom() ? new Date(this.dateFrom()) : null,
      dateTo: this.dateTo() ? new Date(this.dateTo()) : null
    });
  }
}
