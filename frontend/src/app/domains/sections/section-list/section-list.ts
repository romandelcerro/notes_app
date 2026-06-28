import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import type { Section } from '../../../core/models/section.model';
import { NotesService } from '../../../core/services/notes.service';
import { SectionsService } from '../../../core/services/sections.service';
import { ConfirmDialogModal } from '../../../shared/confirm-dialog-modal/confirm-dialog-modal';
import { SectionCard } from '../section-card/section-card';
import { SectionUpsertModal } from '../section-upsert-modal/section-upsert-modal';

@Component({
  selector: 'app-section-list',
  imports: [MatButtonModule, MatIconModule, TranslatePipe, SectionCard],
  templateUrl: './section-list.html',
  styleUrl: './section-list.scss',
})
export class SectionList {
  private readonly _notesService = inject(NotesService);
  private readonly _translateService = inject(TranslateService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);
  protected readonly dialog = inject(MatDialog);
  protected readonly sectionsService = inject(SectionsService);

  protected selectSection(id: number | null) {
    if (!id) {
      this._router.navigate(['/list']);
      this.sectionsService.currentSectionSelected.set(null);
    } else {
      const section = this.sectionsService.sections().find((s) => s.id === id);
      if (section) {
        this._router.navigate(['/list', section.name]);
        this.sectionsService.currentSectionSelected.set(section);
      }
    }
  }

  protected async deleteSection(section: Section) {
    const confirmDelete = await firstValueFrom<boolean>(
      this.dialog
        .open(ConfirmDialogModal, {
          data: {
            title: this._translateService.instant('confirm.title'),
            message: this._translateService.instant('confirm.deleteSection', {
              name: this.sectionsService.displaySectionName(section),
            }),
            cancelLabel: this._translateService.instant('confirm.cancel'),
            confirmLabel: this._translateService.instant('confirm.delete'),
            confirmVariant: 'warn',
          },
        })
        .afterClosed(),
    );
    if (!confirmDelete) return;
    this._notesService.notes.update((notes) => notes.filter((n) => n.sectionId !== section.id));
    try {
      await this.sectionsService.deleteSection(section.id!);
      this._snackBar.open(
        this._translateService.instant('section.deleted'),
        this._translateService.instant('common.close'),
        { duration: 3000 },
      );
    } catch {
      this._snackBar.open(
        this._translateService.instant('section.deleteError'),
        this._translateService.instant('common.close'),
        { duration: 5000 },
      );
    }
    const hasData = this._notesService.notes().length || this.sectionsService.sections().length;
    this._router.navigate([hasData ? '/list' : '/']);
  }

  protected openUpsertSectionModal(section?: Section) {
    this.dialog
      .open(SectionUpsertModal, { data: section ? { section } : undefined })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((upsertSection: Section | boolean) => {
        if (upsertSection && typeof upsertSection !== 'boolean' && upsertSection.id) {
          console.log('upsertSection', upsertSection);
          this._router.navigate(['/list', upsertSection.name]);
          this.sectionsService.currentSectionSelected.set(upsertSection);
        }
      });
  }
}
