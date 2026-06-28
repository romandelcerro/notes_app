# API Changes — Frontend Impact

Schema merge completed. New fields + endpoints added to backend.  
Frontend **not modified**. Below: every API change requiring frontend updates.

---

## 1. New Endpoints

### POST `/auth/refresh`
- **Body**: `{ refreshToken: string }`
- **Response**: `{ accessToken: string, refreshToken: string }`
- **Frontend needed**: call when access token expires (401), store + rotate refresh token

### POST `/auth/logout`
- **Auth**: JWT required
- **Body**: `{ refreshToken: string }`
- **Response**: `void`
- **Frontend needed**: call on sign out to invalidate session

### POST `/auth/logout-all`
- **Auth**: JWT required
- **Body**: none
- **Response**: `void`
- **Frontend needed**: optional "log out everywhere" action

### GET `/sessions`
- **Auth**: JWT required
- **Response**: `SessionResponse[]` — list active sessions
- **Frontend needed**: session management UI

### DELETE `/sessions/:id`
- **Auth**: JWT required
- **Response**: `void` — revoke specific session
- **Frontend needed**: revoke other sessions

---

## 2. Modified Response Shapes

### POST `/auth/signup`, `/auth/signin`, `/auth/guest`, `/auth/convert-guest`
**AuthResponse** now includes `refreshToken`:

```ts
// BEFORE
{ accessToken: string, user: UserResponse }

// AFTER
{ accessToken: string, refreshToken: string, user: UserResponse }
```

**Frontend needed**: store `refreshToken` alongside `accessToken`.

---

### GET `/auth/me`, POST `/auth/signup`, `/auth/signin`, `/auth/guest`, `/auth/convert-guest`
**UserResponse** now has 4 new fields:

```ts
// ADDED:
username: string | null
isVerified: boolean
plan: 'basic' | 'pro'
storageUsedBytes: number
```

**Frontend needed**: update `UserResponse` interface in `auth.service.ts`.  
Optional: show plan, verified status, storage quota.

---

### PATCH `/users/me`
**Body** now accepts optional `username`:

```ts
// ADDED:
username?: string
```

**Frontend needed**: update `updateProfile()` call in `user.service.ts` to support username.

---

### GET `/sections`, POST `/sections`, PATCH `/sections/:id`
**SectionResponse** now includes `isDefault`:

```ts
// ADDED:
isDefault: boolean
```

**Frontend needed**: update `SectionResponse` interface in `sections.service.ts`.  
(The frontend already reads `isDefault` from response — type def may be missing it.)

---

### POST `/attachments`, GET `/attachments/batch`, GET `/attachments/:id`
**AttachmentResponse** now includes `status` and `uploadedAt`:

```ts
// ADDED:
status: 'pending' | 'active'
uploadedAt: string | null
```

Also `encryptedData` is now returned in **all** attachment responses (not just batch/:id).

**Frontend needed**: update `AttachmentResponse` interface in `attachment.service.ts`.

---

## 3. New Auth Flow Required

```
SignIn/SignUp
  → store accessToken + refreshToken
  → on 401: POST /auth/refresh { refreshToken }
    → if success: replace accessToken, retry original request
    → if fail: redirect to login
  → on SignOut: POST /auth/logout { refreshToken }
```

Implement token refresh interceptor (or extend existing `authInterceptor`).

---

## 4. New Fields to Map (Optional)

| Entity | New Field | Where to Use |
|--------|-----------|--------------|
| User | `username` | Profile display, edit form |
| User | `plan` | Show plan badge, upgrade prompts |
| User | `storageUsedBytes` | Storage quota progress bar |
| User | `isVerified` | Show verified badge |
| Section | `isDefault` | Already read by frontend, add to Section model |
| Attachment | `status` | Show upload progress state |
| Attachment | `uploadedAt` | Show upload timestamp |

---

## 5. Updated Shared Types (`@notes-app/shared`)

The following interfaces in `packages/shared/src/dto/` were updated:

| File | Changes |
|------|---------|
| `auth.ts` | Added `RefreshTokenRequest`, `RefreshTokenResponse`, `SessionResponse`. Updated `AuthResponse` (+refreshToken), `UserResponse` (+username, isVerified, plan, storageUsedBytes). Added `username?` to `SignUpRequest`. |
| `user.ts` | Updated `UpdateUserRequest` (+username) |
| `section.ts` | Updated `CreateSectionRequest` (+isDefault), `UpdateSectionRequest` (+isDefault), `SectionResponse` (+isDefault) |
| `attachment.ts` | Updated `AttachmentResponse` (+status, uploadedAt, encryptedData) |
| `backup.ts` | Updated `BackupSection` (+isDefault), `BackupAttachment` (+status, uploadedAt) |

**Frontend needed**: re-import or sync these types locally.
