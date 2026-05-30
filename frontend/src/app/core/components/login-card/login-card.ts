import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-card',
  imports: [MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule, TranslatePipe],
  templateUrl: './login-card.html',
  styleUrl: './login-card.scss'
})
export class LoginCard {
  private readonly _authService = inject(AuthService);
  private readonly _translateService = inject(TranslateService);

  protected readonly loading = signal(false);
  protected readonly errorText = signal('');

  protected async signInWithGoogle() {
    this.loading.set(true);
    this.errorText.set('');
    try {
      await this._authService.signInWithGoogle();
    } catch {
      this.errorText.set(this._translateService.instant('login.error'));
    } finally {
      this.loading.set(false);
    }
  }
}
