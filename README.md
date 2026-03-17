# Wuwa Rotation Builder

Wuwa Rotation Builder is a full-stack TanStack Start application for building
Wuthering Waves teams, configuring rotations, and calculating rotation damage
from local game data and server-side combat logic.

## Development

Install dependencies and start the app:

```bash
pnpm install
pnpm dev
```

Build the production bundle:

```bash
pnpm build
```

## Required Workflow

All code changes MUST pass:

```bash
npm run check
```

`npm run check` runs linting, TypeScript, formatting, and tests. Treat it as the
merge gate for code, scripts, and game-data changes.

## Stack Rules

- TanStack Start is the application framework. Server work belongs in server
  functions or server modules.
- TanStack Query manages server-derived data, caching, and invalidation.
- Zustand manages client-side interaction state.
- `shadcn/ui` is the default component library.
- Tailwind CSS is the default styling system.
- Prefer `src/components/ui/layout` and `src/components/ui/typography` over raw
  wrappers when practical.
- The repository uses React Compiler guidance, so avoid adding `useMemo` and
  `useCallback` by default.

## Game Data

Local game data lives under `.local/data/`:

```text
.local/data/
├── character/parsed/
├── echo/parsed/
├── echo-set/parsed/
├── weapon/parsed/
└── echo-set.json
```

Validation and pipeline-related scripts live in `scripts/`. Keep data shape
changes and their validation updates in the same change.

## Useful Commands

```bash
pnpm test
pnpm lint
pnpm format
npm run check
npm run db:validate
npm run pipeline:run
```

## UI Components

Add new `shadcn/ui` components with:

```bash
pnpm dlx shadcn@latest add button
```
