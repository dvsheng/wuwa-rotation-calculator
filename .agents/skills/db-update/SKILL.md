---
name: db-update
description: Update the wuwa game-data SQLite database. Use when adding, modifying, or deleting capabilities, skills, or entities. Includes schema reference, JSON shape examples, and validation instructions.
---

# DB Update Skill

Database location: `.local/data/game-data.db`
Validate after any changes: `npm run db:validate`

---

## Querying

Use the `full_capabilities` view to look things up with full context:

```bash
# Find a skill by name
sqlite3 .local/data/game-data.db "SELECT * FROM full_capabilities WHERE skill_name LIKE '%Empyrean%';"

# Find a skill by id
sqlite3 .local/data/game-data.db "SELECT * FROM skills WHERE id = 164;"

# Find all capabilities for a skill
sqlite3 .local/data/game-data.db "SELECT * FROM capabilities WHERE skill_id = 164;"

# Find a capability by id
sqlite3 .local/data/game-data.db "SELECT * FROM capabilities WHERE id = 1328;"

# Find all entities of a type
sqlite3 .local/data/game-data.db "SELECT id, name, type FROM entities WHERE type = 'character';"
```

---

## Schema

### entities

| Column               | Type                     | Notes                                                     |
| -------------------- | ------------------------ | --------------------------------------------------------- |
| id                   | integer PK AUTOINCREMENT |                                                           |
| game_id              | integer UNIQUE           |                                                           |
| name                 | text NOT NULL            |                                                           |
| type                 | text NOT NULL            | `character`, `weapon`, `echo`, `echo_set`                 |
| icon_url             | text                     |                                                           |
| rank                 | integer                  |                                                           |
| weapon_type          | text                     |                                                           |
| description          | text                     |                                                           |
| attribute            | text                     | `glacio`, `fusion`, `electro`, `spectro`, `aero`, `havoc` |
| echo_set_ids         | text                     | JSON array                                                |
| set_bonus_thresholds | text                     | JSON array                                                |
| cost                 | integer                  |                                                           |
| created_at           | integer NOT NULL         | Unix timestamp                                            |
| updated_at           | integer NOT NULL         | Unix timestamp                                            |

### skills

| Column      | Type                              | Notes                  |
| ----------- | --------------------------------- | ---------------------- |
| id          | integer PK AUTOINCREMENT          |                        |
| entity_id   | integer NOT NULL FK → entities.id |                        |
| game_id     | integer                           |                        |
| name        | text NOT NULL                     |                        |
| description | text                              |                        |
| icon_url    | text                              |                        |
| origin_type | text NOT NULL                     | See origin types below |
| created_at  | integer NOT NULL                  | Unix timestamp         |
| updated_at  | integer NOT NULL                  | Unix timestamp         |

**origin_type values:** `Normal Attack`, `Resonance Skill`, `Resonance Liberation`, `Inherent Skill`, `Intro Skill`, `Forte Circuit`, `Outro Skill`, `Tune Break`, `Echo`, `Echo Set`, `Weapon`, `Base Stats`, `s1`–`s6`

### capabilities

| Column          | Type                            | Notes                                             |
| --------------- | ------------------------------- | ------------------------------------------------- |
| id              | integer PK AUTOINCREMENT        |                                                   |
| skill_id        | integer NOT NULL FK → skills.id |                                                   |
| name            | text                            | Optional label                                    |
| description     | text                            | Relevant subset of the parent skill's description |
| capability_type | text NOT NULL                   | `attack`, `modifier`, `permanent_stat`            |
| capability_json | text NOT NULL                   | JSON — see shapes below                           |
| created_at      | integer NOT NULL                | Unix timestamp                                    |
| updated_at      | integer NOT NULL                | Unix timestamp                                    |

---

## capability_json Shapes

### attack

```json
{
  "type": "attack",
  "scalingStat": "atk",
  "attribute": "glacio",
  "motionValues": [0.4871],
  "tags": ["basicAttack"]
}
```

- **scalingStat:** `atk`, `hp`, `def`
- **attribute:** `glacio`, `fusion`, `electro`, `spectro`, `aero`, `havoc`
- **motionValues:** array of multipliers (as decimals, e.g. 48.71% → 0.4871)

### modifier

```json
{
  "type": "modifier",
  "target": "self",
  "modifiedStats": [{ "stat": "damageBonus", "value": 0.2, "tags": ["resonanceSkill"] }]
}
```

- **target:** `self`, `activeCharacter`, `team`, `enemy`

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

## Stat Names

Valid for both `permanent_stat.stat` and `modifier.modifiedStats[].stat`:

See the enums in `/Users/david/Code/wuwa-rotation-builder/src/types/character.ts` and `/Users/david/Code/wuwa-rotation-builder/src/types/enemy.ts`

---

## Common Tags

- **Skill types:** `basicAttack`, `resonanceSkill`, `resonanceLiberation`, `introSkill`, `outroSkill`, `forteCircuit`, `coordinatedAttack`
- **Scope:** `all` (applies to all damage)
- Arbitrary strings from attack capability names are also valid tags (e.g. `"Ice Burst (Ice Prism)"`)

---

## Insert Examples

You should only ever need to update capabilities. Entities and skills are fully generated through data pipelines.

### New permanent_stat capability

```bash
sqlite3 .local/data/game-data.db "
INSERT INTO capabilities (created_at, updated_at, skill_id, name, description, capability_type, capability_json)
VALUES (
  strftime('%s', 'now'), strftime('%s', 'now'),
  164, NULL,
  'Increase the Resonator''s Coordinated Attack DMG by 80%.',
  'permanent_stat',
  '{\"type\":\"permanent_stat\",\"stat\":\"damageBonus\",\"value\":0.8,\"tags\":[\"coordinatedAttack\"]}'
);"
```

### New modifier capability

```bash
sqlite3 .local/data/game-data.db "
INSERT INTO capabilities (created_at, updated_at, skill_id, name, description, capability_type, capability_json)
VALUES (
  strftime('%s', 'now'), strftime('%s', 'now'),
  164, NULL,
  'Upon a critical hit of Coordinated Attack, increase the active Resonator''s ATK by 20% for 4s.',
  'modifier',
  '{\"type\":\"modifier\",\"target\":\"activeCharacter\",\"modifiedStats\":[{\"stat\":\"attackScalingBonus\",\"value\":0.2,\"tags\":[\"all\"]}]}'
);"
```

### Update capability_json field

```bash
sqlite3 .local/data/game-data.db \
  "UPDATE capabilities SET capability_json = json_set(capability_json, '$.target', 'activeCharacter') WHERE id = 1328;"
```

### Update description

```bash
sqlite3 .local/data/game-data.db \
  "UPDATE capabilities SET description = 'New description.' WHERE id = 1328;"
```

---

## Validation

Always run after making changes:

```bash
npm run db:validate
```

Expected output: `✓ All records are valid!` with 0 invalid records.

The validator checks entities, skills, and capabilities against their schemas. Fix any reported errors before finishing.
