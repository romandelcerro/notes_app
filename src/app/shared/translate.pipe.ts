import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../core/services/translation.service';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly _t = inject(TranslationService);

  transform(key: string, params?: Record<string, string>): string {
    this._t.lang(); // track the signal so Angular re-runs the pipe on language change
    return this._t.t(key, params);
  }
}
