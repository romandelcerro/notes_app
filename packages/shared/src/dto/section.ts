export interface CreateSectionRequest {
  name: string;
}

export interface UpdateSectionRequest {
  name?: string;
  order?: number;
}

export interface SectionResponse {
  id: number;
  name: string;
  userId: string;
  order: number;
  createdAt: string;
}
