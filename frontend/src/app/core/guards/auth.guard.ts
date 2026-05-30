import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { type CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

function createAuthGuard(requireAuth: boolean): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const resolve = () => (auth.isAuthenticated() ? (requireAuth ? true : router.createUrlTree(['/'])) : requireAuth ? router.createUrlTree(['/login']) : true);

    if (!auth.loading()) return resolve();

    return toObservable(auth.loading).pipe(
      filter(loading => !loading),
      take(1),
      map(resolve)
    );
  };
}

export const authGuard: CanActivateFn = createAuthGuard(true);
export const guestGuard: CanActivateFn = createAuthGuard(false);
