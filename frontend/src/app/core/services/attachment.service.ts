import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
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

@Service()
export class AttachmentService {
  private readonly _http = inject(HttpClient);
  private readonly _cryptoService = inject(CryptoService);
  private readonly _batchCache = new Map<string, Map<number, Attachment[]>>();

  async addAttachment(noteId: number, file: File): Promise<Attachment> {
    const buffer = await file.arrayBuffer();
    const encryptedData = await this._cryptoService.encryptBuffer(buffer);
    const attachment = mapFileToAttachment(noteId, file, encryptedData);
    const created = await firstValueFrom(
      this._http.post<AttachmentResponse>(`${environment.apiUrl}/attachments`, {
        noteId: attachment.noteId,
        name: attachment.name,
        mimeType: attachment.mimeType,
        encryptedData: attachment.encryptedData,
        size: attachment.size,
      }),
    );
    this._batchCache.clear();
    return { ...created, createdAt: new Date(created.createdAt) };
  }

  async getAttachmentsByNoteIds(noteIds: number[]): Promise<Map<number, Attachment[]>> {
    if (!noteIds.length) return new Map();
    const key = [...noteIds].sort().join(',');
    const cached = this._batchCache.get(key);
    if (cached) return cached;
    const ids = noteIds.join(',');
    const raw = await firstValueFrom(
      this._http.get<AttachmentResponse[]>(
        `${environment.apiUrl}/attachments/batch?noteIds=${ids}`,
      ),
    );
    const attachments = raw.map((r) => ({ ...r, createdAt: new Date(r.createdAt) }));
    const map = new Map<number, Attachment[]>();
    for (const att of attachments) {
      const existing = map.get(att.noteId) ?? [];
      existing.push(att);
      map.set(att.noteId, existing);
    }
    this._batchCache.set(key, map);
    return map;
  }

  async getAttachments(noteId: number) {
    const map = await this.getAttachmentsByNoteIds([noteId]);
    return map.get(noteId) ?? [];
  }

  async deleteAttachment(attachmentId: number) {
    await firstValueFrom(this._http.delete(`${environment.apiUrl}/attachments/${attachmentId}`));
    this._batchCache.clear();
  }

  async decryptAttachment(attachment: Attachment) {
    return this._cryptoService.decryptBuffer(attachment.encryptedData);
  }
}
