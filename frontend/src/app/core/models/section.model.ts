export interface Section {
  id?: number;
  name: string;
  userId: string;
  order: number;
  isDefault: boolean;
  createdAt: Date;
  displayName?: string;
}
