import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-user-avatar',
  imports: [MatButtonModule, MatTooltipModule, TranslatePipe],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent {
  private readonly _authService = inject(AuthService);

  protected readonly user = this._authService.user;
  protected readonly avatarInitial = computed(() => {
    const name = this._authService.user()?.displayName ?? this._authService.user()?.email ?? '?';
    return name.charAt(0).toUpperCase();
  });

  readonly avatarClick = output<void>();
}
