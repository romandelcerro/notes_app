import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { interval, map } from 'rxjs';
const DEFAULT_LANG = 'es';
const LOCALE_ES = 'es-ES';
const LOCALE_EN = 'en-US';
const CLOCK_TICK_INTERVAL_MS = 1000;

@Component({
  selector: 'app-clock',
  imports: [],
  templateUrl: './clock.html',
  styleUrl: './clock.scss',
})
export class Clock {
  private readonly _translateService = inject(TranslateService);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _currentLang = toSignal(
    this._translateService.onLangChange.pipe(map((e) => e.lang)),
    { initialValue: this._translateService.getCurrentLang() ?? DEFAULT_LANG },
  );

  private readonly _currentDate = signal(new Date());

  private readonly _locale = computed(() =>
    this._currentLang() === DEFAULT_LANG ? LOCALE_ES : LOCALE_EN,
  );

  protected readonly clockDay = computed(() =>
    this._currentDate().toLocaleDateString(this._locale(), { weekday: 'long' }),
  );

  protected readonly clockDate = computed(() =>
    this._currentDate().toLocaleDateString(this._locale(), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );
  protected readonly clockTime = computed(() =>
    this._currentDate().toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit' }),
  );

  constructor() {
    interval(CLOCK_TICK_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._currentDate.set(new Date()));
  }
}
