# shadcn instructions

Use the latest version of Shadcn to install new components, like this command to add a button component:

```bash
pnpm dlx shadcn@latest add button
```

# Repository Layout and Configuration

## Framework

This project uses [TanStack Start](https://tanstack.com/start/latest/docs/framework/react/overview), a full-stack React framework. Server functions are created using `createServerFn` from `@tanstack/react-start`.

## Data Storage

### Local Data Directory

All game data is stored locally in `.local/data/` with the following structure:

```
.local/data/
├── character/parsed/     # Character detail JSON files
├── echo/parsed/          # Echo detail JSON files
├── echo-set/parsed/      # Echo set detail JSON files
├── weapon/parsed/        # Weapon detail JSON files
└── echo-set.json         # Echo set reference data
```

### fs-store Pattern

The repository uses a data store abstraction defined in `src/services/game-data/hakushin-api/fs-store.ts`:

- `createFsStore<T>(localDataPath = '.local/data')` - Creates a type-safe file system data store
- Automatically falls back to in-memory storage in browser environments
- Provides `get(key)` and `put(key, value)` methods for async file operations
- Handles JSON serialization/deserialization automatically

### Server Functions

Data access follows this pattern:

1. **List functions** - Return arrays of items (e.g., `listCharacters`, `listEchoes`)
   - MUST be wrapped with `createServerFn` when reading from local-only files (e.g., echo-set.json)
   - Functions that use Hakushin API can fall back to fetching from the API in the browser
2. **Get details functions** - Fetch individual item details by name using fs-store
   - Always wrapped with `createServerFn` to run on the server
3. **Save details functions** - Persist item details to local storage using fs-store
   - Always wrapped with `createServerFn` to run on the server

Important: List functions that read local-only data files must be server functions:

```typescript
export const listEchoSets = createServerFn({
  method: 'GET',
}).handler(async (): Promise<Array<EchoSetResponseItem>> => {
  const echoSets = await echoSetsStore.get('echo-set.json');
  if (!echoSets) {
    throw new Error('Failed to load echo sets data');
  }
  return Object.entries(echoSets).map(([id, group]) => ({
    id,
    name: group.en,
    tiers: group.tiers,
  }));
});
```

Example pattern for get/save:

```typescript
import { createFsStore } from '../hakushin-api/fs-store';

const itemStore = createFsStore<ItemType>();

export const getItemDetails = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: name }) => {
    const id = await getItemIdByName(name);
    const key = `item/parsed/${id}.json`;
    const itemData = await itemStore.get(key);
    if (!itemData) {
      throw new Error(`Failed to fetch item details for ID ${id}`);
    }
    return itemData;
  });
```

## General Instructions

- Unless explicitly requested to change files, default to providing implementation in your response rather than changing existing files

- Use Array<T> instead of T[] in all cases

- Run `npm run check` after any code changes to lint, format, and test your code
