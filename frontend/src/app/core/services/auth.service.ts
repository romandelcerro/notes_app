import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CryptoService } from './crypto.service';
import { NotesService } from './notes.service';
import { SectionsService } from './sections.service';
import { UserService } from './user.service';
import type { User } from '../models/user.model';

const STORAGE_KEY = 'notes_local_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _router = inject(Router);
  private readonly _cryptoService = inject(CryptoService);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _userService = inject(UserService);

  readonly loading = signal(true);
  readonly isAuthenticated = computed(() => !!this._userService.user());

  constructor() {
    this._tryRestoreSession();
  }

  async signIn(name: string, email?: string) {
    const uid = crypto.randomUUID();
    const user: User = { uid, displayName: name, email: email ?? null, photoURL: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ uid, displayName: name, email: email ?? '' }));
    await this._initUserSession(user);
    this.loading.set(false);
    this._router.navigate(['/']);
  }

  async signOut() {
    this._clearAppData();
    localStorage.removeItem(STORAGE_KEY);
    this._userService.user.set(null);
    this._router.navigate(['/login']);
  }

  private async _tryRestoreSession() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored) as { uid: string; displayName: string; email?: string };
        const user: User = { uid: data.uid, displayName: data.displayName, email: data.email ?? null, photoURL: null };
        const localAvatar = localStorage.getItem(`notes_avatar_${data.uid}`);
        if (localAvatar) user.photoURL = localAvatar;
        await this._initUserSession(user);
        this._router.navigate(['/']);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    this.loading.set(false);
  }

  private async _initUserSession(user: User) {
    await this._cryptoService.initKey(user.uid);
    await Promise.all([this._notesService.loadNotes(user.uid), this._sectionsService.loadSections(user.uid)]);
    this._userService.user.set(user);
  }

  private _clearAppData() {
    this._cryptoService.key.set(null);
    this._notesService.clearNotes();
    this._sectionsService.clearSections();
  }
}
