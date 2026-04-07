import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import type { Note } from '../../../core/models/note.model';
import type { Section } from '../../../core/models/section.model';
import { NotesService } from '../../../core/services/notes.service';
import { SectionsService } from '../../../core/services/sections.service';
import { UserService } from '../../../core/services/user.service';
import { NoteCard } from '../note-card/note-card';
import { NoteCreateEditModal } from '../note-create-edit-modal/note-create-edit-modal';
import { NotePreviewModal } from '../note-preview/note-preview-modal';

@Component({
  selector: 'app-note-list',
  imports: [NoteCard, MatButtonModule, MatIconModule, TranslatePipe, CdkDropList, CdkDrag],
  templateUrl: './note-list.html',
  styleUrl: './note-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteListComponent {
  private readonly _route = inject(ActivatedRoute);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _userService = inject(UserService);

  private readonly _dialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _sectionName = toSignal(this._route.paramMap.pipe(map(p => p.get('section'))), { initialValue: null });

  protected readonly selectedSection = computed(() => {
    const name = this._sectionName();
    if (!name) return null;
    return this._sectionsService.sections().find(s => s.name === name) ?? null;
  });

  private readonly _orderKey = computed(() => `notes_order_${this._userService.user()?.uid ?? 'anon'}`);

  private readonly _orderMap = signal<Record<string, number[]>>(JSON.parse(localStorage.getItem(`notes_order_${this._userService.user()?.uid ?? 'anon'}`) ?? '{}') as Record<string, number[]>);

  private readonly _filtered = computed(() => {
    const { query, dateFrom, dateTo } = this._notesService.filter();
    return this._notesService.notes().filter(n => {
      const matchesQuery = !query || n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase());
      const noteDate = n.updatedAt ? new Date(n.updatedAt) : null;
      const matchesFrom = !dateFrom || (!!noteDate && noteDate >= dateFrom);
      const matchesTo = !dateTo || (!!noteDate && noteDate <= this._endOfDay(dateTo));
      return matchesQuery && matchesFrom && matchesTo;
    });
  });

  protected readonly sections = this._sectionsService.sections;

  protected readonly unsectionedNotes = computed(() => (this.selectedSection() ? [] : this._filtered().filter(n => !n.pinned && !n.sectionId)));

  protected readonly selectedSectionNotes = computed(() => {
    const section = this.selectedSection();
    if (!section) return [];
    return this._filtered().filter(n => n.sectionId === section.id);
  });

  protected notesForSection(section: Section): Note[] {
    return this._filtered().filter(n => n.sectionId === section.id);
  }

  protected ordered(notes: Note[], key: string): Note[] {
    const order = this._orderMap()[key];
    if (!order) return notes;
    const byId = new Map(notes.map(n => [n.id!, n]));
    return [...order.filter(id => byId.has(id)).map(id => byId.get(id)!), ...notes.filter(n => !order.includes(n.id!))];
  }

  protected onNoteDrop(event: CdkDragDrop<Note[]>, key: string) {
    const ids = event.container.data.map(n => n.id!);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    this._orderMap.update(m => {
      const updated = { ...m, [key]: ids };
      localStorage.setItem(this._orderKey(), JSON.stringify(updated));
      return updated;
    });
  }

  protected openNewNoteModal(sectionId?: number) {
    const targetSectionId = sectionId ?? this.selectedSection()?.id;
    this._dialog.open(NoteCreateEditModal, {
      data: { sectionId: targetSectionId },
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90dvh'
    });
  }

  protected openPreviewNote(note: Note) {
    this._dialog
      .open(NotePreviewModal, { data: note, width: '600px', maxWidth: '95vw', maxHeight: '90dvh' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(result => {
        if (result === 'edit') this.openEditNoteModal(note);
      });
  }

  protected openEditNoteModal(note: Note) {
    this._dialog.open(NoteCreateEditModal, {
      data: { note },
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90dvh'
    });
  }

  private _endOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
