import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Note } from '../../../core/models/note.model';
import { FilesService } from '../../../core/services/files.service';
import { NotesService } from '../../../core/services/notes.service';
import { TranslatePipe } from '../../../shared/translate.pipe';

@Component({
  selector: 'app-note-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatMenuModule, MatTooltipModule, DatePipe, TranslatePipe, CdkDragHandle],
  templateUrl: './note-card.component.html',
  styleUrl: './note-card.component.scss'
})
export class NoteCardComponent {
  private readonly _notesService = inject(NotesService);
  private readonly _filesService = inject(FilesService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly note = input.required<Note>();
  readonly editRequest = output<Note>();
  readonly previewRequest = output<Note>();

  protected readonly thumbUrl = signal<string | null>(null);
  protected readonly hasFileAttachments = signal(false);

  private readonly _loadThumb = effect(async () => {
    const id = this.note().id;
    if (!id) return;
    const atts = await this._notesService.getAttachments(id);
    const img = atts.find(a => a.mimeType.startsWith('image/'));
    this.hasFileAttachments.set(atts.some(a => !a.mimeType.startsWith('image/')));
    if (!img) return;
    const prev = this.thumbUrl();
    if (prev) this._filesService.revokeObjectURL(prev);
    const buf = await this._notesService.decryptAttachment(img);
    this.thumbUrl.set(this._filesService.bufferToObjectURL(buf, img.mimeType));
  });

  constructor() {
    this._destroyRef.onDestroy(() => {
      const url = this.thumbUrl();
      if (url) this._filesService.revokeObjectURL(url);
    });
  }

  protected async togglePin() {
    const n = this.note();
    await this._notesService.updateNote(n.id!, { pinned: !n.pinned });
  }

  protected async deleteNote() {
    await this._notesService.deleteNote(this.note().id!);
  }

  protected onPreview() {
    this.previewRequest.emit(this.note());
  }

  protected onEdit() {
    this.editRequest.emit(this.note());
  }

  protected readonly contentPreview = computed(() => {
    const content = this.note().content;
    return content.length > 300 ? content.slice(0, 300) + '…' : content;
  });

  protected onContentClick(event: MouseEvent) {
    if ((event.target as HTMLElement).tagName === 'A') {
      event.stopPropagation();
    }
  }

  protected readonly contentHtml = computed(() => {
    const raw = this.contentPreview();
    const escaped = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return escaped.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  });

  protected readonly isLink = computed(() => this.note().type === 'link');
}
