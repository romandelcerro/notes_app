import { Component, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-search-notes-input',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './search-notes-input.html',
  styleUrl: './search-notes-input.scss',
})
export class SearchNotesInput {
  protected readonly searchInputValue = signal('');

  public readonly searchInputChange = output<string>();

  protected onSearchInputChange(value: string) {
    this.searchInputValue.set(value);
    this.searchInputChange.emit(value);
  }
}
