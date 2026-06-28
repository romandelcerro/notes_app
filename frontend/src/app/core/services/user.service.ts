import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { UserResponse } from '@notes-app/shared';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User } from '../models/user.model';

@Service()
export class UserService {
  private readonly _http = inject(HttpClient);

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
    await firstValueFrom(this._http.patch(`${environment.apiUrl}/users/me`, { photoURL: dataURL }));
    this.user.update((u) => (u ? { ...u, photoURL: dataURL } : u));
  }

  public async removeLocalAvatar() {
    await firstValueFrom(this._http.patch(`${environment.apiUrl}/users/me`, { photoURL: null }));
    this.user.update((u) => (u ? { ...u, photoURL: null } : u));
  }
}
