export interface CreateAttachmentRequest {
  noteId: number;
  name: string;
  mimeType: string;
  encryptedData: string;
  size: number;
}

export type AttachmentStatus = 'pending' | 'active';

export interface AttachmentResponse {
  id: number;
  noteId: number;
  name: string;
  mimeType: string;
  encryptedData: string;
  size: number;
  status: AttachmentStatus;
  uploadedAt: string | null;
  createdAt: string;
}
