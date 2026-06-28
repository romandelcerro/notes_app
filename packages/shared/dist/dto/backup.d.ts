export interface BackupData {
    version: 1;
    userId: string;
    notes: BackupNote[];
    sections: BackupSection[];
    attachments: BackupAttachment[];
}
export interface BackupNote {
    id?: number;
    title: string;
    content: string;
    type: string;
    color: string;
    pinned: boolean;
    hasAttachments: boolean;
    userId: string;
    sectionId?: number;
    createdAt: string;
    updatedAt: string;
}
export interface BackupSection {
    id?: number;
    name: string;
    userId: string;
    order: number;
    isDefault: boolean;
    createdAt: string;
}
export interface BackupAttachment {
    id?: number;
    noteId: number;
    name: string;
    mimeType: string;
    encryptedData: string;
    size: number;
    status: string;
    uploadedAt: string | null;
    createdAt: string;
}
