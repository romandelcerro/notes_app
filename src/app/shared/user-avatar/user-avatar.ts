import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-user-avatar',
  imports: [MatButtonModule, MatTooltipModule, TranslatePipe],
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatar {
  private readonly _userService = inject(UserService);

  protected readonly user = this._userService.user;
  protected readonly avatarInitial = computed(() => {
    const name = this._userService.user()?.displayName ?? this._userService.user()?.email ?? '?';
    return name.charAt(0).toUpperCase();
  });

  readonly avatarClick = output<void>();
}
