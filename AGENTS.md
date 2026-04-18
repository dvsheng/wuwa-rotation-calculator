# Overview

This project is a full-stack application to enable people to calculate the damage of their rotations in Wuthering Waves by
providing a team builder interface and a rotation builder interface based on the selected team. The application provides game-data
services to get descriptive game information to serve to the client, as well as combat information to serve to the server. The rotation-calculator
service calculates the damage of a user's configured rotation using the aforementioned game-data service.

# Rules / Preferences

Backwards compatability is not needed, this is a greenfield project

Use arrow functions over except in useEffect to create named effects

private/internal constants, interfaces, types, classes etc should be below public (exported) ones

# Repository Layout and Configuration

## Framework

This project uses [TanStack Start](https://tanstack.com/start/latest/docs/framework/react/overview), a full-stack React framework. Server functions are created using `createServerFn` from `@tanstack/react-start`.

For UI, this project uses shadcn, react-grid-layout, and tailwind css.
Use the latest version of Shadcn to install new components, like this command to add a button component:

```bash
pnpm dlx shadcn@latest add button
```

This project also uses React Compiler, so avoid useMemo and useCallback in hooks and components.

This project uses Tanstack form for forms, and zustand for frontend state management.

## General Instructions

- Run `npm run check` after any code changes to lint, format, and test your code
- Prefer `src/components/ui/layout` and `src/components/ui/typography` primitives over raw HTML wrappers (`div`, `span`, etc.) when practical
- Prefer `useSuspenseQuery` for a single suspense-backed query; use `useSuspenseQueries` only when a hook or component truly coordinates multiple queries
- Keep admin APIs as simple CRUD/read layers whenever practical; move admin-specific shaping, grouping, and presentation read models into hook-layer code

## Active Technologies

- TypeScript 5.x, React 19.x + TanStack Start, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS, Drizzle ORM, Zod (001-entities-tab-overhaul)
- PostgreSQL via Drizzle ORM and denormalized `full_capabilities` view (001-entities-tab-overhaul)

## Recent Changes

- 001-entities-tab-overhaul: Added TypeScript 5.x, React 19.x + TanStack Start, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS, Drizzle ORM, Zod
