import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-card',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './login-card.html',
  styleUrl: './login-card.scss'
})
export class LoginCard {
  private readonly _authService = inject(AuthService);
  private readonly _translateService = inject(TranslateService);

  protected readonly loading = signal(false);
  protected readonly errorText = signal('');
  protected name = '';
  protected email = '';

  protected async signIn() {
    const name = this.name.trim();
    if (!name) return;
    this.loading.set(true);
    this.errorText.set('');
    try {
      await this._authService.signIn(name, this.email.trim() || undefined);
    } catch {
      this.errorText.set(this._translateService.instant('login.error'));
    } finally {
      this.loading.set(false);
    }
  }
}
