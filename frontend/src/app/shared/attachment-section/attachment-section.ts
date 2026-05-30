import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachmentSection {
  private readonly _attachmentService = inject(AttachmentService);
  private readonly _filesService = inject(FilesService);
  private readonly _translateService = inject(TranslateService);

  private readonly _snackBar = inject(MatSnackBar);
  private readonly _destroyRef = inject(DestroyRef);

  readonly noteId = input<number | undefined>(undefined);
  readonly maxFileSizeBytes = input(100 * 1024 * 1024);

  readonly attachments = signal<Attachment[]>([]);
  readonly pendingFiles = signal<File[]>([]);
  private readonly _objectURLs = signal<string[]>([]);

  private readonly _loadAttachments = effect(async () => {
    const noteId = this.noteId();
    if (noteId) {
      const loaded = await this._attachmentService.getAttachments(noteId);
      this.attachments.set(loaded);
    }
  });

  constructor() {
    this._destroyRef.onDestroy(() => {
      this._objectURLs().forEach(url => this._filesService.revokeObjectURL(url));
    });
  }

  async addFiles(files: FileList) {
    const noteId = this.noteId();
    for (const file of Array.from(files)) {
      if (file.size > this.maxFileSizeBytes()) {
        this._snackBar.open(this._translateService.instant('note.fileTooLarge', { name: file.name, max: '100 MB' }), this._translateService.instant('note.cancel'), { duration: 4000 });
        continue;
      }
      if (noteId) {
        await this._attachmentService.addAttachment(noteId, file);
      } else {
        this.pendingFiles.update(pending => [...pending, file]);
      }
    }
    if (noteId) {
      this.attachments.set(await this._attachmentService.getAttachments(noteId));
    }
  }

  async addImageFile(file: File) {
    const noteId = this.noteId();
    if (noteId) {
      await this._attachmentService.addAttachment(noteId, file);
      this.attachments.set(await this._attachmentService.getAttachments(noteId));
    } else {
      this.pendingFiles.update(files => [...files, file]);
    }
  }

  async uploadPendingTo(noteId: number) {
    await Promise.all(this.pendingFiles().map(file => this._attachmentService.addAttachment(noteId, file)));
  }

  protected async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) await this.addFiles(input.files);
  }

  protected removePendingFile(file: File): void {
    this.pendingFiles.update(files => files.filter(f => f !== file));
  }

  protected async deleteAttachment(attachment: Attachment) {
    if (!attachment.id) return;
    await this._attachmentService.deleteAttachment(attachment.id);
    this.attachments.update(list => list.filter(a => a.id !== attachment.id));
  }

  protected async downloadAttachment(attachment: Attachment) {
    const buffer = await this._attachmentService.decryptAttachment(attachment);
    const url = this._filesService.bufferToObjectURL(buffer, attachment.mimeType);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    a.click();
    this._filesService.revokeObjectURL(url);
  }

  protected formatSize(bytes: number): string {
    return this._filesService.formatBytes(bytes);
  }
}
