export type AttachmentStatus = 'pending' | 'active';

export interface Attachment {
  id?: number;
  noteId: number;
  name: string;
  mimeType: string;
  encryptedData: string;
  size: number;
  status: AttachmentStatus;
  uploadedAt: string | null;
  createdAt: Date;
}
