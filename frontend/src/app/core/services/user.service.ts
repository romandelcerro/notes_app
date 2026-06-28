import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import type { UserResponse } from '@notes-app/shared';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User } from '../models/user.model';

@Service()
export class UserService {
  private readonly _http = inject(HttpClient);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _translateService = inject(TranslateService);

  public readonly user = signal<User | null>(null);

  public async updateUsername(username: string) {
    const updated = await firstValueFrom(
      this._http.patch<UserResponse>(`${environment.apiUrl}/users/me`, { username }),
    );
    this.user.update((u) =>
      u
        ? {
            ...u,
            username: updated.username,
            isVerified: updated.isVerified,
            plan: updated.plan,
            storageUsedBytes: updated.storageUsedBytes,
          }
        : u,
    );
  }

  public async updateLocalAvatar(dataURL: string) {
    try {
      await firstValueFrom(
        this._http.patch(`${environment.apiUrl}/users/me`, { photoURL: dataURL }),
      );
      this.user.update((u) => (u ? { ...u, photoURL: dataURL } : u));
      this._snackBar.open(
        this._translateService.instant('profile.photoUpdated'),
        this._translateService.instant('common.close'),
        { duration: 3000 },
      );
    } catch {
      this._snackBar.open(
        this._translateService.instant('profile.photoUpdateError'),
        this._translateService.instant('common.close'),
        { duration: 5000 },
      );
    }
  }

  public async removeLocalAvatar() {
    try {
      await firstValueFrom(this._http.patch(`${environment.apiUrl}/users/me`, { photoURL: null }));
      this.user.update((u) => (u ? { ...u, photoURL: null } : u));
      this._snackBar.open(
        this._translateService.instant('profile.photoRemoved'),
        this._translateService.instant('common.close'),
        { duration: 3000 },
      );
    } catch {
      this._snackBar.open(
        this._translateService.instant('profile.photoRemoveError'),
        this._translateService.instant('common.close'),
        { duration: 5000 },
      );
    }
  }
}
