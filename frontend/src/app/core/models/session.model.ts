export interface Session {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  expiresAt: string;
  lastUsedAt: string | null;
  createdAt: string;
}
