import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { firstValueFrom } from 'rxjs';
import type { NoteFilter } from '../../core/models/note-filter.model';
import type { Note } from '../../core/models/note.model';
import type { Section } from '../../core/models/section.model';
import { AuthService } from '../../core/services/auth.service';
import { NotesService } from '../../core/services/notes.service';
import { SectionsService } from '../../core/services/sections.service';
import { TranslationService } from '../../core/services/translation.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { SidenavComponent } from '../../shared/sidenav/sidenav.component';
import { ToolbarComponent } from '../../shared/toolbar/toolbar.component';
import { TranslatePipe } from '../../shared/translate.pipe';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';
import { NoteCardComponent } from '../notes/note-card/note-card.component';
import { NoteEditorComponent } from '../notes/note-editor/note-editor.component';
import { NotePreviewComponent } from '../notes/note-preview/note-preview.component';
import { SectionDialogComponent } from '../notes/section-dialog/section-dialog.component';

@Component({
  selector: 'app-home',
  imports: [
    SidenavComponent,
    ToolbarComponent,
    NoteCardComponent,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    TranslatePipe,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly _authService = inject(AuthService);
  private readonly _notesService = inject(NotesService);
  private readonly _sectionsService = inject(SectionsService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _dialog = inject(MatDialog);
  private readonly _translateService = inject(TranslationService);

  private readonly _filter = signal<NoteFilter>({ query: '', dateFrom: null, dateTo: null });

  protected readonly speedDialOpen = signal(false);
  protected readonly sidenavOpen = signal(false);
  protected readonly selectedSectionId = signal<number | null>(null);
  private readonly _orderKey = computed(() => `notes_order_${this._authService.user()?.uid ?? 'anon'}`);

  private readonly _orderMap = signal<Record<string, number[]>>(
    JSON.parse(localStorage.getItem(`notes_order_${this._authService.user()?.uid ?? 'anon'}`) ?? '{}') as Record<string, number[]>,
  );

  private readonly _filtered = computed(() => {
    const { query, dateFrom, dateTo } = this._filter();
    return this._notesService.notes().filter((n) => {
      const matchesQuery =
        !query ||
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.content.toLowerCase().includes(query.toLowerCase());
      const noteDate = new Date(n.updatedAt);
      const matchesFrom = !dateFrom || noteDate >= dateFrom;
      const matchesTo = !dateTo || noteDate <= this._endOfDay(dateTo);
      return matchesQuery && matchesFrom && matchesTo;
    });
  });

  protected readonly sections = this._sectionsService.sections;
  protected readonly pinnedNotes = computed(() => this._filtered().filter((n) => n.pinned));
  protected readonly unsectionedNotes = computed(() =>
    this._filtered().filter((n) => !n.pinned && !n.sectionId),
  );
  protected readonly hasNotes = computed(() => this._notesService.notes().length > 0);

  protected readonly selectedSection = computed(() => {
    const id = this.selectedSectionId();
    if (id === null) return null;
    return this.sections().find((s) => s.id === id) ?? null;
  });

  protected readonly selectedSectionNotes = computed(() => {
    const id = this.selectedSectionId();
    if (id === null) return [];
    return this._filtered().filter((n) => n.sectionId === id);
  });

  protected notesForSection(section: Section): Note[] {
    return this._filtered().filter((n) => n.sectionId === section.id);
  }

  protected ordered(notes: Note[], key: string): Note[] {
    const order = this._orderMap()[key];
    if (!order) return notes;
    const byId = new Map(notes.map((n) => [n.id!, n]));
    return [
      ...order.filter((id) => byId.has(id)).map((id) => byId.get(id)!),
      ...notes.filter((n) => !order.includes(n.id!)),
    ];
  }

  protected onNoteDrop(event: CdkDragDrop<Note[]>, key: string) {
    const ids = event.container.data.map((n) => n.id!);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    this._orderMap.update((m) => {
      const updated = { ...m, [key]: ids };
      localStorage.setItem(this._orderKey(), JSON.stringify(updated));
      return updated;
    });
  }

  protected onFilterChange(filter: NoteFilter) {
    this._filter.set(filter);
  }

  protected toggleSidenav() {
    this.sidenavOpen.update((open) => !open);
  }

  protected selectSection(id: number | null) {
    this.selectedSectionId.set(id);
  }

  protected toggleSpeedDial() {
    this.speedDialOpen.update((open) => !open);
  }

  protected openNewNote(sectionId?: number) {
    this.speedDialOpen.set(false);
    const targetSectionId = sectionId ?? this.selectedSectionId() ?? undefined;
    this._dialog.open(NoteEditorComponent, {
      data: { sectionId: targetSectionId },
      width: '600px',
      maxWidth: '95vw',
    });
  }

  protected async deleteSection(section: Section) {
    const confirmed = await firstValueFrom(
      this._dialog
        .open(ConfirmDialogComponent, {
          data: { message: this._translateService.t('confirm.deleteSection', { name: section.name }) },
          width: '360px',
          maxWidth: '95vw',
        })
        .afterClosed()
        .pipe(takeUntilDestroyed(this._destroyRef)),
    );
    if (!confirmed) return;
    if (this.selectedSectionId() === section.id) this.selectedSectionId.set(null);
    await this._sectionsService.deleteSection(section.id!);
  }

  protected editSection(section: Section) {
    this._dialog.open(SectionDialogComponent, {
      data: { section },
      width: '400px',
      maxWidth: '95vw',
    });
  }

  protected openNewSection() {
    this.speedDialOpen.set(false);
    this._dialog
      .open(SectionDialogComponent, { width: '400px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((created) => {
        if (!created) return;
        const sections = this._sectionsService.sections();
        const newSection = sections[sections.length - 1];
        if (newSection?.id != null) this.selectedSectionId.set(newSection.id);
      });
  }

  protected openPreviewNote(note: Note) {
    this._dialog
      .open(NotePreviewComponent, { data: note, width: '600px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result === 'edit') this.openEditNote(note);
      });
  }

  protected openEditNote(note: Note) {
    this._dialog.open(NoteEditorComponent, {
      data: { note },
      width: '600px',
      maxWidth: '95vw',
    });
  }

  protected openProfile() {
    this._dialog.open(UserMenuComponent, { width: '420px', maxWidth: '95vw' });
  }

  protected async signOut() {
    await this._authService.signOut();
  }

  private _endOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
