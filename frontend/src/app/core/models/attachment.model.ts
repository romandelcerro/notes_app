export interface Attachment {
  id?: number;
  noteId: number;
  name: string;
  mimeType: string;
  encryptedData: string;
  size: number;
  createdAt: Date;
}
