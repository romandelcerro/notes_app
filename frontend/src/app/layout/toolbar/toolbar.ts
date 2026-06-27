import { Component, DestroyRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { UserMenuModal } from '../../core/components/user-menu-modal/user-menu-modal';
import { NotesService } from '../../core/services/notes.service';
import { Clock } from '../../shared/clock/clock';
import { SearchNotesInput } from '../../shared/search-notes-input/search-notes-input';
import { UserIcon } from '../../shared/user-icon/user-icon';

@Component({
  selector: 'app-toolbar',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    TranslatePipe,
    SearchNotesInput,
    UserIcon,
    Clock,
  ],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _dialog = inject(MatDialog);
  protected readonly noteFilterService = inject(NotesService);

  public readonly sidenavOpened = input(false);
  public readonly toggleSidenav = output();

  protected openUserModal() {
    this._dialog
      .open(UserMenuModal, { maxHeight: '90dvh' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef));
  }
}
