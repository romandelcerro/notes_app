import { Component } from '@angular/core';
import { SectionList } from '../../domains/sections/section-list/section-list';

@Component({
  selector: 'app-sidenav',
  imports: [SectionList],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav {}
