import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { BackupService } from '../../core/services/backup.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-user-menu',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    FormsModule,
    TranslatePipe,
  ],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  private readonly _auth = inject(AuthService);
  private readonly _backup = inject(BackupService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _dialogRef = inject(MatDialogRef<UserMenuComponent>);
  private readonly _translateService = inject(TranslationService);

  protected readonly user = this._auth.user;
  protected readonly displayName = signal(this._auth.user()?.displayName ?? '');
  protected readonly saving = signal(false);
  protected readonly exporting = signal(false);
  protected readonly importing = signal(false);

  protected readonly avatarInitial = computed(() => {
    const name = this.user()?.displayName ?? this.user()?.email ?? '?';
    return name.charAt(0).toUpperCase();
  });

  protected async saveName() {
    const name = this.displayName().trim();
    if (!name) return;
    this.saving.set(true);
    try {
      await this._auth.updateDisplayName(name);
    } finally {
      this.saving.set(false);
    }
  }

  protected async uploadAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const dataURL = await this._resizeImage(file, 256);
    await this._auth.updateLocalAvatar(dataURL);
  }

  protected async removeAvatar() {
    await this._auth.removeLocalAvatar();
  }

  protected async signOut() {
    this._dialogRef.close();
    await this._auth.signOut();
  }

  protected async exportBackup() {
    const userId = this.user()?.uid;
    if (!userId) return;
    this.exporting.set(true);
    try {
      await this._backup.exportBackup(userId);
      this._snackBar.open(this._translateService.t('backup.exportSuccess'), this._translateService.t('common.close'), { duration: 3000 });
    } catch (err) {
      const key = err instanceof Error ? err.message : 'backup.exportError';
      this._snackBar.open(this._translateService.t(key), this._translateService.t('common.close'), { duration: 5000 });
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
      await this._backup.importBackup(file, userId);
      this._snackBar.open(this._translateService.t('backup.importSuccess'), this._translateService.t('common.close'), { duration: 3000 });
    } catch (err) {
      const key = err instanceof Error ? err.message : 'backup.importError';
      this._snackBar.open(this._translateService.t(key), this._translateService.t('common.close'), { duration: 5000 });
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
