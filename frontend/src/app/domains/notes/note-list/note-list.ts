import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Attachment } from '../../../core/models/attachment.model';
import type { Note } from '../../../core/models/note.model';
import { AttachmentService } from '../../../core/services/attachment.service';
import { NotesService } from '../../../core/services/notes.service';
import { SectionsService } from '../../../core/services/sections.service';
import { NoteCard } from '../note-card/note-card';
import { NotePreviewModal } from '../note-preview/note-preview-modal';
import {
  NoteEditModalData,
  NoteUpsertModal,
  type NoteCreateEditResult,
} from '../note-upsert-modal/note-upsert-modal';

@Component({
  selector: 'app-note-list',
  imports: [NoteCard, MatButtonModule, MatIconModule, TranslatePipe, CdkDropList, CdkDrag],
  templateUrl: './note-list.html',
  styleUrl: './note-list.scss',
})
export class NoteListComponent {
  public readonly section = input<string>();
  protected readonly notesService = inject(NotesService);
  protected readonly sectionsService = inject(SectionsService);
  private readonly _attachmentService = inject(AttachmentService);
  private readonly _translateService = inject(TranslateService);
  private readonly _snackBar = inject(MatSnackBar);

  private readonly _dialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _attachmentsByNoteId = signal<Map<number, Attachment[]>>(new Map());

  private _fetchAttachmentsVersion = 0;

  private readonly _fetchAttachments = effect(() => {
    const section = this.selectedSection();
    const notes = section ? this.selectedSectionNotes() : this.notesService.notes();
    const notesIds = notes
      .filter((n) => n.hasAttachments)
      .map((n) => n.id)
      .filter((id): id is number => !!id);

    if (!notesIds.length) {
      this._attachmentsByNoteId.set(new Map());
      return;
    }

    const version = ++this._fetchAttachmentsVersion;
    this._attachmentService.getAttachmentsByNoteIds(notesIds).then((map) => {
      if (version === this._fetchAttachmentsVersion) {
        this._attachmentsByNoteId.set(map);
      }
    });
  });

  private async _fetchAndUpdateNoteAttachments(noteId: number) {
    const atts = await this._attachmentService.getAttachments(noteId);
    this._attachmentsByNoteId.update((map) => {
      const next = new Map(map);
      next.set(noteId, atts);
      return next;
    });
  }

  protected attachmentsForNote(noteId: number | undefined): Attachment[] {
    if (!noteId) return [];
    return this._attachmentsByNoteId().get(noteId) ?? [];
  }

  protected readonly selectedSection = computed(() => {
    const name = this.section();
    if (!name) return null;
    return this.sectionsService.sections().find((s) => s.name === name) ?? null;
  });

  protected readonly selectedSectionNotes = computed(() => {
    const section = this.selectedSection();
    if (!section?.id) return [];
    return this.notesService.notesForSection(section.id);
  });

  protected async onNoteDrop(event: CdkDragDrop<Note[]>, key: string) {
    const ids = event.container.data.map((n) => n.id!);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    try {
      await this.notesService.saveOrder(key, ids);
    } catch {
      this._snackBar.open(
        this._translateService.instant('note.reorderError'),
        this._translateService.instant('common.close'),
        { duration: 5000 },
      );
    }
  }

  protected openUpsertNoteModal(data?: NoteEditModalData) {
    this._dialog
      .open(NoteUpsertModal, {
        data: data ?? {},
        width: '600px',
        maxWidth: '95vw',
        maxHeight: '90dvh',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result: NoteCreateEditResult | undefined) => {
        if (result?.noteId) this._fetchAndUpdateNoteAttachments(result.noteId);
      });
  }

  protected openPreviewNoteModal(note: Note) {
    this._dialog
      .open(NotePreviewModal, { data: note, width: '600px', maxWidth: '95vw', maxHeight: '90dvh' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result === 'edit') this.openUpsertNoteModal({ note });
      });
  }
}
