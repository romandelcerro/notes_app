export interface SignUpRequest {
    email: string;
    password: string;
    username: string;
}
export interface SignInRequest {
    email: string;
    password: string;
}
export interface GuestRequest {
    username: string;
    email?: string;
}
export interface ConvertGuestRequest {
    email: string;
    password: string;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: UserResponse;
}
export interface UserResponse {
    uid: string;
    email: string;
    photoURL: string | null;
    username: string;
    isGuest: boolean;
    isVerified: boolean;
    plan: 'basic' | 'pro';
    storageUsedBytes: number;
    guestExpiresAt: string | null;
    createdAt: string;
}
export interface SessionResponse {
    id: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    expiresAt: string;
    lastUsedAt: string | null;
    createdAt: string;
}
