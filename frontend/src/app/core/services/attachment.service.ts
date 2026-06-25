import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mapFileToAttachment } from '../mappers/attachment.mapper';
import type { Attachment } from '../models/attachment.model';
import { CryptoService } from './crypto.service';

interface AttachmentResponse {
  id: number;
  noteId: number;
  name: string;
  mimeType: string;
  encryptedData: string;
  size: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly _http = inject(HttpClient);
  private readonly _cryptoService = inject(CryptoService);

  async addAttachment(noteId: number, file: File): Promise<Attachment> {
    const buffer = await file.arrayBuffer();
    const encryptedData = await this._cryptoService.encryptBuffer(buffer);
    const attachment = mapFileToAttachment(noteId, file, encryptedData);
    const created = await firstValueFrom(this._http.post<AttachmentResponse>(`${environment.apiUrl}/attachments`, {
      noteId: attachment.noteId,
      name: attachment.name,
      mimeType: attachment.mimeType,
      encryptedData: attachment.encryptedData,
      size: attachment.size,
    }));
    return { ...created, createdAt: new Date(created.createdAt) };
  }

  async getAttachments(noteId: number): Promise<Attachment[]> {
    const raw = await firstValueFrom(this._http.get<AttachmentResponse[]>(`${environment.apiUrl}/attachments/note/${noteId}`));
    return raw.map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
  }

  async deleteAttachment(attachmentId: number) {
    await firstValueFrom(this._http.delete(`${environment.apiUrl}/attachments/${attachmentId}`));
  }

  async decryptAttachment(attachment: Attachment) {
    return this._cryptoService.decryptBuffer(attachment.encryptedData);
  }
}
