import { DatePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Attachment } from '../../core/models/attachment.model';
import { AttachmentService } from '../../core/services/attachment.service';
import { FilesService } from '../../core/services/files.service';

@Component({
  selector: 'app-attachment-section',
  imports: [DatePipe, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './attachment-section.html',
  styleUrl: './attachment-section.scss',
})
export class AttachmentSection {
  private readonly _attachmentService = inject(AttachmentService);
  protected readonly filesService = inject(FilesService);
  private readonly _translateService = inject(TranslateService);

  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  public readonly noteId = input<number | undefined>(undefined);
  public readonly maxFileSizeBytes = input(5 * 1024 * 1024);

  protected readonly attachments = signal<Attachment[]>([]);
  public readonly pendingFiles = signal<File[]>([]);
  private readonly _objectURLs = signal<string[]>([]);

  private _loadAttachmentsVersion = 0;

  private readonly _loadAttachments = effect(() => {
    const noteId = this.noteId();

    if (!noteId) return;

    const version = ++this._loadAttachmentsVersion;
    this._attachmentService.getAttachments(noteId).then((loaded) => {
      if (version === this._loadAttachmentsVersion) {
        this.attachments.set(loaded);
      }
    });
  });

  constructor() {
    this._destroyRef.onDestroy(() => {
      this._objectURLs().forEach((url) => this.filesService.revokeObjectURL(url));
    });
  }

  public async addFiles(files: FileList) {
    const noteId = this.noteId();
    for (const file of Array.from(files)) {
      if (file.size > this.maxFileSizeBytes()) {
        this._snackBar.open(
          this._translateService.instant('note.fileTooLarge', { name: file.name, max: '5 MB' }),
          this._translateService.instant('note.cancel'),
          { duration: 4000 },
        );
        continue;
      }
      if (noteId) {
        const created = await this._attachmentService.addAttachment(noteId, file);
        this.attachments.update((list) => [...list, created]);
      } else {
        this.pendingFiles.update((pending) => [...pending, file]);
      }
    }
  }

  public async addImageFile(file: File) {
    const noteId = this.noteId();
    if (noteId) {
      const created = await this._attachmentService.addAttachment(noteId, file);
      this.attachments.update((list) => [...list, created]);
    } else {
      this.pendingFiles.update((files) => [...files, file]);
    }
  }

  public async uploadPendingTo(noteId: number) {
    await Promise.all(
      this.pendingFiles().map((file) => this._attachmentService.addAttachment(noteId, file)),
    );
  }

  protected async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) await this.addFiles(input.files);
  }

  protected async deleteAttachment(attachment: Attachment) {
    if (!attachment.id) return;
    await this._attachmentService.deleteAttachment(attachment.id);
    this.attachments.update((list) => list.filter((a) => a.id !== attachment.id));
  }

  protected async downloadAttachment(attachment: Attachment) {
    const buffer = await this._attachmentService.decryptAttachment(attachment);
    const url = this.filesService.bufferToObjectURL(buffer, attachment.mimeType);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    a.click();
    this.filesService.revokeObjectURL(url);
  }
}
