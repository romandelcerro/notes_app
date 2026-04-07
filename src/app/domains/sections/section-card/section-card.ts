import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import type { Section } from '../../../core/models/section.model';

@Component({
  selector: 'app-section-card',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TranslatePipe],
  templateUrl: './section-card.html',
  styleUrl: './section-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.has-menu]': 'section() !== null' }
})
export class SectionCard {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly section = input<Section | null>(null);
  readonly active = input(false);
  readonly primary = input(false);

  readonly selectClick = output<void>();
  readonly editClick = output<Section>();
  readonly deleteClick = output<Section>();
}
