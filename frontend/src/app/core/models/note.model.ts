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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NoteFilter {
  query: string;
  dateFrom: Date | null;
  dateTo: Date | null;
}
