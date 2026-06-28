# Database & API Reference

> Auto-generated. Run `pnpm generate:docs` to refresh after schema/api changes.

---

## Database Model

SQLite via TypeORM (sql.js driver). 5 tables, auto-synced (`synchronize: true`).

### Table: `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `uid` | UUID (PK) | Auto-generated |
| `email` | VARCHAR | UNIQUE, NOT NULL |
| `passwordHash` | VARCHAR | NOT NULL |
| `displayName` | VARCHAR | NULL |
| `photoURL` | TEXT | NULL |
| `username` | VARCHAR | NULL |
| `isGuest` | BOOLEAN | Default `false` |
| `isVerified` | BOOLEAN | Default `false` |
| `plan` | VARCHAR | Default `'basic'` (`basic` \| `pro`) |
| `storageUsedBytes` | BIGINT | Default `0` |
| `guestExpiresAt` | DATETIME | NULL |
| `createdAt` | DATETIME | Auto-set |
| `deletedAt` | DATETIME | NULL (soft delete) |

Relations: `1:N → notes`, `1:N → sections`, `1:N → sessions`

### Table: `sessions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `userId` | UUID | FK → users.uid, CASCADE |
| `refreshTokenHash` | VARCHAR | UNIQUE, NOT NULL |
| `deviceInfo` | VARCHAR | NULL |
| `ipAddress` | VARCHAR | NULL |
| `expiresAt` | DATETIME | NOT NULL |
| `lastUsedAt` | DATETIME | NULL |
| `createdAt` | DATETIME | Auto-set |
| `revokedAt` | DATETIME | NULL |

### Table: `notes`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment |
| `title` | TEXT | Encrypted client-side |
| `content` | TEXT | Encrypted client-side |
| `type` | VARCHAR | `text\|link\|image\|file` |
| `color` | VARCHAR | Hex color |
| `pinned` | BOOLEAN | Default false |
| `hasAttachments` | BOOLEAN | Default false |
| `userId` | UUID | FK → users.uid, CASCADE |
| `sectionId` | INTEGER | FK → sections.id, SET NULL |
| `createdAt` | DATETIME | Auto-set |
| `updatedAt` | DATETIME | Auto-update |
| `deletedAt` | DATETIME | NULL (soft delete) |

Indexes: `userId`, `sectionId`, `type`, `pinned`, `createdAt`, `updatedAt`

### Table: `sections`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment |
| `name` | VARCHAR | NOT NULL |
| `userId` | UUID | FK → users.uid, CASCADE |
| `order` | INTEGER | Default 0 |
| `isDefault` | BOOLEAN | Default false |
| `createdAt` | DATETIME | Auto-set |
| `deletedAt` | DATETIME | NULL (soft delete) |

Relations: `1:N → notes`

### Table: `attachments`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment |
| `noteId` | INTEGER | FK → notes.id, CASCADE |
| `name` | VARCHAR | Original filename |
| `mimeType` | VARCHAR | e.g. `image/png` |
| `encryptedData` | TEXT | AES-GCM encrypted base64 |
| `size` | INTEGER | Bytes |
| `status` | VARCHAR | `'active'` (default) or `'pending'` |
| `uploadedAt` | DATETIME | NULL |
| `createdAt` | DATETIME | Auto-set |

Indexes: `noteId`, `mimeType`, `createdAt`

### Entity Relationships (ER)

```
users ──┬── sessions (CASCADE)
        ├── notes (CASCADE)
        └── sections (CASCADE)

notes ──┬── attachments (CASCADE)
        └── sections (SET NULL)
```

---

## Backend API (NestJS :3000)

Base URL: `http://localhost:3000`

Auth: Bearer JWT token (15min expiry). Refresh token rotation via sessions table.

All POST/PATCH/PATCH bodies accept JSON (`Content-Type: application/json`).

### Auth (no JWT required except where noted)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/auth/signup` | `{ email, password, displayName, username? }` | `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/signin` | `{ email, password }` | `{ accessToken, refreshToken, user }` |
| `POST` | `/auth/guest` | `{ displayName, email? }` | `{ accessToken, refreshToken, user }` — guest token expires in 24h |
| `POST` | `/auth/convert-guest` | `{ email, password }` | `{ accessToken, refreshToken, user }` — JWT required, converts guest to registered user |
| `POST` | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` — rotate refresh token |
| `POST` | `/auth/logout` | `{ refreshToken }` | `void` — JWT required |
| `POST` | `/auth/logout-all` | — | `void` — JWT required, revokes all sessions |
| `GET` | `/auth/me` | — | `UserResponse` — JWT required |

### Users (JWT required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/users/me` | — | `UserResponse` |
| `PATCH` | `/users/me` | `{ displayName?, photoURL?, username? }` | `UserResponse` |

