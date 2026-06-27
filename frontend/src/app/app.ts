import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { THEME } from './core/constants/app.constants';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatProgressSpinnerModule],
  template: `
    @if (authService.loading()) {
      <div class="auth-loading">
        <mat-spinner />
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: `
    .auth-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: var(--mat-sys-surface);
    }
  `,
})
export class App {
  protected readonly authService = inject(AuthService);

  constructor() {
    if (localStorage.getItem(THEME.STORAGE_KEY) === THEME.DARK) {
      document.documentElement.classList.add(THEME.CSS_CLASS);
    }
  }
}
