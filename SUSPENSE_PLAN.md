# Suspense & Error Boundary Plan

## Background

The app uses `useSuspenseQuery` in `useEntityList` (consumed by `CharacterSelector`,
`WeaponSelector`, `EchoSetSelector`, `PrimaryEchoSelector`) but has **no Suspense
boundaries or ErrorBoundary components anywhere**. This means suspended queries can
crash the app silently. All other async hooks use `useQuery` with manual loading/error
state handling.

---

## Suspense Boundaries

### 1. Each `CharacterCard` — wrap the selectors (highest priority)
`useSuspenseQuery` is already in use here. Without a boundary, a suspended query
propagates uncaught up the tree. Each card should independently suspend so the
other slots remain interactive.

**Target:** `CharacterCard` wrapping `CharacterSelector`, `WeaponSelector`,
`EchoSetSelector`, `PrimaryEchoSelector`

### 2. `TeamContainer` — coarse outer fallback
A broader boundary around the entire team panel as a catch-all while any entity
list is loading on first paint.

### 3. `LibraryContainer` — after switching to `useSuspenseQuery`
Currently uses `useQuery` with manual `isLoading` checks. Switch to
`useSuspenseQuery` and let a `<Suspense>` boundary render the skeleton.

### 4. Admin routes — after switching to `useSuspenseQuery`
Both `/admin/entities` and `/admin/entities/$id` use `useQuery` with manual
loading states. Same pattern: upgrade to `useSuspenseQuery` + `<Suspense>`.

---

## Error Boundaries

### 1. Route level (all pages) — catch-all
Wrap each route's top-level component in an `ErrorBoundary` so any unhandled
render or query error shows a fallback page instead of a blank crash.

**Routes:** `/`, `/builds`, `/admin/entities`, `/admin/entities/$id`

### 2. Each `CharacterCard` — isolate slot failures
If one character slot's data fails, the other three should still work. An
`ErrorBoundary` per card enables this.

### 3. `RotationResultContainer` — surface calc errors persistently
Rotation calculation errors are currently toast-only. An `ErrorBoundary` here
shows a persistent error state inside the results panel instead.

### 4. Admin entity editor (`/admin/entities/$id`)
Mutation errors are partially handled inline, but render/query errors are not
bounded. Prevents silent admin crashes.

---

## Summary

| Location | Suspense | ErrorBoundary | Notes |
|---|---|---|---|
| Each `CharacterCard` (selectors) | Yes | Yes | `useSuspenseQuery` already in use |
| `TeamContainer` | Yes (coarse) | — | Outer fallback |
| `LibraryContainer` | Yes (after refactor) | Yes | Switch to `useSuspenseQuery` |
| `/admin/entities` | Yes (after refactor) | Yes | Switch to `useSuspenseQuery` |
| `/admin/entities/$id` | Yes (after refactor) | Yes | Switch to `useSuspenseQuery` |
| All routes (page level) | — | Yes | Catch-all for unhandled errors |
| `RotationResultContainer` | — | Yes | Persistent calc error display |
