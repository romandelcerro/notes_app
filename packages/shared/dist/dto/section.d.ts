export interface CreateSectionRequest {
    name: string;
    isDefault?: boolean;
}
export interface UpdateSectionRequest {
    name?: string;
    order?: number;
    isDefault?: boolean;
}
export interface SectionResponse {
    id: number;
    name: string;
    userId: string;
    order: number;
    isDefault: boolean;
    createdAt: string;
}
