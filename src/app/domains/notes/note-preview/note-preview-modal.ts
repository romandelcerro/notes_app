import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { Attachment } from '../../../core/models/attachment.model';
import type { Note } from '../../../core/models/note.model';
import { AttachmentService } from '../../../core/services/attachment.service';
import { FilesService } from '../../../core/services/files.service';

@Component({
  selector: 'app-note-preview-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './note-preview-modal.html',
  styleUrl: './note-preview-modal.scss'
})
export class NotePreviewModal {
  private readonly _attachmentService = inject(AttachmentService);
  private readonly _filesService = inject(FilesService);

  private readonly _dialogRef = inject(MatDialogRef<NotePreviewModal>);
  private readonly _destroyRef = inject(DestroyRef);

  readonly note: Note = inject(MAT_DIALOG_DATA);

  protected readonly imageUrls = signal<{ url: string; attachment: Attachment }[]>([]);
  protected readonly attachments = signal<Attachment[]>([]);

  constructor() {
    this._destroyRef.onDestroy(() => {
      this.imageUrls().forEach(img => this._filesService.revokeObjectURL(img.url));
    });
    this._loadImages();
  }

  protected edit() {
    this._dialogRef.close('edit');
  }

  protected formatSize(bytes: number) {
    return this._filesService.formatBytes(bytes);
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

  protected readonly contentHtml = computed(() => {
    const escaped = this.note.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return escaped.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  });

  private async _loadImages() {
    if (!this.note.id) return;
    const attachments: Attachment[] = await this._attachmentService.getAttachments(this.note.id);
    const images = attachments.filter(a => a.mimeType.startsWith('image/'));
    const files = attachments.filter(a => !a.mimeType.startsWith('image/'));
    const loaded = await Promise.all(
      images.map(async a => {
        const buffer = await this._attachmentService.decryptAttachment(a);
        return { url: this._filesService.bufferToObjectURL(buffer, a.mimeType), attachment: a };
      })
    );
    this.imageUrls.set(loaded);
    this.attachments.set(files);
  }
}
