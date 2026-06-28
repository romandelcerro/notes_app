export type NoteType = 'text' | 'link' | 'image' | 'file';

export interface Note {
  id?: number;
  title: string;
  content: string;
  type: NoteType;
  color: string;
  pinned: boolean;
  hasAttachments: boolean;
  userId: string;
  sectionId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NoteFilter {
  query: string;
  dateFrom?: string;
  dateTo?: string;
  sectionId?: number;
  pinned?: boolean;
}
