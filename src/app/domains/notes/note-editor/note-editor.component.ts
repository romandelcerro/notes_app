import { DatePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { Attachment, Note, NoteType } from '../../../core/models/note.model';
import { FilesService } from '../../../core/services/files.service';
import { NotesService } from '../../../core/services/notes.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/translate.pipe';

export interface NoteEditorData {
  note?: Note;
  sectionId?: number;
}

const NOTE_COLORS = ['', '#F28B82', '#FBBC04', '#FFF475', '#CCFF90', '#A8D5F7', '#D7AEFB'];

@Component({
  selector: 'app-note-editor',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    FormsModule,
    DatePipe,
    TranslatePipe,
  ],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.scss',
})
export class NoteEditorComponent {
  private readonly _notesService = inject(NotesService);
  private readonly _filesService = inject(FilesService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _translateService = inject(TranslationService);
  private readonly _dialogRef = inject(MatDialogRef<NoteEditorComponent>);
  private readonly _data: NoteEditorData = inject(MAT_DIALOG_DATA);
  private readonly _destroyRef = inject(DestroyRef);

  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

  protected readonly title = signal(this._data.note?.title ?? '');
  protected readonly content = signal(this._data.note?.content ?? '');
  protected readonly noteType = signal<NoteType>(this._data.note?.type ?? 'text');
  protected readonly selectedColor = signal(this._data.note?.color ?? '');
  protected readonly saving = signal(false);
  protected readonly attachments = signal<Attachment[]>([]);
  protected readonly objectURLs = signal<string[]>([]);

  protected readonly colors = NOTE_COLORS;
  protected readonly isEditing = !!this._data.note;

  private readonly _loadAttachments = effect(async () => {
    const noteId = this._data.note?.id;
    if (noteId) {
      const loaded = await this._notesService.getAttachments(noteId);
      this.attachments.set(loaded);
    }
  });

  constructor() {
    this._destroyRef.onDestroy(() => {
      this.objectURLs().forEach((url) => this._filesService.revokeObjectURL(url));
    });
  }

  protected async save() {
    const title = this.title().trim();
    const content = this.content().trim();
    if (!content && !title) return;

    this.saving.set(true);
    try {
      if (this.isEditing && this._data.note?.id) {
        await this._notesService.updateNote(this._data.note.id, {
          title,
          content,
          color: this.selectedColor(),
        });
      } else {
        await this._notesService.createNote({
          title,
          content,
          type: this.noteType(),
          color: this.selectedColor(),
          pinned: false,
          sectionId: this._data.sectionId,
        });
      }
      this._dialogRef.close(true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async onFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) await this._uploadFiles(files);
  }

  protected onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  protected async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) await this._uploadFiles(input.files);
  }

  protected async onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFile = await this._filesService.resolveImageFromClipboard(items);
    if (imageFile && this._data.note?.id) {
      await this._notesService.addAttachment(this._data.note.id, imageFile);
      const refreshed = await this._notesService.getAttachments(this._data.note.id);
      this.attachments.set(refreshed);
    }
  }

  protected async viewAttachment(attachment: Attachment) {
    const buffer = await this._notesService.decryptAttachment(attachment);
    const url = this._filesService.bufferToObjectURL(buffer, attachment.mimeType);
    this.objectURLs.update((urls) => [...urls, url]);
    window.open(url, '_blank');
  }

  protected async downloadAttachment(attachment: Attachment) {
    const buffer = await this._notesService.decryptAttachment(attachment);
    const url = this._filesService.bufferToObjectURL(buffer, attachment.mimeType);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    a.click();
    this._filesService.revokeObjectURL(url);
  }

  protected async deleteAttachment(attachment: Attachment) {
    if (!attachment.id) return;
    await this._notesService.deleteAttachment(attachment.id);
    this.attachments.update((list) => list.filter((a) => a.id !== attachment.id));
  }

  protected formatSize(bytes: number) {
    return this._filesService.formatBytes(bytes);
  }

  private async _uploadFiles(files: FileList) {
    if (!this._data.note?.id) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > NoteEditorComponent.MAX_FILE_SIZE) {
        this._snackBar.open(
          this._translateService.t('note.fileTooLarge', { name: file.name, max: '100 MB' }),
          this._translateService.t('note.cancel'),
          { duration: 4000 },
        );
        continue;
      }
      await this._notesService.addAttachment(this._data.note.id, file);
    }
    const refreshed = await this._notesService.getAttachments(this._data.note.id);
    this.attachments.set(refreshed);
  }
}
