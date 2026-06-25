export interface CreateAttachmentRequest {
    noteId: number;
    name: string;
    mimeType: string;
    encryptedData: string;
    size: number;
}
export interface AttachmentResponse {
    id: number;
    noteId: number;
    name: string;
    mimeType: string;
    size: number;
    createdAt: string;
}
