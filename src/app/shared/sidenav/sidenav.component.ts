import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Section } from '../../core/models/section.model';
import { SectionItemComponent } from '../section-item/section-item.component';
import { SettingsComponent } from '../settings/settings.component';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-sidenav',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe, SettingsComponent, SectionItemComponent],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
