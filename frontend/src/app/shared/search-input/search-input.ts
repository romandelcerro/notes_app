import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-search-input',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './search-input.html',
  styleUrl: './search-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchInput {
  protected readonly searchQuery = signal('');

  readonly queryChange = output<string>();

  protected onInput(value: string) {
    this.searchQuery.set(value);
    this.queryChange.emit(value);
  }
}
