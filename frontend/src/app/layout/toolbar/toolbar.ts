import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { UserMenuModal } from '../../core/components/user-menu-modal/user-menu-modal';
import { AuthService } from '../../core/services/auth.service';
import { NotesService } from '../../core/services/notes.service';
import { Clock } from '../../shared/clock/clock';
import { SearchInput } from '../../shared/search-input/search-input';
import { UserAvatar } from '../../shared/user-avatar/user-avatar';

@Component({
  selector: 'app-toolbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TranslatePipe, SearchInput, UserAvatar, Clock],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss'
})
export class Toolbar {
  private readonly _authService = inject(AuthService);
  private readonly _noteFilterService = inject(NotesService);

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _dialog = inject(MatDialog);
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');

  readonly sidenavOpen = input(false);
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
    this._dialog.open(UserMenuModal, { maxHeight: '90dvh' }).afterClosed().pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
  }

  protected onMenuClick() {
    this.menuClick.emit();
  }

  private _emitFilter(query = '') {
    this._noteFilterService.filter.set({
      query,
      dateFrom: this.dateFrom() ? new Date(this.dateFrom()) : null,
      dateTo: this.dateTo() ? new Date(this.dateTo()) : null
    });
  }
}
