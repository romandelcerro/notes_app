import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'notes_access_token';
const REFRESH_TOKEN_KEY = 'notes_refresh_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearAllTokens() {
  clearToken();
  clearRefreshToken();
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getToken();
  const http = inject(HttpClient);
  const router = inject(Router);

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 && !req.url.includes('/auth/refresh')) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          return http
            .post<{
              accessToken: string;
              refreshToken: string;
            }>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
            .pipe(
              switchMap((res) => {
                setToken(res.accessToken);
                setRefreshToken(res.refreshToken);
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${res.accessToken}` },
                });
                return next(retryReq);
              }),
              catchError(() => {
                clearAllTokens();
                router.navigate(['/login']);
                return throwError(() => err);
              }),
            );
        }
        clearAllTokens();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
