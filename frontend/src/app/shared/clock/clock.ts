import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';

@Component({
  selector: 'app-clock',
  imports: [],
  templateUrl: './clock.html',
  styleUrl: './clock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Clock {
  private readonly _translateService = inject(TranslateService);

  private readonly _destroyRef = inject(DestroyRef);

  private readonly _currentLang = toSignal(this._translateService.onLangChange.pipe(map(e => e.lang)), { initialValue: this._translateService.getCurrentLang() });
  private readonly _now = signal(new Date());
  private readonly _locale = computed(() => (this._currentLang() === 'es' ? 'es-ES' : 'en-US'));

  protected readonly clockDay = computed(() => this._now().toLocaleDateString(this._locale(), { weekday: 'long' }));
  protected readonly clockDate = computed(() => this._now().toLocaleDateString(this._locale(), { day: 'numeric', month: 'long', year: 'numeric' }));
  protected readonly clockTime = computed(() => this._now().toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit' }));

  constructor() {
    const id = setInterval(() => this._now.set(new Date()), 1000);
    this._destroyRef.onDestroy(() => clearInterval(id));
  }
}
