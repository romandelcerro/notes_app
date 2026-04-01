import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../shared/translate.pipe';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly _authService = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected async signInWithGoogle() {
    this.loading.set(true);
    this.error.set('');
    try {
      await this._authService.signInWithGoogle();
    } catch {
      this.error.set('No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
