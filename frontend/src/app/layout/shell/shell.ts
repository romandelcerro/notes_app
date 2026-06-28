import { Component, ViewChild } from '@angular/core';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { Sidenav } from '../sidenav/sidenav';
import { Toolbar } from '../toolbar/toolbar';
import { MatListModule } from '@angular/material/list';
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidenav, Toolbar, MatSidenavModule, MatListModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  @ViewChild(MatSidenav) public sidenav!: MatSidenav;
}
