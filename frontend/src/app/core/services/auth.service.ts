import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { AuthResponse, UserResponse } from '@notes-app/shared';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  clearAllTokens,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from '../interceptors/auth.interceptor';
import type { User } from '../models/user.model';
import { CryptoService } from './crypto.service';
import { NotesService } from './notes.service';
import { SectionsService } from './sections.service';
import { UserService } from './user.service';

@Service()
export class AuthService {
  private readonly _http = inject(HttpClient);
  private readonly _router = inject(Router);
  private readonly _cryptoService = inject(CryptoService);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _userService = inject(UserService);

  public readonly loading = signal(true);
  public readonly isAuthenticated = computed(() => !!this._userService.user());

  constructor() {
    this._tryRestoreSession();
  }

  public async signIn(email: string, password: string) {
    const res = await firstValueFrom(
      this._http.post<AuthResponse>(`${environment.apiUrl}/auth/signin`, { email, password }),
    );
    setToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    await this._initUserSession(res.user);
    this.loading.set(false);
    this._router.navigate(['/']);
  }

  public async signUp(email: string, password: string, username: string) {
    const res = await firstValueFrom(
      this._http.post<AuthResponse>(`${environment.apiUrl}/auth/signup`, {
        email,
        password,
        username,
      }),
    );
    setToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    await this._initUserSession(res.user);
    this.loading.set(false);
    this._router.navigate(['/']);
  }

  public async signInGuest(username: string, email?: string) {
    const res = await firstValueFrom(
      this._http.post<AuthResponse>(`${environment.apiUrl}/auth/guest`, { username, email }),
    );
    setToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    await this._initUserSession(res.user);
    this.loading.set(false);
    this._router.navigate(['/']);
  }

  public async convertGuest(email: string, password: string) {
    const res = await firstValueFrom(
      this._http.post<AuthResponse>(`${environment.apiUrl}/auth/convert-guest`, {
        email,
        password,
      }),
    );
    setToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    this._userService.user.set(this._mapUser(res.user));
  }

  public async signOut() {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await firstValueFrom(
          this._http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }),
        );
      }
    } catch {
      // ignore logout errors
    }
    this._clearAppData();
    clearAllTokens();
    this._userService.user.set(null);
    this.loading.set(false);
    this._router.navigate(['/login']);
  }

  public async signOutAll() {
    try {
      await firstValueFrom(this._http.post(`${environment.apiUrl}/auth/logout-all`, {}));
    } catch {
      // ignore
    }
    this._clearAppData();
    clearAllTokens();
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
        clearAllTokens();
      }
    }
    this.loading.set(false);
  }

  private _mapUser(user: UserResponse): User {
    return {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL,
      username: user.username,
      isVerified: user.isVerified,
      plan: user.plan,
      storageUsedBytes: user.storageUsedBytes,
      isGuest: user.isGuest,
      guestExpiresAt: user.guestExpiresAt,
    };
  }

  private async _initUserSession(user: UserResponse) {
    const mapped = this._mapUser(user);
    await this._cryptoService.initKey(user.uid);
    await Promise.all([this._notesService.loadNotes(), this._sectionsService.loadSections()]);
    this._userService.user.set(mapped);
  }

  private _clearAppData() {
    this._cryptoService.key.set(null);
    this._notesService.clearNotes();
    this._sectionsService.sections.set([]);
  }
}
