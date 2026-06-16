import { Injectable, signal } from '@angular/core';
import type { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly user = signal<User | null>(null);

  async updateDisplayName(name: string) {
    this.user.update(u => {
      if (!u) return u;
      const updated = { ...u, displayName: name };
      this._persistUser(updated);
      return updated;
    });
  }

  async updateLocalAvatar(dataURL: string) {
    const uid = this.user()?.uid;
    if (!uid) return;
    localStorage.setItem(this._avatarKey(uid), dataURL);
    this.user.update(u => (u ? { ...u, photoURL: dataURL } : u));
  }

  async removeLocalAvatar() {
    const uid = this.user()?.uid;
    if (!uid) return;
    localStorage.removeItem(this._avatarKey(uid));
    this.user.update(u => (u ? { ...u, photoURL: null } : u));
  }

  private _avatarKey(uid: string) {
    return `notes_avatar_${uid}`;
  }

  private _persistUser(user: User) {
    localStorage.setItem('notes_local_user', JSON.stringify({ uid: user.uid, displayName: user.displayName, email: user.email ?? '' }));
  }
}
