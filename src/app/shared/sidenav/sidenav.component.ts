import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, output } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import type { Section } from '../../core/models/section.model';
import { AuthService } from '../../core/services/auth.service';
import { NotesService } from '../../core/services/notes.service';
import { SectionsService } from '../../core/services/sections.service';
import { TranslationService } from '../../core/services/translation.service';
import { SectionDialogComponent } from '../../domains/notes/section-dialog/section-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { SectionItemComponent } from '../section-item/section-item.component';
import { SettingsComponent } from '../settings/settings.component';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-sidenav',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe, SettingsComponent, SectionItemComponent],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent {
  private readonly _dialog = inject(MatDialog);
  private readonly _router = inject(Router);
  private readonly _authService = inject(AuthService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _notesService = inject(NotesService);
  private readonly _translateService = inject(TranslationService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly closeClick = output<void>();

  protected readonly sections = this._sectionsService.sections;

  private readonly _currentUrl = toSignal(
    this._router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this._router.url),
      startWith(this._router.url)
    )
  );

  protected readonly selectedSectionId = computed(() => {
    const url = this._currentUrl() ?? '';
    const match = url.match(/^\/list\/(.+)$/);
    if (!match) return null;
    const sectionName = decodeURIComponent(match[1]);
    return this.sections().find(s => s.name === sectionName)?.id ?? null;
  });

  protected selectSection(id: number | null) {
    if (id === null) {
      this._router.navigate(['/list']);
    } else {
      const section = this.sections().find(s => s.id === id);
      if (section) {
        this._router.navigate(['/list', section.name]);
      }
    }
  }

  protected async deleteSection(section: Section) {
    const confirmed = await firstValueFrom(
      this._dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: this._translateService.t('confirm.title'),
            message: this._translateService.t('confirm.deleteSection', { name: section.name }),
            cancelLabel: this._translateService.t('confirm.cancel'),
            confirmLabel: this._translateService.t('confirm.delete'),
            confirmVariant: 'warn'
          }
        })
        .afterClosed()
    );
    if (!confirmed) return;
    await this._sectionsService.deleteSection(section.id!);
    this._notesService.removeNotesForSection(section.id!);
    const hasData = this._notesService.notes().length > 0 || this._sectionsService.sections().length > 0;
    this._router.navigate([hasData ? '/list' : '/']);
  }

  protected openNewSection() {
    this._dialog
      .open(SectionDialogComponent)
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(created => {
        if (!created) return;
        const sections = this._sectionsService.sections();
        const newSection = sections[sections.length - 1];
        if (newSection?.id != null) {
          this._router.navigate(['/list', newSection.name]);
        }
      });
  }

  protected async signOut() {
    await this._authService.signOut();
  }

  protected editSection(section: Section) {
    this._dialog.open(SectionDialogComponent, { data: { section } });
  }
}
