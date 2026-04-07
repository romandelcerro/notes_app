import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogModal } from '../../../shared/confirm-dialog-modal/confirm-dialog-modal';
import { AuthService } from '../../services/auth.service';
import { BackupService } from '../../services/backup.service';
import { NotesService } from '../../services/notes.service';
import { SectionsService } from '../../services/sections.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-menu-modal',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDividerModule, MatTooltipModule, FormsModule, TranslatePipe],
  templateUrl: './user-menu-modal.html',
  styleUrl: './user-menu-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserMenuModal {
  private readonly _authService = inject(AuthService);
  private readonly _userService = inject(UserService);
  private readonly _backupService = inject(BackupService);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _translateService = inject(TranslateService);

  private readonly _snackBar = inject(MatSnackBar);
  private readonly _dialog = inject(MatDialog);
  private readonly _dialogRef = inject(MatDialogRef<UserMenuModal>);

  protected readonly user = this._userService.user;
  protected readonly displayName = signal(this._userService.user()?.displayName ?? '');
  protected readonly saving = signal(false);
  protected readonly exporting = signal(false);
  protected readonly importing = signal(false);
  protected readonly clearing = signal(false);

  protected readonly avatarInitial = computed(() => {
    const name = this.user()?.displayName ?? this.user()?.email ?? '?';
    return name.charAt(0).toUpperCase();
  });

  protected async saveName() {
    const name = this.displayName().trim();
    if (!name) return;
    this.saving.set(true);
    try {
      await this._userService.updateDisplayName(name);
    } finally {
      this.saving.set(false);
    }
  }

  protected async uploadAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const dataURL = await this._resizeImage(file, 256);
    await this._userService.updateLocalAvatar(dataURL);
  }

  protected async removeAvatar() {
    await this._userService.removeLocalAvatar();
  }

  protected async signOut() {
    this._dialogRef.close();
    await this._authService.signOut();
  }

  protected async clearAllData() {
    const userId = this.user()?.uid;
    if (!userId) return;
    const confirmed = await firstValueFrom(
      this._dialog
        .open(ConfirmDialogModal, {
          data: {
            title: this._translateService.instant('confirm.title'),
            message: this._translateService.instant('profile.clearDataConfirm'),
            cancelLabel: this._translateService.instant('confirm.cancel'),
            confirmLabel: this._translateService.instant('confirm.delete'),
            confirmVariant: 'warn'
          }
        })
        .afterClosed()
    );
    if (!confirmed) return;
    this.clearing.set(true);
    try {
      await this._notesService.clearAllData(userId);
      await this._sectionsService.clearAllData(userId);
      window.location.reload();
    } finally {
      this.clearing.set(false);
    }
  }

  protected async exportBackup() {
    const userId = this.user()?.uid;
    if (!userId) return;
    this.exporting.set(true);
    try {
      await this._backupService.exportBackup(userId);
      this._snackBar.open(this._translateService.instant('backup.exportSuccess'), this._translateService.instant('common.close'), { duration: 3000 });
    } catch (err) {
      const key = err instanceof Error ? err.message : 'backup.exportError';
      this._snackBar.open(this._translateService.instant(key), this._translateService.instant('common.close'), { duration: 5000 });
    } finally {
      this.exporting.set(false);
    }
  }

  protected async importBackup(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const userId = this.user()?.uid;
    if (!userId) return;
    this.importing.set(true);
    try {
      await this._backupService.importBackup(file, userId);
      this._snackBar.open(this._translateService.instant('backup.importSuccess'), this._translateService.instant('common.close'), { duration: 3000 });
    } catch (err) {
      const key = err instanceof Error ? err.message : 'backup.importError';
      this._snackBar.open(this._translateService.instant(key), this._translateService.instant('common.close'), { duration: 5000 });
    } finally {
      input.value = '';
      this.importing.set(false);
    }
  }

  private _resizeImage(file: File, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectURL = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectURL);
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.9));
      };
      img.onerror = reject;
      img.src = objectURL;
    });
  }
}
