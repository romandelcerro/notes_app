import { Injectable, inject } from '@angular/core';
import { mapFileToAttachment } from '../mappers/attachment.mapper';
import type { Attachment } from '../models/attachment.model';
import { CryptoService } from './crypto.service';
import { db } from './database.service';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly _cryptoService = inject(CryptoService);

  async addAttachment(noteId: number, file: File): Promise<Attachment> {
    const buffer = await file.arrayBuffer();
    const encryptedData = await this._cryptoService.encryptBuffer(buffer);
    const attachment = mapFileToAttachment(noteId, file, encryptedData);
    const id = await db.attachments.add(attachment);
    return { ...attachment, id };
  }

  async getAttachments(noteId: number): Promise<Attachment[]> {
    return db.attachments.where('noteId').equals(noteId).toArray();
  }

  async deleteAttachment(attachmentId: number) {
    await db.attachments.delete(attachmentId);
  }

  async decryptAttachment(attachment: Attachment) {
    return this._cryptoService.decryptBuffer(attachment.encryptedData);
  }
}
