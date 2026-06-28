export interface User {
  uid: string;
  email: string | null;
  photoURL: string | null;
  username: string;
  isVerified: boolean;
  plan: 'basic' | 'pro';
  storageUsedBytes: number;
  isGuest?: boolean;
  guestExpiresAt?: string | null;
}
