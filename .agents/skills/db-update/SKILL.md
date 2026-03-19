---
name: db-update
description: Update the wuwa game-data PostgreSQL database. Use when adding, modifying, or deleting capabilities, skills, or entities. Includes schema reference, JSON shape examples, and validation instructions.
---

# DB Update Skill

Database: PostgreSQL via `DATABASE_URL` from `drizzle.config.ts`

- Drizzle schema source: `src/db/schema.ts`
- Drizzle config: `drizzle.config.ts`
- Validate after changes: `npm run db:validate`

---

## Querying (PostgreSQL)

Use `full_capabilities` for denormalized lookups.

```bash
# Example: run ad-hoc SQL against DATABASE_URL
set -a; source .env; set +a
node - <<'NODE'
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

const rows = await sql`SELECT * FROM full_capabilities WHERE skill_name ILIKE '%Empyrean%' LIMIT 20`;
console.log(rows);

await sql.end();
NODE
```

Useful queries:

```sql
SELECT * FROM full_capabilities WHERE skill_name ILIKE '%Empyrean%';
SELECT * FROM skills WHERE id = 164;
SELECT * FROM capabilities WHERE skill_id = 164;
SELECT * FROM capabilities WHERE id = 1328;
SELECT id, name, type FROM entities WHERE type = 'character';
```

---

## Schema

### entities

| Column               | Type               | Notes                                                     |
| -------------------- | ------------------ | --------------------------------------------------------- |
| id                   | serial PK          |                                                           |
| game_id              | integer UNIQUE     |                                                           |
| name                 | text NOT NULL      |                                                           |
| type                 | text NOT NULL      | `character`, `weapon`, `echo`, `echo_set`                 |
| icon_url             | text               |                                                           |
| rank                 | integer            |                                                           |
| weapon_type          | text               |                                                           |
| description          | text               |                                                           |
| attribute            | text               | `glacio`, `fusion`, `electro`, `spectro`, `aero`, `havoc` |
| echo_set_ids         | jsonb              | Array of echo set IDs                                     |
| set_bonus_thresholds | jsonb              | Array of set thresholds                                   |
| cost                 | integer            |                                                           |
| created_at           | timestamp NOT NULL |                                                           |
| updated_at           | timestamp NOT NULL |                                                           |

### skills

| Column      | Type                              | Notes                  |
| ----------- | --------------------------------- | ---------------------- |
| id          | serial PK                         |                        |
| entity_id   | integer NOT NULL FK → entities.id |                        |
| game_id     | integer                           |                        |
| name        | text NOT NULL                     |                        |
| description | text                              |                        |
| icon_url    | text                              |                        |
| origin_type | text NOT NULL                     | See origin types below |
| created_at  | timestamp NOT NULL                |                        |
| updated_at  | timestamp NOT NULL                |                        |

**origin_type values:** `Normal Attack`, `Resonance Skill`, `Resonance Liberation`, `Inherent Skill`, `Intro Skill`, `Forte Circuit`, `Outro Skill`, `Tune Break`, `Echo`, `Echo Set`, `Weapon`, `Base Stats`, `s1`–`s6`

### capabilities

| Column          | Type                            | Notes                                                          |
| --------------- | ------------------------------- | -------------------------------------------------------------- |
| id              | serial PK                       |                                                                |
| skill_id        | integer NOT NULL FK → skills.id |                                                                |
| name            | text                            | Optional label                                                 |
| description     | text                            | Relevant subset of parent skill description                    |
| capability_json | jsonb NOT NULL                  | Discriminated by `type` (`attack`/`modifier`/`permanent_stat`) |
| created_at      | timestamp NOT NULL              |                                                                |
| updated_at      | timestamp NOT NULL              |                                                                |

Note: `capability_type` column was removed. Use `capability_json->>'type'` when querying.

---

## `capability_json` Shapes

### attack

```json
{
  "type": "attack",
  "damageInstances": [
    {
      "motionValue": 0.4871,
      "attribute": "glacio",
      "damageType": "basicAttack",
      "tags": [],
      "scalingStat": "atk"
    }
  ]
}
```

### modifier

```json
{
  "type": "modifier",
  "modifiedStats": [
    {
      "target": "self",
      "stat": "damageBonus",
      "value": 0.2,
      "tags": ["resonanceSkill"]
    },
    {
      "target": "team",
      "stat": "attackScalingBonus",
      "value": 0.1,
      "tags": ["all"]
    }
  ]
}
```

### permanent_stat

```json
{
  "type": "permanent_stat",
  "stat": "damageBonus",
  "value": 0.8,
  "tags": ["coordinatedAttack"]
}
```

### stackable modifier value

Use a scaled `userParameterizedNumber` for manual stack-count inputs.

```json
{
  "type": "modifier",
  "modifiedStats": [
    {
      "target": "self",
      "stat": "damageBonus",
      "value": {
        "type": "userParameterizedNumber",
        "parameterId": "0",
        "scale": 0.1,
        "minimum": 0,
        "maximum": 3
      },
      "tags": ["spectro"]
    }
  ]
}
```

### conditional permanent_stat

Use this when an always-on passive or set bonus has a stat threshold gate.

```json
{
  "type": "permanent_stat",
  "stat": "damageBonus",
  "value": {
    "type": "conditional",
    "operand": {
      "type": "statParameterizedNumber",
      "stat": "energyRegen",
      "resolveWith": "self"
    },
    "operator": ">=",
    "threshold": 2.5,
    "valueIfTrue": 0.3,
    "valueIfFalse": 0
  },
  "tags": ["all"]
}
```

