import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import type { Attachment } from '../../../core/models/attachment.model';
import type { Note } from '../../../core/models/note.model';
import type { Section } from '../../../core/models/section.model';
import { AttachmentService } from '../../../core/services/attachment.service';
import { NotesService } from '../../../core/services/notes.service';
import { SectionsService } from '../../../core/services/sections.service';
import { NoteCard } from '../note-card/note-card';
import {
  NoteCreateEditModal,
  type NoteCreateEditResult,
} from '../note-create-edit-modal/note-create-edit-modal';
import { NotePreviewModal } from '../note-preview/note-preview-modal';

@Component({
  selector: 'app-note-list',
  imports: [NoteCard, MatButtonModule, MatIconModule, TranslatePipe, CdkDropList, CdkDrag],
  templateUrl: './note-list.html',
  styleUrl: './note-list.scss',
})
export class NoteListComponent {
  private readonly _route = inject(ActivatedRoute);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _attachmentService = inject(AttachmentService);

  private readonly _dialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly sections = this._sectionsService.sections;

  protected getDisplayName(section: { name: string; isDefault: boolean }): string {
    return this._sectionsService.getDisplayName(section);
  }

  private readonly _sectionName = toSignal(
    this._route.paramMap.pipe(map((p) => p.get('section'))),
    { initialValue: null },
  );

  private readonly _attachmentsByNoteId = signal<Map<number, Attachment[]>>(new Map());
  private _currentFetchId = 0;
  private readonly _refreshTrigger = signal(0);
  private _initialFetchDone = false;

  private async _fetchAndUpdateNoteAttachments(noteId: number): Promise<void> {
    const atts = await this._attachmentService.getAttachments(noteId);
    this._attachmentsByNoteId.update((map) => {
      const next = new Map(map);
      next.set(noteId, atts);
      return next;
    });
  }

  private readonly _fetchAttachments = effect(() => {
    this._refreshTrigger();
    this.selectedSection();
    const ids = untracked(() => {
      const section = this.selectedSection();
      const notes = section ? this.selectedSectionNotes() : this._notesService.notes();
      return notes
        .filter((n) => n.hasAttachments)
        .map((n) => n.id)
        .filter((id): id is number => !!id);
    });
    if (ids.length === 0) return;
    const fetchId = ++this._currentFetchId;
    void this._attachmentService.getAttachmentsByNoteIds(ids).then((map) => {
      if (fetchId !== this._currentFetchId) return;
      this._attachmentsByNoteId.set(map);
    });
  });

  private readonly _initialLoad = effect(() => {
    const notesLen = this._notesService.notes().length;
    if (notesLen > 0 && !this._initialFetchDone) {
      this._initialFetchDone = true;
      this._refreshTrigger.update((v) => v + 1);
    }
  });

  protected attachmentsForNote(noteId: number | undefined): Attachment[] {
    if (!noteId) return [];
    return this._attachmentsByNoteId().get(noteId) ?? [];
  }

  protected readonly selectedSection = computed(() => {
    const name = this._sectionName();
    if (!name) return null;
    return this._sectionsService.sections().find((s) => s.name === name) ?? null;
  });

  private readonly _filtered = computed(() => {
    const { query } = this._notesService.filter();
    return this._notesService.notes().filter((n) => {
      const matchesQuery =
        !query ||
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.content.toLowerCase().includes(query.toLowerCase());

      return matchesQuery;
    });
  });

  protected readonly unsectionedNotes = computed(() =>
    this.selectedSection() ? [] : this._filtered().filter((n) => !n.pinned && !n.sectionId),
  );

  protected readonly selectedSectionNotes = computed(() => {
    const section = this.selectedSection();
    if (!section) return [];
    return this._filtered().filter((n) => n.sectionId === section.id);
  });

  private readonly _notesBySectionId = computed(() => {
    const filtered = this._filtered();
    const map = new Map<number, Note[]>();
    for (const note of filtered) {
      if (!note.sectionId) continue;
      const group = map.get(note.sectionId);
      if (group) {
        group.push(note);
      } else {
        map.set(note.sectionId, [note]);
      }
    }
    return map;
  });

  protected notesForSection(section: Section): Note[] {
    return section.id ? (this._notesBySectionId().get(section.id) ?? []) : [];
  }

  protected ordered(notes: Note[], key: string): Note[] {
    return this._notesService.ordered(notes, key);
  }

  protected onNoteDrop(event: CdkDragDrop<Note[]>, key: string) {
    const ids = event.container.data.map((n) => n.id!);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    this._notesService.saveOrder(key, ids);
  }

  protected openNewNoteModal(sectionId?: number) {
    const targetSectionId = sectionId ?? this.selectedSection()?.id;
    this._dialog
      .open(NoteCreateEditModal, {
        data: { sectionId: targetSectionId },
        width: '600px',
        maxWidth: '95vw',
        maxHeight: '90dvh',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result: NoteCreateEditResult | undefined) => {
        if (result?.noteId) void this._fetchAndUpdateNoteAttachments(result.noteId);
      });
  }

  protected openPreviewNote(note: Note) {
    this._dialog
      .open(NotePreviewModal, { data: note, width: '600px', maxWidth: '95vw', maxHeight: '90dvh' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result === 'edit') this.openEditNoteModal(note);
      });
  }

  protected openEditNoteModal(note: Note) {
    this._dialog
      .open(NoteCreateEditModal, {
        data: { note },
        width: '600px',
        maxWidth: '95vw',
        maxHeight: '90dvh',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result: NoteCreateEditResult | undefined) => {
        if (result?.noteId) void this._fetchAndUpdateNoteAttachments(result.noteId);
      });
  }

  private _endOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
