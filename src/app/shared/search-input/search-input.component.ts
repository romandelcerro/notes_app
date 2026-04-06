import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-search-input',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchInputComponent {
  protected readonly searchQuery = signal('');

  readonly queryChange = output<string>();

  protected onInput(value: string) {
    this.searchQuery.set(value);
    this.queryChange.emit(value);
  }
}
