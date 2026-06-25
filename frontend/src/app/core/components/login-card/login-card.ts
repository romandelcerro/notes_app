import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-card',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTabsModule, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './login-card.html',
  styleUrl: './login-card.scss'
})
export class LoginCard {
  private readonly _authService = inject(AuthService);
  private readonly _translateService = inject(TranslateService);

  protected readonly loading = signal(false);
  protected readonly errorText = signal('');

  protected signInEmail = '';
  protected signInPassword = '';

  protected signUpEmail = '';
  protected signUpPassword = '';
  protected signUpName = '';

  protected guestName = '';
  protected guestEmail = '';

  protected async onSignIn() {
    if (!this.signInEmail.trim() || !this.signInPassword.trim()) return;
    this.loading.set(true);
    this.errorText.set('');
    try {
      await this._authService.signIn(this.signInEmail.trim(), this.signInPassword);
    } catch (err: unknown) {
      const body = err && typeof err === 'object' && 'error' in err ? (err as { error: { translationKey?: string; message?: string } }).error : null;
      this.errorText.set(this._translateService.instant(body?.translationKey ?? body?.message ?? 'login.error'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async onSignUp() {
    if (!this.signUpEmail.trim() || !this.signUpPassword.trim() || !this.signUpName.trim()) return;
    this.loading.set(true);
    this.errorText.set('');
    try {
      await this._authService.signUp(this.signUpEmail.trim(), this.signUpPassword, this.signUpName.trim());
    } catch (err: unknown) {
      const body = err && typeof err === 'object' && 'error' in err ? (err as { error: { translationKey?: string; message?: string } }).error : null;
      this.errorText.set(this._translateService.instant(body?.translationKey ?? body?.message ?? 'login.error'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async onGuest() {
    const name = this.guestName.trim();
    if (!name) return;
    this.loading.set(true);
    this.errorText.set('');
    try {
      await this._authService.signInGuest(name, this.guestEmail.trim() || undefined);
    } catch (err: unknown) {
      const body = err && typeof err === 'object' && 'error' in err ? (err as { error: { translationKey?: string; message?: string } }).error : null;
      this.errorText.set(this._translateService.instant(body?.translationKey ?? body?.message ?? 'login.error'));
    } finally {
      this.loading.set(false);
    }
  }
}