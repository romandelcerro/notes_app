import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Section } from '../../core/models/section.model';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-sidenav',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TranslatePipe],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent {
  readonly selectedSectionId = input.required<number | null>();
  readonly sections = input.required<Section[]>();

  readonly closeClick = output<void>();
  readonly sectionSelect = output<number | null>();
  readonly newSectionClick = output<void>();
  readonly editSectionClick = output<Section>();
  readonly deleteSectionClick = output<Section>();
  readonly signOutClick = output<void>();
}
