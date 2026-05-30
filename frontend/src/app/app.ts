import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    if (localStorage.getItem('notes_theme') === 'dark') {
      document.documentElement.classList.add('dark-theme');
    }
  }
}

