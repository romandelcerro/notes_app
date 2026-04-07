import type { Note } from '../models/note.model';
import type { CryptoService } from '../services/crypto.service';

export function buildNewNote(base: Note, userId: string): Note {
  return { ...base, userId };
}

export function buildUpdatedNote(note: Note, updatedNote: Note): Note {
  return { ...note, ...updatedNote };
}

export async function encryptNote(note: Note, crypto: CryptoService): Promise<Note> {
  return {
    ...note,
    title: await crypto.encrypt(note.title),
    content: await crypto.encrypt(note.content)
  };
}

export async function decryptNote(note: Note, crypto: CryptoService): Promise<Note> {
  return {
    ...note,
    title: await crypto.decrypt(note.title),
    content: await crypto.decrypt(note.content)
  };
}

export async function mapUpdatedNote(note: Note, updatedAt: Date, crypto: CryptoService) {
  return {
    title: await crypto.encrypt(note.title),
    content: await crypto.encrypt(note.content),
    color: note.color,
    pinned: note.pinned,
    sectionId: note.sectionId,
    updatedAt
  };
}
