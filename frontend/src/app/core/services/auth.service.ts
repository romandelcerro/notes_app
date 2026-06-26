import { Service, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CryptoService } from './crypto.service';
import { NotesService } from './notes.service';
import { SectionsService } from './sections.service';
import { UserService } from './user.service';
import { getToken, setToken, clearToken } from '../interceptors/auth.interceptor';
import type { AuthResponse, UserResponse } from '@notes-app/shared';
import type { User } from '../models/user.model';

@Service()
export class AuthService {
  private readonly _http = inject(HttpClient);
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

  async signIn(email: string, password: string) {
    const res = await firstValueFrom(
      this._http.post<AuthResponse>(`${environment.apiUrl}/auth/signin`, { email, password }),
    );
    setToken(res.accessToken);
    await this._initUserSession(res.user);
    this.loading.set(false);
    this._router.navigate(['/']);
  }

  async signUp(email: string, password: string, displayName: string) {
    const res = await firstValueFrom(
      this._http.post<AuthResponse>(`${environment.apiUrl}/auth/signup`, {
        email,
        password,
        displayName,
      }),
    );
    setToken(res.accessToken);
    await this._initUserSession(res.user);
    this.loading.set(false);
    this._router.navigate(['/']);
  }

  async signInGuest(displayName: string, email?: string) {
    const res = await firstValueFrom(
      this._http.post<AuthResponse>(`${environment.apiUrl}/auth/guest`, { displayName, email }),
    );
    setToken(res.accessToken);
    await this._initUserSession(res.user);
    this.loading.set(false);
    this._router.navigate(['/']);
  }

  async convertGuest(email: string, password: string) {
    const res = await firstValueFrom(
      this._http.post<AuthResponse>(`${environment.apiUrl}/auth/convert-guest`, {
        email,
        password,
      }),
    );
    setToken(res.accessToken);
    const user = this._userService.user();
    this._userService.user.set({
      uid: res.user.uid,
      displayName: res.user.displayName,
      email: res.user.email,
      photoURL: res.user.photoURL ?? user?.photoURL ?? null,
      isGuest: res.user.isGuest,
      guestExpiresAt: res.user.guestExpiresAt,
    });
  }

  async signOut() {
    this._clearAppData();
    clearToken();
    this._userService.user.set(null);
    this.loading.set(false);
    this._router.navigate(['/login']);
  }

  private async _tryRestoreSession() {
    const token = getToken();
    if (token) {
      try {
        const user = await firstValueFrom(
          this._http.get<UserResponse>(`${environment.apiUrl}/auth/me`),
        );
        await this._initUserSession(user);
        this._router.navigate(['/']);
      } catch {
        clearToken();
      }
    }
    this.loading.set(false);
  }

  private async _initUserSession(user: UserResponse) {
    const mapped: User = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      isGuest: user.isGuest,
      guestExpiresAt: user.guestExpiresAt,
    };
    await this._cryptoService.initKey(user.uid);
    await Promise.all([this._notesService.loadNotes(), this._sectionsService.loadSections()]);
    this._userService.user.set(mapped);
  }

  private _clearAppData() {
    this._cryptoService.key.set(null);
    this._notesService.clearNotes();
    this._sectionsService.clearSections();
  }
}
