export interface SignUpRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface ConvertGuestRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}

export interface UserResponse {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isGuest: boolean;
  guestExpiresAt: string | null;
  createdAt: string;
}