---

## Write Examples (PostgreSQL)

```bash
set -a; source .env; set +a
node - <<'NODE'
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

await sql`INSERT INTO capabilities (skill_id, name, description, capability_json)
VALUES (
  164,
  NULL,
  'Increase the Resonator''s Coordinated Attack DMG by 80%.',
  ${{
    type: 'permanent_stat',
    stat: 'damageBonus',
    value: 0.8,
    tags: ['coordinatedAttack'],
  }}::jsonb
)`;

await sql.end();
NODE
```

Important:

- Do NOT pass `JSON.stringify(obj)` into `::jsonb`. That stores a JSON **string**, not a JSON object.
- Use `${obj}::jsonb` or `${sql.json(obj)}::jsonb` for `capability_json`.
- If this mistake happened, repair with:

```sql
UPDATE capabilities
SET capability_json = (capability_json #>> '{}')::jsonb,
    updated_at = now()
WHERE jsonb_typeof(capability_json) = 'string'
  AND LEFT(capability_json #>> '{}', 1) IN ('{', '[');
```

Update example:

```sql
UPDATE capabilities
SET capability_json = jsonb_set(
  capability_json,
  '{modifiedStats,0,target}',
  '"activeCharacter"'
)
WHERE id = 1328;
```

## Modeling Rules

- Inspect the current capability rows before editing. Match the existing entity / skill structure unless the task is specifically to restructure it.
- Prefer updating an existing row in place when it still represents the same gameplay clause. Insert a new row only when the raw text contains an additional independent clause that deserves its own capability.
- If a raw description contains an extra hit or damage event, model that as an `attack`, not as an oversized `damageBonus` modifier.
- Split bundled effects into separate capabilities when they differ by trigger, duration, stack count, or condition. Examples:
  - one clause triggers on Resonance Skill cast and another on Resonance Liberation
  - one clause is gated by a threshold while another is unconditional
  - two clauses stack independently
- Only keep multiple `modifiedStats` in one modifier row when they are truly part of the same temporary effect and should always be toggled together.
- For split echo-set modifiers, follow the existing DB convention:
  - keep `capability.name = NULL`
  - give each row a clause-specific `description`
  - keep them under the same `skill_id`
- Use `target: "self"` for buffs that belong to the source / set holder themselves.
- Use `target: "activeCharacter"` only when the effect is meant to apply to whoever is currently on field or the incoming character at application time.
- For all-attribute / generic damage bonuses, prefer `tags: ["all"]` instead of enumerating every elemental attribute tag when the effect is not meant to be element-specific in the model.
- For stackable buffs, prefer a scaled `userParameterizedNumber`:
  - `parameterId: "0"`
  - `minimum: 0`
  - `maximum: <max stacks>`
  - `scale: <per-stack value>`
- For threshold-gated passives or set bonuses that are effectively always part of the holder's statline, prefer a `permanent_stat` with a conditional `value` tree instead of a temporary `modifier`.
- When swapping names between existing capabilities, rename the exact rows in place rather than deleting and recreating them, so capability IDs remain stable.

---

## Post-Migration Invariants (d9397bd + af4352c)

Always preserve these:

1. `modifier` no longer has top-level `target`.
1. Every `modifier.modifiedStats[]` entry MUST include its own `target`.
1. Every `attack.damageInstances[]` entry MUST include both `attribute` and `damageType`.
1. `attack` no longer has top-level `attribute`.

Quick validation SQL:

```sql
-- Should all be zero
SELECT COUNT(*) FROM capabilities
WHERE capability_json->>'type'='modifier'
  AND capability_json ? 'target';

SELECT COUNT(*) FROM capabilities c
WHERE c.capability_json->>'type'='modifier'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(c.capability_json->'modifiedStats','[]'::jsonb)) s
    WHERE NOT (s ? 'target')
  );

SELECT COUNT(*) FROM capabilities
WHERE capability_json->>'type'='attack'
  AND capability_json ? 'attribute';

SELECT COUNT(*) FROM capabilities c
WHERE c.capability_json->>'type'='attack'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(c.capability_json->'damageInstances','[]'::jsonb)) di
    WHERE NOT (di ? 'attribute') OR NOT (di ? 'damageType')
  );
```

When a skill has multiple effects that are truly simultaneous and inseparable, prefer a single modifier row with multiple `modifiedStats` entries (mixed targets allowed). If the effects are independently triggered, independently stacked, or have different durations / conditions, split them into separate capabilities instead.

## Post-Write Sanity Checks

Run these after inserts/updates (before `db:validate`):

```sql
-- 1) No serialized JSON strings in capability_json
SELECT COUNT(*) AS json_strings
FROM capabilities
WHERE jsonb_typeof(capability_json) = 'string';

-- 2) Every capability has a type
SELECT COUNT(*) AS missing_type
FROM capabilities
WHERE capability_json->>'type' IS NULL;

-- 3) Distribution by type (quick smoke check)
SELECT capability_json->>'type' AS type, COUNT(*)
FROM capabilities
GROUP BY 1
ORDER BY 1;
```

---

## Validation

Always run after DB updates:

```bash
npm run db:validate
```

Expected output: `✓ All records are valid!` with 0 invalid records.
