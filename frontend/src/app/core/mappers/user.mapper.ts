import type { User as FirebaseUser } from 'firebase/auth';
import type { User } from '../models/user.model';

export function mapFirebaseUser(firebaseUser: FirebaseUser, localAvatar: string | null): User {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoURL: localAvatar ?? firebaseUser.photoURL
  };
}
