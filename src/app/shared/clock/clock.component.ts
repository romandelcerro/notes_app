import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-clock',
  imports: [],
  templateUrl: './clock.component.html',
  styleUrl: './clock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClockComponent {
  private readonly _translateService = inject(TranslationService);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _now = signal(new Date());
  private readonly _locale = computed(() => (this._translateService.lang() === 'es' ? 'es-ES' : 'en-US'));

  protected readonly clockDay = computed(() => this._now().toLocaleDateString(this._locale(), { weekday: 'long' }));
  protected readonly clockDate = computed(() => this._now().toLocaleDateString(this._locale(), { day: 'numeric', month: 'long', year: 'numeric' }));
  protected readonly clockTime = computed(() => this._now().toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit' }));

  constructor() {
    const id = setInterval(() => this._now.set(new Date()), 1000);
    this._destroyRef.onDestroy(() => clearInterval(id));
  }
}
