import { Component, computed, inject, output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-user-icon',
  imports: [MatBadgeModule, MatButtonModule, MatTooltipModule, TranslatePipe],
  templateUrl: './user-icon.html',
  styleUrl: './user-icon.scss',
})
export class UserIcon {
  protected readonly userService = inject(UserService);

  public readonly userIconClick = output();

  protected readonly defaultUserIcon = computed(() => {
    const displayText = this.userService.user()?.username ?? this.userService.user()?.email ?? '?';

    return displayText.charAt(0).toUpperCase();
  });
}
