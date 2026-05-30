import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { buildNewNote, buildUpdatedNote } from '../../../core/mappers/note.mapper';
import type { Note, NoteType } from '../../../core/models/note.model';
import { FilesService } from '../../../core/services/files.service';
import { NotesService } from '../../../core/services/notes.service';
import { UserService } from '../../../core/services/user.service';
import { AttachmentSection } from '../../../shared/attachment-section/attachment-section';

export interface NoteEditModalData {
  note?: Note;
  sectionId?: number;
}

const NOTE_COLORS = ['', '#F28B82', '#FBBC04', '#FFF475', '#CCFF90', '#A8D5F7', '#D7AEFB'];

@Component({
  selector: 'app-note-create-edit-modal',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, TranslatePipe, AttachmentSection],
  templateUrl: './note-create-edit-modal.html',
  styleUrl: './note-create-edit-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteCreateEditModal {
  private readonly _notesService = inject(NotesService);
  private readonly _userService = inject(UserService);
  private readonly _filesService = inject(FilesService);
  private readonly _dialogRef = inject(MatDialogRef<NoteCreateEditModal>);
  private readonly _attachmentSection = viewChild.required(AttachmentSection);

  protected readonly _data: NoteEditModalData = inject(MAT_DIALOG_DATA);

  protected readonly title = signal(this._data.note?.title ?? '');
  protected readonly content = signal(this._data.note?.content ?? '');
  protected readonly noteType = signal<NoteType>(this._data.note?.type ?? 'text');
  protected readonly selectedColor = signal(this._data.note?.color ?? '');
  protected readonly saving = signal(false);

  protected readonly colors = NOTE_COLORS;
  protected readonly isEditing = !!this._data.note;

  protected async save(): Promise<void> {
    const title = this.title().trim();
    const content = this.content().trim();
    if (!content && !title) return;

    this.saving.set(true);
    try {
      if (this.isEditing && this._data.note?.id) {
        const updatedNote = buildUpdatedNote(this._data.note, { ...this._data.note, title, content, color: this.selectedColor() });
        await this._notesService.updateNote(this._data.note.id, updatedNote);
      } else {
        const userId = this._userService.user()?.uid ?? '';
        const noteTmp: Note = { title, content, type: this.noteType(), color: this.selectedColor(), pinned: false, userId, sectionId: this._data.sectionId };
        const newNote = await this._notesService.createNote(buildNewNote(noteTmp, userId));
        await this._attachmentSection().uploadPendingTo(newNote.id!);
      }
      this._dialogRef.close(true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async onFileDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) await this._attachmentSection().addFiles(files);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected async onPaste(event: ClipboardEvent): Promise<void> {
    const items = event.clipboardData?.items;
    if (!items) return;
    const imageFile = await this._filesService.resolveImageFromClipboard(items);
    if (imageFile) await this._attachmentSection().addImageFile(imageFile);
  }
}