### Notes (JWT required)

| Method | Path | Query | Body | Response |
|--------|------|-------|------|----------|
| `GET` | `/notes` | `?query=&dateFrom=&dateTo=&sectionId=&pinned=` | — | `Note[]` |
| `POST` | `/notes` | — | `{ title, content, type, color, pinned, sectionId? }` | `Note` |
| `GET` | `/notes/:id` | — | — | `Note` |
| `PATCH` | `/notes/:id` | — | `{ title?, content?, color?, pinned?, sectionId? }` | `Note` |
| `DELETE` | `/notes/:id` | — | — | `void` |
| `POST` | `/notes/reorder` | — | `{ groupKey, noteIds }` | `void` |

Note fields (request/response): `id`, `title`, `content`, `type`, `color`, `pinned`, `hasAttachments`, `userId`, `sectionId`, `createdAt`, `updatedAt`

### Sections (JWT required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/sections` | — | `Section[]` |
| `POST` | `/sections` | `{ name, isDefault? }` | `Section` |
| `PATCH` | `/sections/:id` | `{ name?, order?, isDefault? }` | `Section` |
| `DELETE` | `/sections/:id` | — | `void` |

Section fields: `id`, `name`, `userId`, `order`, `isDefault`, `createdAt`

### Attachments (JWT required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/attachments/note/:noteId` | — | `Attachment[]` |
| `GET` | `/attachments/batch?noteIds=1,2,3` | — | `Attachment[]` |
| `POST` | `/attachments` | `{ noteId, name, mimeType, encryptedData, size }` | `Attachment` |
| `GET` | `/attachments/:id` | — | `Attachment` |
| `DELETE` | `/attachments/:id` | — | `void` |

Attachment fields: `id`, `noteId`, `name`, `mimeType`, `encryptedData`, `size`, `status`, `uploadedAt`, `createdAt`

### Sessions (JWT required)

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/sessions` | `Session[]` — active sessions |
| `DELETE` | `/sessions/:id` | `void` — revoke session |

Session fields: `id`, `deviceInfo`, `ipAddress`, `expiresAt`, `lastUsedAt`, `createdAt`

### Backup (JWT required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/backup/export` | — | `{ version, userId, notes[], sections[], attachments[] }` |
| `POST` | `/backup/import` | `{ version, userId, notes[], sections[], attachments[] }` | `{ imported: true }` |

`version` must be `1`, `userId` must match authenticated user.

### Health

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/` | `{ status: "ok", timestamp }` |

---

## Frontend API Consumption

### Current State: Full Backend API

Frontend (Angular 22) communicates with backend via HTTP for all data operations.

**Auth flow:** JWT token + refresh token. Access token (15min) attached via `authInterceptor`. 401 → attempt `/auth/refresh` → if fail, redirect to `/login`.

**Client-side encryption:** Titles and content are AES-GCM encrypted (via `CryptoService`, PBKDF2 key derived from userId) before sending to backend. Backend stores encrypted blobs. Decrypted on read.

### Frontend Services → Backend API

| Frontend Service | Backend API |
|-----------------|-------------|
| `AuthService` | `POST /auth/signup`, `POST /auth/signin`, `POST /auth/guest`, `POST /auth/convert-guest`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| `NotesService` | `GET /notes`, `POST /notes`, `PATCH /notes/:id`, `DELETE /notes/:id` |
| `SectionsService` | `GET /sections`, `POST /sections`, `PATCH /sections/:id`, `DELETE /sections/:id` |
| `AttachmentService` | `GET /attachments/note/:noteId`, `GET /attachments/batch?noteIds=`, `POST /attachments`, `DELETE /attachments/:id` |
| `UserService` | `GET /users/me`, `PATCH /users/me` |
| `BackupService` | `GET /backup/export`, `POST /backup/import` |
| `CryptoService` | Client-side only (Web Crypto API, no server key) |

_Note: Session management endpoints (`GET /sessions`, `DELETE /sessions/:id`) are backend-only for now; frontend does not consume them directly._

---

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `PORT` | `3000` | Backend port |
| `JWT_SECRET` | `dev-secret-change-in-prod` | JWT signing secret |
| `DB_PATH` | `./data/notes.db` | SQLite database file path |
| `GUEST_TTL_HOURS` | `24` | Guest session lifetime in hours (hardcoded, not env yet) |
