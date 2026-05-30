import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { SettingsModal } from '../../core/components/settings-modal/settings-modal';
import { AuthService } from '../../core/services/auth.service';
import { SectionList } from '../../domains/sections/section-list/section-list';

@Component({
  selector: 'app-sidenav',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe, SettingsModal, SectionList],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sidenav {
  private readonly _authService = inject(AuthService);

  readonly closeClick = output<void>();

  protected async signOut() {
    await this._authService.signOut();
  }
}
