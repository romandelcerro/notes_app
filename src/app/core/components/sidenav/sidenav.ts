import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { SectionList } from '../../../domains/sections/section-list/section-list';
import { AuthService } from '../../services/auth.service';
import { SettingsModal } from '../settings-modal/settings-modal';

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
