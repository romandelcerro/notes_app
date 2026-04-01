export type NoteType = 'text' | 'link' | 'image' | 'file';

export interface Note {
  id?: number;
  title: string;
  content: string;
  type: NoteType;
  color: string;
  pinned: boolean;
  userId: string;
  sectionId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id?: number;
  noteId: number;
  name: string;
  mimeType: string;
  encryptedData: string;
  size: number;
  createdAt: Date;
}

export type NewNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;
