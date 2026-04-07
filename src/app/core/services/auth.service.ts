import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth';
import { mapFirebaseUser } from '../mappers/user.mapper';
import { CryptoService } from './crypto.service';
import { NotesService } from './notes.service';
import { SectionsService } from './sections.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _router = inject(Router);
  private readonly _cryptoService = inject(CryptoService);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _userService = inject(UserService);

  private readonly _auth = getAuth();
  private readonly _provider = new GoogleAuthProvider();

  readonly loading = signal(true);
  readonly isAuthenticated = computed(() => !!this._userService.user());

  constructor() {
    this._listenToAuthState();
  }

  async signInWithGoogle() {
    await signInWithPopup(this._auth, this._provider);
  }

  async signOut() {
    await signOut(this._auth);
    this._clearAppData();
  }

  private _listenToAuthState() {
    let isInitialLoad = true;
    onAuthStateChanged(this._auth, async firebaseUser => {
      await this._handleAuthChange(firebaseUser, isInitialLoad);
      this.loading.set(false);
      isInitialLoad = false;
    });
  }

  private async _handleAuthChange(firebaseUser: FirebaseUser | null, isInitialLoad: boolean) {
    if (firebaseUser) {
      await this._initUserSession(firebaseUser);
      if (!isInitialLoad) this._router.navigate(['/']);
    } else {
      this._userService.user.set(null);
      if (!isInitialLoad) this._router.navigate(['/login']);
    }
  }

  private async _initUserSession(firebaseUser: FirebaseUser) {
    await this._cryptoService.initKey(firebaseUser.uid);
    await Promise.all([this._notesService.loadNotes(firebaseUser.uid), this._sectionsService.loadSections(firebaseUser.uid)]);
    const localAvatar = localStorage.getItem(`notes_avatar_${firebaseUser.uid}`);
    this._userService.user.set(mapFirebaseUser(firebaseUser, localAvatar));
  }

  private _clearAppData() {
    this._cryptoService.key.set(null);
    this._notesService.clearNotes();
    this._sectionsService.clearSections();
  }
}
