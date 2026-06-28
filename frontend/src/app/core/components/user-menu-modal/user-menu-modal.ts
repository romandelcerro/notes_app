import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, readonly } from '@angular/forms/signals';
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
import { NotesService } from '../../services/notes.service';
import { SectionsService } from '../../services/sections.service';
import { UserService } from '../../services/user.service';
import { SettingsModal } from '../settings-modal/settings-modal';

@Component({
  selector: 'app-user-menu-modal',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    FormField,
    TranslatePipe,
    SettingsModal,
  ],
  templateUrl: './user-menu-modal.html',
  styleUrl: './user-menu-modal.scss',
})
export class UserMenuModal {
  private readonly _authService = inject(AuthService);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _translateService = inject(TranslateService);

  private readonly _snackBar = inject(MatSnackBar);
  private readonly _dialog = inject(MatDialog);
  private readonly _dialogRef = inject(MatDialogRef<UserMenuModal>);

  protected readonly userService = inject(UserService);

  protected readonly defaultUserIcon = computed(() => {
    const displayText = this.userService.user()?.username ?? this.userService.user()?.email ?? '?';
    return displayText.charAt(0).toUpperCase();
  });

  protected readonly saving = signal(false);
  protected readonly converting = signal(false);
  protected readonly clearing = signal(false);

  protected readonly profileFormData = signal({
    displayEmail: this.userService.user()?.email ?? '',
    username: this.userService.user()?.username ?? '',
    convertEmail: '',
    convertPassword: '',
  });
  protected readonly profileForm = form(this.profileFormData, (path) => {
    readonly(path.displayEmail, { when: () => true });
  });

  protected async saveName() {
    const name = this.profileFormData().username.trim();
    if (!name) return;
    this.saving.set(true);
    try {
      await this.userService.updateUsername(name);
      this._snackBar.open(
        this._translateService.instant('profile.saved'),
        this._translateService.instant('common.close'),
        { duration: 3000 },
      );
    } catch {
      this._snackBar.open(
        this._translateService.instant('profile.saveError'),
        this._translateService.instant('common.close'),
        { duration: 5000 },
      );
    } finally {
      this.saving.set(false);
    }
  }

  protected async uploadAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const dataURL = await this._resizeImage(file, 256);
    await this.userService.updateLocalAvatar(dataURL);
  }

  protected async removeAvatar() {
    try {
      await this.userService.removeLocalAvatar();
    } catch {
      this._snackBar.open(
        this._translateService.instant('profile.photoRemoveError'),
        this._translateService.instant('common.close'),
        { duration: 5000 },
      );
    }
  }

  protected async signOut() {
    this._dialogRef.close();
    await this._authService.signOut();
  }

  protected async convertAccount() {
    const data = this.profileFormData();
    const email = data.convertEmail.trim();
    const password = data.convertPassword;
    if (!email || !password) return;
    this.converting.set(true);
    try {
      await this._authService.convertGuest(email, password);
      this._snackBar.open(
        this._translateService.instant('profile.convertSuccess'),
        this._translateService.instant('common.close'),
        { duration: 3000 },
      );
    } catch {
      this._snackBar.open(
        this._translateService.instant('profile.convertError'),
        this._translateService.instant('common.close'),
        { duration: 5000 },
      );
    } finally {
      this.converting.set(false);
    }
  }

  protected async clearAllData() {
    const user = this.userService.user();
    if (!user?.uid) return;
    const confirmed = await firstValueFrom(
      this._dialog
        .open(ConfirmDialogModal, {
          data: {
            title: this._translateService.instant('confirm.title'),
            message: this._translateService.instant('profile.clearDataConfirm'),
            cancelLabel: this._translateService.instant('confirm.cancel'),
            confirmLabel: this._translateService.instant('confirm.delete'),
            confirmVariant: 'warn',
          },
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    this.clearing.set(true);
    try {
      await this._notesService.clearAllData();
      await this._sectionsService.clearAllData();
      this._snackBar.open(
        this._translateService.instant('profile.dataCleared'),
        this._translateService.instant('common.close'),
        { duration: 3000 },
      );
    } catch {
      this._snackBar.open(
        this._translateService.instant('profile.dataClearError'),
        this._translateService.instant('common.close'),
        { duration: 5000 },
      );
    } finally {
      this.clearing.set(false);
      window.location.reload();
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
