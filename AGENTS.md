# notes-app monorepo

pnpm workspace. 3 packages: `@notes-app/frontend` (Angular 22), `@notes-app/backend` (NestJS 11), `@notes-app/shared`.

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

- Angular 22, Material, ngx-translate
- **REST API** to backend (NestJS :3000) for all data. No IndexedDB.
- **AES-GCM encryption** client-side (PBKDF2 key derivation)
- Test: `ng test` → Vitest (via `@angular/build:unit-test` builder)
- Build requires `.env` file for `pnpm set-env:ci` (auto-runs in build)
- `src/app/core/` for guards, models, services
- `src/app/layout/` for shell/toolbar/sidenav
- `src/app/domains/` for feature pages (`notes`, `sections`)
- `src/app/shared/` for reusable UI (`attachment-section`, `user-avatar`)

## Backend

- NestJS 11, Express platform
- Unit tests: `jest` (ts-jest, `*.spec.ts` in `src/`)
- E2E tests: `jest --config ./test/jest-e2e.json` (supertest)
- Coverage: `pnpm backend test:cov` (outputs to `coverage/`)
- Auth: JWT (registered 7d, guest 24h), bcryptjs, Passport, guest auto-cleanup

## Shared

- `@notes-app/shared` — empty by design. Add DTOs/types/constants only when both frontend + backend need them.
- `"type": "module"` in package.json

## Adding new package

1. Create dir + `package.json` with `@notes-app/<name>`
2. Add path to `pnpm-workspace.yaml` if not covered by glob
3. `pnpm install` from root

## Doc Sync

`DATABASE_API_REFERENCE.md` must reflect actual DB schema + API endpoints.

Run `pnpm generate:docs` to regenerate. **Always run after:**
- Adding/removing entity columns or tables
- Adding/removing controller routes or HTTP methods
- Changing DTO fields or validation
- Changing data layer schema or client-side models

## Command discipline

- **Before running any CLI tool**, verify it's defined in project (package.json scripts, Makefile, etc). Don't guess subcommands.
- **If command fails** (`error: unexpected argument`, `command not found`, non-zero exit): stop. Don't retry same thing. Check docs or ask.
- `rtk` is NOT used in this project. Don't run it.
- `ls`/`grep`/`cat`/`head`/`tail` in bash: use dedicated file tools instead (Read/Glob/Grep/Write/Edit). Avoid bash for file ops.
- `pnpm` commands: only root. Use `pnpm --filter` for per-package. Never `pnpm dev:frontend` etc from inside a subpackage dir.

## Encapsulation rules (frontend)

- All class members need explicit access modifier: `public`, `protected`, or `private`
- Private members must start with `_` prefix (e.g. `private readonly _foo`)
- `@typescript-eslint/explicit-member-accessibility` and `@typescript-eslint/naming-convention` enforce this
- **No one-line function wrappers.** If a method only forwards to a service call, expose the service as `protected` and call it directly from template. Bad: `protected onClearNotes() { this._notesService.notes.set([]); }`. Good: `protected readonly notesService = inject(NotesService);` then `notesService.notes.set([])` in template.

## Gotchas

- Always `pnpm install` from root, never from subpackage
- Frontend uses **scoped styles** (SCSS) via Angular component schematics
- Frontend test uses Vitest — no Karma/Jasmine config
- Backend `test:e2e` uses separate Jest config at `test/jest-e2e.json`
- `.env` files are gitignored; frontend build reads them
- NestJS uses `experimentalDecorators` + `emitDecoratorMetadata` + `module:nodenext`
- Angular 22 uses `@Service()` decorator (stable). Replaces `@Injectable({providedIn: 'root'})`. No constructor DI, only `inject()` fn. Export from `@angular/core`.
