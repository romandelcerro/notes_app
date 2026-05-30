import { Injectable, inject } from '@angular/core';
import { mapFileToAttachment } from '../mappers/attachment.mapper';
import type { Attachment } from '../models/attachment.model';
import { CryptoService } from './crypto.service';
import { DatabaseService } from './database.service';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly _cryptoService = inject(CryptoService);
  private readonly _databaseService = inject(DatabaseService);

  async addAttachment(noteId: number, file: File): Promise<Attachment> {
    const buffer = await file.arrayBuffer();
    const encryptedData = await this._cryptoService.encryptBuffer(buffer);
    const attachment = mapFileToAttachment(noteId, file, encryptedData);
    const id = await this._databaseService.attachments.add(attachment);
    return { ...attachment, id };
  }

  async getAttachments(noteId: number): Promise<Attachment[]> {
    return this._databaseService.attachments.where('noteId').equals(noteId).toArray();
  }

  async deleteAttachment(attachmentId: number) {
    await this._databaseService.attachments.delete(attachmentId);
  }

  async decryptAttachment(attachment: Attachment) {
    return this._cryptoService.decryptBuffer(attachment.encryptedData);
  }
}
