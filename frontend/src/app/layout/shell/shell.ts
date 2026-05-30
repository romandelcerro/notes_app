import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { Sidenav } from '../sidenav/sidenav';
import { Toolbar } from '../toolbar/toolbar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidenav, Toolbar, MatSidenavModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Shell {
  protected readonly sidenavOpen = signal(false);

  protected toggleSidenav() {
    this.sidenavOpen.update(open => !open);
  }
}
