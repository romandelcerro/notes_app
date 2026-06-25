# notes-app

Multi-package monorepo for the Notes app, managed with **pnpm workspaces**.

## Structure

```
notes_app/
├── package.json              # Workspace root (aggregated scripts)
├── pnpm-workspace.yaml       # Workspace definition
├── pnpm-lock.yaml            # Single lockfile for the whole repo
├── frontend/                 # @notes-app/frontend  — Angular 21
├── backend/                  # @notes-app/backend   — NestJS 11
└── packages/
    └── shared/               # @notes-app/shared    — code shared between front and back
```

Each workspace package has its own `package.json` and is identified by a scoped name (`@notes-app/<name>`) so it can be referenced with `pnpm --filter`.

## How pnpm workspaces work here

- `pnpm-workspace.yaml` declares which folders are workspace packages (`frontend`, `backend`, `packages/*`).
- Running `pnpm install` from the root installs dependencies for **every** package and creates a single `pnpm-lock.yaml`. There are no per-package lockfiles.
- Dependencies shared between packages live in a single `node_modules` store at the root; per-package `node_modules` only contain symlinks.
- To depend on a workspace package from another, add it as a regular dependency using the `workspace:*` protocol:

  ```json
  {
    "dependencies": {
      "@notes-app/shared": "workspace:*"
    }
  }
  ```

  Then run `pnpm install` and import it normally (e.g. `import { Note } from '@notes-app/shared'`).

## Requirements

- Node.js `>= 20`
- pnpm `10.33.1` (pinned via `packageManager` at the root)

## Install

```bash
pnpm install
```

Always run install from the **root**, not from inside a subpackage.

## Common scripts (from the root)

| Script                    | What it does                                              |
| ------------------------- | --------------------------------------------------------- |
| `pnpm dev:frontend`       | Start the Angular dev server                              |
| `pnpm dev:backend`        | Start NestJS in watch mode                                |
| `pnpm build`              | Build every `@notes-app/*` package                        |
| `pnpm build:frontend`     | Build only the frontend                                   |
| `pnpm build:backend`      | Build only the backend                                    |
| `pnpm test`               | Run tests in every package that defines a `test` script   |
| `pnpm lint`               | Run lint in every package that defines a `lint` script    |
| `pnpm format`             | Run format in every package that defines a `format` script |
| `pnpm clean`              | Remove all `node_modules`, `dist`, and `.angular` folders |

### Running a single package's scripts

Use `pnpm --filter` (or the shortcut scripts in the root `package.json`):

```bash
# Run any script of a single package
pnpm --filter @notes-app/frontend <script>
pnpm --filter @notes-app/backend <script>

# Or use the shortcuts
pnpm frontend <script>
pnpm backend <script>
pnpm shared <script>
```

Examples:

```bash
pnpm frontend test
pnpm backend start:dev
pnpm --filter @notes-app/backend add @nestjs/config
```

### Adding a dependency

- To a specific package:

  ```bash
  pnpm --filter @notes-app/backend add <pkg>
  pnpm --filter @notes-app/frontend add -D <pkg>
  ```

- To the workspace root (tooling shared across packages, like Prettier or a TypeScript version pin):

  ```bash
  pnpm add -Dw <pkg>
  ```

## Auth

- **Registered users**: JWT valid 7 days.
- **Guest users**: JWT valid 24 hours. Expired guest sessions auto-cleaned on next guest sign-in.

## The `packages/shared` package

Reserved for code that needs to be shared between the frontend and the backend (e.g. DTOs, contract types, validation schemas, constants). It is currently empty by design — add files only when there is a real need.

## Adding a new package

1. Create a folder under `packages/<name>` (or at the root if it's an app).
2. Add a `package.json` with a scoped name: `@notes-app/<name>`.
3. If the path isn't already covered by `packages/*`, add it to `pnpm-workspace.yaml`.
4. Run `pnpm install` from the root.

## Per-package documentation

- Frontend (Angular): [`frontend/README.md`](./frontend/README.md)
- Backend (NestJS): [`backend/README.md`](./backend/README.md)
