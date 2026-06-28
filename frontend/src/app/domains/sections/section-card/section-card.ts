import { Component, input, output } from '@angular/core';
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
  host: { '[class.has-menu]': 'section() !== null' },
})
export class SectionCard {
  public readonly icon = input.required<string>();
  public readonly label = input.required<string>();
  public readonly section = input<Section | null>(null);
  public readonly active = input(false);
  public readonly primary = input(false);

  public readonly selectClick = output();
  public readonly editClick = output<Section>();
  public readonly deleteClick = output<Section>();
}
