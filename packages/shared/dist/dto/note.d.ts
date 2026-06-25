export type NoteType = 'text' | 'link' | 'image' | 'file';
export interface CreateNoteRequest {
    title: string;
    content: string;
    type: NoteType;
    color: string;
    pinned: boolean;
    sectionId?: number;
}
export interface UpdateNoteRequest {
    title?: string;
    content?: string;
    color?: string;
    pinned?: boolean;
    sectionId?: number | null;
}
export interface NoteResponse {
    id: number;
    title: string;
    content: string;
    type: NoteType;
    color: string;
    pinned: boolean;
    hasAttachments: boolean;
    userId: string;
    sectionId: number | null;
    createdAt: string;
    updatedAt: string;
}
export interface NoteFilterParams {
    query?: string;
    dateFrom?: string;
    dateTo?: string;
    sectionId?: number;
    pinned?: boolean;
}
export interface ReorderNotesRequest {
    groupKey: string;
    noteIds: number[];
}
