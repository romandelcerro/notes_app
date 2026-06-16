# notes-app monorepo

pnpm workspace. 3 packages: `@notes-app/frontend` (Angular 21), `@notes-app/backend` (NestJS 11), `@notes-app/shared`.

## Commands (root)

| Command | Action |
|---------|--------|
| `pnpm install` | Install all (root only!) |
| `pnpm dev` | Run frontend + backend in parallel |
| `pnpm dev:frontend` | Angular dev server on :4200 |
| `pnpm dev:backend` | NestJS watch mode on :3000 |
| `pnpm build` | Build all packages |
| `pnpm test` | Test all packages |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all packages |
| `pnpm clean` | Nuke node_modules + dist + .angular |
| `pnpm frontend <script>` | Shortcut for `pnpm --filter @notes-app/frontend <script>` |
| `pnpm backend <script>` | Same for backend |
| `pnpm shared <script>` | Same for shared |

## Adding deps

```
pnpm --filter @notes-app/backend add <pkg>
pnpm --filter @notes-app/frontend add -D <pkg>
pnpm add -Dw <pkg>          # root tooling
```

Use `workspace:*` for inter-package refs.

## Frontend

- Angular 21, Material, ngx-translate
- **IndexedDB (Dexie.js)** for all storage. No backend API calls yet.
- **AES-GCM encryption** client-side (PBKDF2 key derivation)
- Test: `ng test` → Vitest (via `@angular/build:unit-test` builder)
- Build requires `.env` file for `pnpm set-env:ci` (auto-runs in build)
- `src/app/core/` for guards, models, services
- `src/app/features/` for pages (`auth`, `home`, `notes`)
- `src/app/shared/` for reusable UI (`toolbar`, `user-menu`)

## Backend

- NestJS 11, Express platform
- Unit tests: `jest` (ts-jest, `*.spec.ts` in `src/`)
- E2E tests: `jest --config ./test/jest-e2e.json` (supertest)
- Coverage: `pnpm backend test:cov` (outputs to `coverage/`)
- Currently scaffold only (no real modules yet)

## Shared

- `@notes-app/shared` — empty by design. Add DTOs/types/constants only when both frontend + backend need them.
- `"type": "module"` in package.json

## Adding new package

1. Create dir + `package.json` with `@notes-app/<name>`
2. Add path to `pnpm-workspace.yaml` if not covered by glob
3. `pnpm install` from root

## Gotchas

- Always `pnpm install` from root, never from subpackage
- Frontend uses **scoped styles** (SCSS) via Angular component schematics
- Frontend test uses Vitest — no Karma/Jasmine config
- Backend `test:e2e` uses separate Jest config at `test/jest-e2e.json`
- `.env` files are gitignored; frontend build reads them
- NestJS uses `experimentalDecorators` + `emitDecoratorMetadata` + `module:nodenext`
