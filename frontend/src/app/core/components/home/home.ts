import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { NoteUpsertModal } from '../../../domains/notes/note-upsert-modal/note-upsert-modal';
import { SectionUpsertModal } from '../../../domains/sections/section-upsert-modal/section-upsert-modal';
import { Section } from '../../models/section.model';
import { NotesService } from '../../services/notes.service';
import { SectionsService } from '../../services/sections.service';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _translateService = inject(TranslateService);
  private readonly _router = inject(Router);
  private readonly _dialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  protected createSection() {
    this._dialog
      .open(SectionUpsertModal, { width: '400px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((created: Section | boolean) => {
        if (typeof created === 'boolean') return;
        if (!created?.id) return;
        this._router.navigate(['/list', created.name]);
        this._sectionsService.currentSectionSelected.set(created);
      });
  }

  protected async createNote() {
    const defaultName = this._translateService.instant('home.defaultSectionName');
    const section = await this._sectionsService.createSection(defaultName, true);
    const createdNoteId = await firstValueFrom<number | null>(
      this._dialog
        .open(NoteUpsertModal, {
          data: { sectionId: section.id },
          width: '600px',
          maxWidth: '95vw',
          maxHeight: '90dvh',
        })
        .afterClosed(),
    );
    if (createdNoteId) {
      this._router.navigate(['/list', section.name]);
      this._sectionsService.currentSectionSelected.set(section);
    } else {
      await this._sectionsService.deleteSection(section.id!);
    }
  }
}
