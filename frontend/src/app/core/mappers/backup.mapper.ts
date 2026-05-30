import type { Attachment } from '../models/attachment.model';
import type { Note } from '../models/note.model';
import type { Section } from '../models/section.model';

export function mapBackupNote(n: Note): Note {
  return { ...n, createdAt: new Date(n.createdAt!), updatedAt: new Date(n.updatedAt!) };
}

export function mapBackupSection(s: Section): Section {
  return { ...s, createdAt: new Date(s.createdAt) };
}

export function mapBackupAttachment(a: Attachment): Attachment {
  return { ...a, createdAt: new Date(a.createdAt) };
}
