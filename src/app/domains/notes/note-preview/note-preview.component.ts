import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import type { Attachment, Note } from '../../../core/models/note.model';
import { FilesService } from '../../../core/services/files.service';
import { NotesService } from '../../../core/services/notes.service';
import { TranslatePipe } from '../../../shared/translate.pipe';

@Component({
  selector: 'app-note-preview',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (note.title) {
      <h2 mat-dialog-title>{{ note.title }}</h2>
    }
    <mat-dialog-content>
      @if (note.type === 'link') {
        <a [href]="note.content" target="_blank" rel="noopener noreferrer" class="preview-link">
          {{ note.content }}
        </a>
      } @else {
        <p class="preview-content" [innerHTML]="contentHtml()"></p>
      }
      @if (imageUrls().length > 0) {
        <div class="preview-images">
          @for (img of imageUrls(); track img.url) {
            <div class="preview-img-wrap">
              <img [src]="img.url" [alt]="img.attachment.name" class="preview-img" />
              <button mat-icon-button class="img-download-btn" (click)="downloadAttachment(img.attachment)" aria-label="Descargar">
                <mat-icon>download</mat-icon>
              </button>
            </div>
          }
        </div>
      }
      @if (fileAttachments().length > 0) {
        <ul class="preview-files">
          @for (file of fileAttachments(); track file.name) {
            <li>
              <mat-icon class="file-icon">insert_drive_file</mat-icon>
              <span>{{ file.name }}</span>
              <span class="file-size">{{ formatSize(file.size) }}</span>
              <button mat-icon-button (click)="downloadAttachment(file)" aria-label="Descargar">
                <mat-icon>download</mat-icon>
              </button>
            </li>
          }
        </ul>
      }
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>{{ 'note.cancel' | translate }}</button>
      <button mat-flat-button (click)="edit()">
        <mat-icon>edit</mat-icon>
        {{ 'note.edit' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .preview-content {
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
      margin: 0;
    }
    .preview-link {
      word-break: break-all;
    }
    .preview-images {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .preview-img-wrap {
      position: relative;
      display: inline-flex;
    }
    .preview-img-wrap:hover .img-download-btn {
      opacity: 1;
    }
    .img-download-btn {
      position: absolute;
      bottom: 4px;
      right: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      background: rgba(0,0,0,0.45);
      color: #fff;
    }
    .preview-img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      object-fit: contain;
    }
    .preview-files {
      list-style: none;
      padding: 0;
      margin: 16px 0 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .preview-files li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 8px;
      background: var(--mat-sys-surface-variant);
    }
    .file-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: var(--mat-sys-on-surface-variant);
    }
    .file-size {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      margin-right: 4px;
    }
  `],
})
export class NotePreviewComponent {
  private readonly _notesService = inject(NotesService);
  private readonly _filesService = inject(FilesService);
  private readonly _dialogRef = inject(MatDialogRef<NotePreviewComponent>);
  private readonly _destroyRef = inject(DestroyRef);

  readonly note: Note = inject(MAT_DIALOG_DATA);

  protected readonly imageUrls = signal<{ url: string; attachment: Attachment }[]>([]);
  protected readonly fileAttachments = signal<Attachment[]>([]);

  constructor() {
    this._destroyRef.onDestroy(() => {
      this.imageUrls().forEach((img) => this._filesService.revokeObjectURL(img.url));
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
    const buffer = await this._notesService.decryptAttachment(attachment);
    const url = this._filesService.bufferToObjectURL(buffer, attachment.mimeType);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    a.click();
    this._filesService.revokeObjectURL(url);
  }

  protected readonly contentHtml = computed(() => {
    // Escape HTML special chars first to prevent injection, then linkify URLs
    const escaped = this.note.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return escaped.replace(
      /https?:\/\/[^\s]+/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    );
  });

  private async _loadImages() {
    if (!this.note.id) return;
    const attachments: Attachment[] = await this._notesService.getAttachments(this.note.id);
    const images = attachments.filter((a) => a.mimeType.startsWith('image/'));
    const files = attachments.filter((a) => !a.mimeType.startsWith('image/'));
    const loaded = await Promise.all(
      images.map(async (a) => {
        const buffer = await this._notesService.decryptAttachment(a);
        return { url: this._filesService.bufferToObjectURL(buffer, a.mimeType), attachment: a };
      }),
    );
    this.imageUrls.set(loaded);
    this.fileAttachments.set(files);
  }
}
