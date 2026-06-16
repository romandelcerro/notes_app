import type { User } from '../models/user.model';

export function mapLocalUser(data: { uid: string; displayName: string | null; email: string | null }, localAvatar: string | null): User {
  return {
    uid: data.uid,
    displayName: data.displayName,
    email: data.email,
    photoURL: localAvatar
  };
}
