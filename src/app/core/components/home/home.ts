import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NoteCreateEditModal } from '../../../domains/notes/note-create-edit-modal/note-create-edit-modal';
import { SectionCreateEditModal } from '../../../domains/sections/section-create-edit-modal/section-create-edit-modal';
import { NotesService } from '../../services/notes.service';
import { SectionsService } from '../../services/sections.service';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss'
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
      .open(SectionCreateEditModal, { width: '400px', maxWidth: '95vw' })
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

  protected async createNote() {
    const defaultName = this._translateService.instant('home.defaultSectionName');
    const section = await this._sectionsService.createSection(defaultName);
    this._dialog
      .open(NoteCreateEditModal, {
        data: { sectionId: section.id },
        width: '600px',
        maxWidth: '95vw',
        maxHeight: '90dvh'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(async () => {
        if (this._notesService.notes().length > 0) {
          this._router.navigate(['/list', section.name]);
        } else {
          await this._sectionsService.deleteSection(section.id!);
        }
      });
  }
}
