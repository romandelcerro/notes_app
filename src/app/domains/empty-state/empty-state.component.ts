import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { NotesService } from '../../core/services/notes.service';
import { SectionsService } from '../../core/services/sections.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/translate.pipe';
import { NoteEditorComponent } from '../notes/note-editor/note-editor.component';
import { SectionDialogComponent } from '../notes/section-dialog/section-dialog.component';

@Component({
  selector: 'app-empty-state',
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state-container">
      <mat-icon class="empty-state-icon">note_stack</mat-icon>
      <h1 class="empty-state-title">{{ 'home.welcomeTitle' | translate }}</h1>
      <p class="empty-state-subtitle">{{ 'home.welcomeSubtitle' | translate }}</p>
      <div class="empty-state-actions">
        <button mat-flat-button (click)="createSection()">
          <mat-icon>create_new_folder</mat-icon>
          {{ 'home.createSection' | translate }}
        </button>
        <button mat-stroked-button (click)="createNote()">
          <mat-icon>add</mat-icon>
          {{ 'home.createNote' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .empty-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 64px);
      padding: 24px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-state-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      opacity: 0.35;
      margin-bottom: 24px;
    }

    .empty-state-title {
      font-size: 1.5rem;
      font-weight: 500;
      margin: 0 0 8px;
      color: var(--mat-sys-on-surface);
    }

    .empty-state-subtitle {
      margin: 0 0 32px;
      font-size: 0.9375rem;
    }

    .empty-state-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }
  `,
})
export class EmptyStateComponent {
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _translateService = inject(TranslationService);
  private readonly _router = inject(Router);
  private readonly _dialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  protected createSection() {
    this._dialog
      .open(SectionDialogComponent, { width: '400px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((created) => {
        if (!created) return;
        const sections = this._sectionsService.sections();
        const newSection = sections[sections.length - 1];
        if (newSection?.id != null) {
          this._router.navigate(['/list', newSection.name]);
        }
      });
  }

  protected async createNote() {
    const defaultName = this._translateService.t('home.defaultSectionName');
    const section = await this._sectionsService.createSection(defaultName);
    this._dialog
      .open(NoteEditorComponent, {
        data: { sectionId: section.id },
        width: '600px',
        maxWidth: '95vw',
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
