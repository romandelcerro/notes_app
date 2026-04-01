import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import type { AppUser } from '../models/user.model';
import { CryptoService } from './crypto.service';
import { NotesService } from './notes.service';
import { SectionsService } from './sections.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _router = inject(Router);
  private readonly _cryptoService = inject(CryptoService);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);

  private readonly _auth = getAuth();
  private readonly _provider = new GoogleAuthProvider();

  private readonly _user = signal<AppUser | null>(null);
  private readonly _loading = signal(true);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  private readonly _redirectOnAuth = effect(() => {
    if (!this._loading()) {
      this._router.navigate(this._user() ? ['/'] : ['/login']);
    }
  });

  constructor() {
    this._listenToAuthState();
  }

  async signInWithGoogle() {
    await signInWithPopup(this._auth, this._provider);
  }

  async signOut() {
    await signOut(this._auth);
    this._cryptoService.clearKey();
    this._notesService.clearNotes();
    this._sectionsService.clearSections();
  }

  async updateDisplayName(name: string) {
    const firebaseUser = this._auth.currentUser;
    if (!firebaseUser) return;
    await updateProfile(firebaseUser, { displayName: name });
    this._user.update((u) => (u ? { ...u, displayName: name } : u));
  }

  async updateLocalAvatar(dataURL: string) {
    const uid = this._auth.currentUser?.uid;
    if (!uid) return;
    localStorage.setItem(this._avatarKey(uid), dataURL);
    this._user.update((u) => (u ? { ...u, photoURL: dataURL } : u));
  }

  async removeLocalAvatar() {
    const uid = this._auth.currentUser?.uid;
    if (!uid) return;
    localStorage.removeItem(this._avatarKey(uid));
    const googlePhotoURL = this._auth.currentUser?.photoURL ?? null;
    this._user.update((u) => (u ? { ...u, photoURL: googlePhotoURL } : u));
  }

  private _listenToAuthState() {
    onAuthStateChanged(this._auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this._initUserSession(firebaseUser);
      } else {
        this._user.set(null);
      }
      this._loading.set(false);
    });
  }

  private async _initUserSession(firebaseUser: User) {
    await this._cryptoService.initKey(firebaseUser.uid);
    await Promise.all([
      this._notesService.loadNotes(firebaseUser.uid),
      this._sectionsService.loadSections(firebaseUser.uid),
    ]);
    this._user.set(this._mapFirebaseUser(firebaseUser));
  }

  private _mapFirebaseUser(firebaseUser: User): AppUser {
    const localAvatar = localStorage.getItem(this._avatarKey(firebaseUser.uid));
    return {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: localAvatar ?? firebaseUser.photoURL,
    };
  }

  private _avatarKey(uid: string) {
    return `notes_avatar_${uid}`;
  }
}
