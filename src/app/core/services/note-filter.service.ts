import { Injectable, signal } from '@angular/core';
import type { NoteFilter } from '../models/note-filter.model';

@Injectable({ providedIn: 'root' })
export class NoteFilterService {
  private readonly _filter = signal<NoteFilter>({ query: '', dateFrom: null, dateTo: null });

  readonly filter = this._filter.asReadonly();

  set(filter: NoteFilter) {
    this._filter.set(filter);
  }
}
