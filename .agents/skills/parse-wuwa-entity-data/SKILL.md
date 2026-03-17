---
name: parse-wuwa-entity-data
description: Parse raw Wuthering Waves entity JSON into this project's capability JSON shapes. Use when transforming character, weapon, echo, or echo set source data into `attacks`, `modifiers`, and `permanentStats` that must match the current database and schema types.
---

# Parse Wuwa Entity Data

## Overview

Use this skill when a task involves converting raw Wuthering Waves entity data into the project's parsed capability format.

The output must match the current schema definitions in:

- `src/db/schema.ts`
- `src/schemas/database.ts`

If the task also writes to PostgreSQL, use the `db-update` skill alongside this one.

## Workflow

1. Identify the entity type and load the raw source file:
   - Character: `.local/data/encore.moe/transformed/character-ai/{id}.json`
   - Echo: `.local/data/encore.moe/transformed/echo-ai/{id}.json`
   - Echo set: `.local/data/encore.moe/transformed/echo-set-ai/{id}.json`
   - Weapon: `.local/data/encore.moe/transformed/weapon-ai/{id}.json`
2. Read the current schema types before modeling any capability.
3. If a matching entity already exists in PostgreSQL, inspect current vetted capability rows first to preserve naming and tag conventions.
4. Convert the source data into `attacks`, `modifiers`, and `permanentStats`.
5. Validate after changes:
   - `npm run db:validate` for capability JSON / database-backed data
   - `npm run validate-data` for served local game data

## Existing Data Lookup

When an entity already exists, prefer the current database rows as the naming and tagging baseline:

```sql
SELECT capability_id, capability_json, entity_name, skill_name
FROM full_capabilities
WHERE entity_game_id = {{id}}
ORDER BY skill_id, capability_id;
```

## Modeling Rules

Load [entity-rules.md](./references/entity-rules.md) for the detailed mapping rules before producing or editing parsed output.

Use it for:

- universal stat mapping and number-node rules
- character attack and modifier modeling
- echo-specific attack conventions
- weapon refine-scaling rules
- formatting restrictions and validation requirements

## Output Expectations

Produce a single entity JSON object with:

- `attacks`
- `modifiers`
- `permanentStats`

Do not invent fields that are not present in the current TypeScript schemas.
