import type { Attachment } from '../models/attachment.model';

export function mapFileToAttachment(noteId: number, file: File, encryptedData: string): Attachment {
  return {
    noteId,
    name: file.name,
    mimeType: file.type,
    encryptedData,
    size: file.size,
    status: 'pending',
    uploadedAt: null,
    createdAt: new Date(),
  };
}
