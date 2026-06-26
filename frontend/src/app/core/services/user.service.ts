import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _http = inject(HttpClient);

  readonly user = signal<User | null>(null);

  async updateDisplayName(name: string) {
    const updated = await firstValueFrom(
      this._http.patch<UserResponse>(`${environment.apiUrl}/users/me`, { displayName: name }),
    );
    this.user.update((u) => (u ? { ...u, displayName: updated.displayName } : u));
  }

  async updateLocalAvatar(dataURL: string) {
    await firstValueFrom(this._http.patch(`${environment.apiUrl}/users/me`, { photoURL: dataURL }));
    this.user.update((u) => (u ? { ...u, photoURL: dataURL } : u));
  }

  async removeLocalAvatar() {
    await firstValueFrom(this._http.patch(`${environment.apiUrl}/users/me`, { photoURL: null }));
    this.user.update((u) => (u ? { ...u, photoURL: null } : u));
  }
}

interface UserResponse {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
}
