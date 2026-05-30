import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import type { Section } from '../../../core/models/section.model';
import { NotesService } from '../../../core/services/notes.service';
import { SectionsService } from '../../../core/services/sections.service';
import { ConfirmDialogModal } from '../../../shared/confirm-dialog-modal/confirm-dialog-modal';
import { SectionCard } from '../section-card/section-card';
import { SectionCreateEditModal } from '../section-create-edit-modal/section-create-edit-modal';

@Component({
  selector: 'app-section-list',
  imports: [MatButtonModule, MatIconModule, TranslatePipe, SectionCard],
  templateUrl: './section-list.html',
  styleUrl: './section-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionList {
  private readonly _sectionsService = inject(SectionsService);
  private readonly _notesService = inject(NotesService);
  private readonly _translateService = inject(TranslateService);
  private readonly _dialog = inject(MatDialog);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

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
        .open(ConfirmDialogModal, {
          data: {
            title: this._translateService.instant('confirm.title'),
            message: this._translateService.instant('confirm.deleteSection', { name: section.name }),
            cancelLabel: this._translateService.instant('confirm.cancel'),
            confirmLabel: this._translateService.instant('confirm.delete'),
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

  protected editSection(section: Section) {
    this._dialog.open(SectionCreateEditModal, { data: { section } });
  }

  protected openNewSection() {
    this._dialog
      .open(SectionCreateEditModal)
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
}
