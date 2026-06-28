import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import type { Attachment } from '../../../core/models/attachment.model';
import type { Note } from '../../../core/models/note.model';
import { AttachmentService } from '../../../core/services/attachment.service';
import { FilesService } from '../../../core/services/files.service';
import { NotesService } from '../../../core/services/notes.service';

@Component({
  selector: 'app-note-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    DatePipe,
    TranslatePipe,
    CdkDragHandle,
  ],
  templateUrl: './note-card.html',
  styleUrl: './note-card.scss',
})
export class NoteCard {
  protected readonly notesService = inject(NotesService);
  private readonly _attachmentService = inject(AttachmentService);
  private readonly _filesService = inject(FilesService);
  private readonly _destroyRef = inject(DestroyRef);

  public readonly note = input.required<Note>();
  public readonly attachments = input<Attachment[]>([]);
  protected readonly editRequest = output<Note>();
  public readonly previewRequest = output<Note>();

  protected readonly thumbUrl = signal<string | null>(null);
  protected readonly hasFileAttachments = computed(() =>
    this.attachments().some((a) => !a.mimeType.startsWith('image/')),
  );

  protected readonly isLink = computed(() => this.note().type === 'link');

  private readonly _noteContentPreview = computed(() => {
    const noteContent = this.note().content;
    return noteContent.length > 300 ? noteContent.slice(0, 300) + '…' : noteContent;
  });

  protected readonly noteContentHtml = computed(() => {
    const escaped = this._noteContentPreview()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return escaped.replace(
      /https?:\/\/[^\s]+/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    );
  });

  private _loadThumbVersion = 0;

  private readonly _loadThumb = effect(() => {
    const image = this.attachments().find((a) => a.mimeType.startsWith('image/'));

    this._revokeCurrentThumbnail();

    if (!image) {
      this.thumbUrl.set(null);
      return;
    }

    const version = ++this._loadThumbVersion;
    this._attachmentService.decryptAttachment(image).then((buffer) => {
      if (version === this._loadThumbVersion) {
        this.thumbUrl.set(this._filesService.bufferToObjectURL(buffer, image.mimeType));
      }
    });
  });

  constructor() {
    this._destroyRef.onDestroy(() => this._revokeCurrentThumbnail());
  }

  private _revokeCurrentThumbnail() {
    const url = this.thumbUrl();
    if (url) this._filesService.revokeObjectURL(url);
  }

  protected onContentClick(event: Event) {
    if ((event.target as HTMLElement).tagName === 'A') {
      event.stopPropagation();
    }
  }
}
