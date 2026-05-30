import { Injectable, signal } from '@angular/core';
import { getAuth, updateProfile } from 'firebase/auth';
import type { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _auth = getAuth();

  readonly user = signal<User | null>(null);

  async updateDisplayName(name: string) {
    const firebaseUser = this._auth.currentUser;
    if (!firebaseUser) return;
    await updateProfile(firebaseUser, { displayName: name });
    this.user.update(u => (u ? { ...u, displayName: name } : u));
  }

  async updateLocalAvatar(dataURL: string) {
    const uid = this._auth.currentUser?.uid;
    if (!uid) return;
    localStorage.setItem(this._avatarKey(uid), dataURL);
    this.user.update(u => (u ? { ...u, photoURL: dataURL } : u));
  }

  async removeLocalAvatar() {
    const uid = this._auth.currentUser?.uid;
    if (!uid) return;
    localStorage.removeItem(this._avatarKey(uid));
    const googlePhotoURL = this._auth.currentUser?.photoURL ?? null;
    this.user.update(u => (u ? { ...u, photoURL: googlePhotoURL } : u));
  }

  private _avatarKey(uid: string) {
    return `notes_avatar_${uid}`;
  }
}
