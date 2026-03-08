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

| Column               | Type                              | Notes                                                        |
| -------------------- | --------------------------------- | ------------------------------------------------------------ |
| id                   | serial PK                         |                                                              |
| game_id              | integer UNIQUE                    |                                                              |
| name                 | text NOT NULL                     |                                                              |
| type                 | text NOT NULL                     | `character`, `weapon`, `echo`, `echo_set`                   |
| icon_url             | text                              |                                                              |
| rank                 | integer                           |                                                              |
| weapon_type          | text                              |                                                              |
| description          | text                              |                                                              |
| attribute            | text                              | `glacio`, `fusion`, `electro`, `spectro`, `aero`, `havoc`   |
| echo_set_ids         | jsonb                             | Array of echo set IDs                                        |
| set_bonus_thresholds | jsonb                             | Array of set thresholds                                      |
| cost                 | integer                           |                                                              |
| created_at           | timestamp NOT NULL                |                                                              |
| updated_at           | timestamp NOT NULL                |                                                              |

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

| Column          | Type                            | Notes                                             |
| --------------- | ------------------------------- | ------------------------------------------------- |
| id              | serial PK                       |                                                   |
| skill_id        | integer NOT NULL FK → skills.id |                                                   |
| name            | text                            | Optional label                                    |
| description     | text                            | Relevant subset of parent skill description       |
| capability_json | jsonb NOT NULL                  | Discriminated by `type` (`attack`/`modifier`/`permanent_stat`) |
| created_at      | timestamp NOT NULL              |                                                   |
| updated_at      | timestamp NOT NULL              |                                                   |

Note: `capability_type` column was removed. Use `capability_json->>'type'` when querying.

---

## `capability_json` Shapes

### attack

```json
{
  "type": "attack",
  "scalingStat": "atk",
  "attribute": "glacio",
  "damageInstances": [{ "motionValue": 0.4871, "tags": ["basicAttack"], "scalingStat": "atk" }]
}
```

### modifier

```json
{
  "type": "modifier",
  "target": "self",
  "modifiedStats": [{ "stat": "damageBonus", "value": 0.2, "tags": ["resonanceSkill"] }]
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
  ${JSON.stringify({ type: 'permanent_stat', stat: 'damageBonus', value: 0.8, tags: ['coordinatedAttack'] })}::jsonb
)`;

await sql.end();
NODE
```

Update example:

```sql
UPDATE capabilities
SET capability_json = jsonb_set(capability_json, '{target}', '"activeCharacter"')
WHERE id = 1328;
```

---

## Validation

Always run after DB updates:

```bash
npm run db:validate
```

Expected output: `✓ All records are valid!` with 0 invalid records.
