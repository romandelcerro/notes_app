# Database & API Reference

> Auto-generated. Run `pnpm generate:docs` to refresh after schema/api changes.

---

## Database Model

SQLite via TypeORM (sql.js driver). 4 tables, auto-synced (`synchronize: true`).

### Table: `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `uid` | UUID (PK) | Auto-generated |
| `email` | VARCHAR | UNIQUE, NOT NULL |
| `passwordHash` | VARCHAR | NOT NULL |
| `displayName` | VARCHAR | NULL |
| `photoURL` | TEXT | NULL |
| `isGuest` | BOOLEAN | Default `false` |
| `guestExpiresAt` | DATETIME | NULL |
| `createdAt` | DATETIME | Auto-set |

Relations: `1:N → notes`, `1:N → sections`

### Table: `notes`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment |
| `title` | TEXT | Encrypted client-side |
| `content` | TEXT | Encrypted client-side |
| `type` | VARCHAR | `text\|link\|image\|file` |
| `color` | VARCHAR | Hex color |
| `pinned` | BOOLEAN | Default false |
| `userId` | UUID | FK → users.uid, CASCADE |
| `sectionId` | INTEGER | FK → sections.id, SET NULL |
| `createdAt` | DATETIME | Auto-set |
| `updatedAt` | DATETIME | Auto-update |

Indexes: `userId`, `sectionId`, `type`, `pinned`, `createdAt`, `updatedAt`

### Table: `sections`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment |
| `name` | VARCHAR | NOT NULL |
| `userId` | UUID | FK → users.uid, CASCADE |
| `order` | INTEGER | Default 0 |
| `createdAt` | DATETIME | Auto-set |

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
| `createdAt` | DATETIME | Auto-set |

Indexes: `noteId`, `mimeType`, `createdAt`

### Entity Relationships (ER)

```
users ──┬── notes (CASCADE)
        └── sections (CASCADE)

notes ──┬── attachments (CASCADE)
        └── sections (SET NULL)
```

---

## Backend API (NestJS :3000)

Base URL: `http://localhost:3000`

Auth: Bearer JWT token (7d expiry for registered users, 24h for guests; secret via `JWT_SECRET` env or `dev-secret-change-in-prod`)

All POST/PATCH/PATCH bodies accept JSON (`Content-Type: application/json`).

### Auth (no JWT required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/auth/signup` | `{ email, password, displayName }` | `{ accessToken, user }` |
| `POST` | `/auth/signin` | `{ email, password }` | `{ accessToken, user }` |
| `POST` | `/auth/guest` | `{ displayName, email? }` | `{ accessToken, user }` — guest token expires in 24h |
| `POST` | `/auth/convert-guest` | `{ email, password }` | `{ accessToken, user }` — JWT required, converts guest to registered user |
| `GET` | `/auth/me` | — | `{ uid, email, displayName, photoURL, isGuest, guestExpiresAt, createdAt }` — JWT required |

### Users (JWT required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/users/me` | — | `{ uid, email, displayName, photoURL, isGuest, guestExpiresAt, createdAt }` |
| `PATCH` | `/users/me` | `{ displayName?, photoURL? }` | `{ uid, email, displayName, photoURL, isGuest, guestExpiresAt, createdAt }` |

### Notes (JWT required)

| Method | Path | Query | Body | Response |
|--------|------|-------|------|----------|
| `GET` | `/notes` | `?query=&dateFrom=&dateTo=&sectionId=&pinned=` | — | `Note[]` |
| `POST` | `/notes` | — | `{ title, content, type, color, pinned, sectionId? }` | `Note` |
| `GET` | `/notes/:id` | — | — | `Note` |
| `PATCH` | `/notes/:id` | — | `{ title?, content?, color?, pinned?, sectionId? }` | `Note` |
| `DELETE` | `/notes/:id` | — | — | `void` |
| `POST` | `/notes/reorder` | — | `{ groupKey, noteIds }` | `void` |

Note fields (request/response): `id`, `title`, `content`, `type`, `color`, `pinned`, `userId`, `sectionId`, `createdAt`, `updatedAt`

### Sections (JWT required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/sections` | — | `Section[]` |
| `POST` | `/sections` | `{ name }` | `Section` |
| `PATCH` | `/sections/:id` | `{ name?, order? }` | `Section` |
| `DELETE` | `/sections/:id` | — | `void` |

Section fields: `id`, `name`, `userId`, `order`, `createdAt`

### Attachments (JWT required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/attachments/note/:noteId` | — | `Attachment[]` |
| `POST` | `/attachments` | `{ noteId, name, mimeType, encryptedData, size }` | `Attachment` |
| `GET` | `/attachments/:id` | — | `Attachment` |
| `DELETE` | `/attachments/:id` | — | `void` |

Attachment fields: `id`, `noteId`, `name`, `mimeType`, `size`, `createdAt`  
Note: `encryptedData` is returned only in `GET /attachments/:id`

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

Frontend (Angular 21) communicates with backend via HTTP for all data operations. IndexedDB (Dexie.js) removed.

**Auth flow:** JWT token stored in `localStorage` (`notes_access_token`). Attached via `authInterceptor` to all requests (`Authorization: Bearer <token>`). 401 responses trigger redirect to `/login`.

**Client-side encryption:** Titles and content are AES-GCM encrypted (via `CryptoService`, PBKDF2 key derived from userId) before sending to backend. Backend stores encrypted blobs. Decrypted on read.

### Frontend Services → Backend API

| Frontend Service | Backend API |
|-----------------|-------------|
| `AuthService` | `POST /auth/signup`, `POST /auth/signin`, `POST /auth/guest`, `POST /auth/convert-guest`, `GET /auth/me` |
| `NotesService` | `GET /notes`, `POST /notes`, `PATCH /notes/:id`, `DELETE /notes/:id` |
| `SectionsService` | `GET /sections`, `POST /sections`, `PATCH /sections/:id`, `DELETE /sections/:id` |
| `AttachmentService` | `GET /attachments/note/:noteId`, `POST /attachments`, `DELETE /attachments/:id` |
| `UserService` | `GET /users/me`, `PATCH /users/me` |
| `BackupService` | `GET /backup/export`, `POST /backup/import` |
| `CryptoService` | Client-side only (Web Crypto API, no server key) |

---

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `PORT` | `3000` | Backend port |
| `JWT_SECRET` | `dev-secret-change-in-prod` | JWT signing secret |
| `DB_PATH` | `./data/notes.db` | SQLite database file path |
| `GUEST_TTL_HOURS` | `24` | Guest session lifetime in hours (hardcoded, not env yet) |
