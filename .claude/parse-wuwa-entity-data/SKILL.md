# Skill: parse_wuwa_entity_data

You are a specialized data transformation agent for Wuthering Waves. Your goal is to map raw JSON data from the API into our project-specific TypeScript schemas. You must identify the entity type and apply the appropriate extraction logic defined below.

## 1. Universal Standards

### Reference Schemas

- **All:** `/Users/david/Code/wuwa-rotation-builder/src/db/schema.ts, /Users/david/Code/wuwa-rotation-builder/src/schemas/admin/store-types.ts`. Use these two as the primary source of truth for what your output should look like

You may query examples of the current data from SQLLite with:

```sql
"SELECT attacks.*, entities.game_id, entities.name  FROM attacks JOIN entities ON attacks.entity_id = entities.id WHERE entities.game_id = {{id}}"
```

### Data Paths & Acquisition

| Entity Type   | Raw Path (`.local/data/encore.moe/transformed...`) | Parsed Path (`.local/data/encore.moe/transformed...`) |
| :------------ | :------------------------------------------------- | :---------------------------------------------------- |
| **Character** | `character-ai/{id}.json`                           | `character-ai-out/{id}.json`                          |
| **Echo**      | `echo-ai/{id}.json`                                | `character-ai-out/{id}.json`                          |
| **Echo Set**  | `echo-set-ai/{id}.json`                            | `character-ai-out/{id}.json`                          |
| **Weapon**    | `weapon-ai/{id}.json`                              | `character-ai-out/{id}.json`                          |

### General Stat Mapping

- **Values:** Convert all percentage strings (e.g., `"12%"`) to decimal numbers (e.g., `0.12`).
- **Keys:**
  - `ATK`/`DEF`/`HP`: Map to `*Flat` if absolute, or `*ScalingBonus` if percentage.
  - `Crit`: Map to `criticalRate` or `criticalDamage`.
  - `DMG Bonus`: Map to `damageBonus` and **always** append specific tags (e.g., `["aero"]`, `["basicAttack"]`).
  - Damage amplification bonuses and damage multiplier bonuses are generally explicitly stated with "ampli.." or "damage multiplier" keywords in descriptions. If these keywords are missing, a damage bonus is typically a regular damageBonus

## 2. Entity-Specific Quirks

### A. Character Logic

- **Attacks:**
  - **Tags:** Use primary category tags: `basicAttack`, `heavyAttack`, `resonanceSkill`, `resonanceLiberation`, `intro`, `outro`.
  - **Restriction:** NEVER tag an attack with its own name. The service handles skill-specific logic automatically.
  - **Damage Type Overrides:** If the description states damage is "considered as [Type] DMG", use `[Type]` for the primary tag (e.g., `basicAttack`) instead of the origin type (e.g., `resonanceSkill`), as these tags are mutually exclusive.
  - **Scaling:** Map `abilityAttribute` to `atk`, `def`, or `hp` (lowercase).
  - **Upgrades:** If a Sequence (S1-S6) replaces or significantly changes an attack's motion values or a modifier's stats, use the `alternativeDefinitions` field in the base capability entry. Key each alternative by the sequence level (e.g., `"s1"`, `"s6"`).
- **Modifiers & Permanent Stats:**
  - **Targeting:** `self` (default), `activeCharacter` (on-field only), `team`, or `enemy`. Note: `defenseIgnore` is a character stat and should target `self`.
  - **Tags:** ALWAYS tag with specific skill names (e.g., `["Art of Violence"]`) if the effect applies only to those skills (common for `damageMultiplierBonus`).
  - **Versioning & alternativeDefinitions:** Use `alternativeDefinitions` to handle Sequence upgrades (S1-S6) that modify or replace existing effects.
    - **Replacement:** If a sequence _upgrades_ an existing effect (e.g., S3 increases a percentage or adds a new stat to the same trigger), add an entry to `alternativeDefinitions` keyed by the sequence.
    - **Cumulative Behavior:** Each entry in `alternativeDefinitions` MUST contain the _full_ set of fields (e.g., the complete `modifiedStats` array) for that sequence level, ensuring the rotation calculator sees the correct total values when that sequence is unlocked.
    - **Additive Splitting:** Only split an effect into multiple separate base entries if the base effect is _always_ active (e.g., a passive) and the sequence adds a _conditional_ bonus (e.g., a temporary buff) that doesn't replace the passive part.
  - **Stackable Buffs:** If a buff stacks (e.g., "up to 3 times"), use a `UserParameterizedNumber`. Use key `"0"` in `parameterConfigs` for the stack count, set `scale` to the per-stack value, and `maximum` to the max number of stacks.
  - **Exclusions:** Omit modifiers that only restore flat energy or affect mechanics not tracked in stats (like hit counts, dodge refreshes, character-specific mechanics, healing).

### B. Echo Logic

- **Attacks:**
  - **Tags:** Always include `["echoSkill"]` + the Element tag.

### C. Weapon Logic (`parse_wuwa_weapon_data`)

- **Refine-Scalable Format:**
  - Values that scale linearly with refinement use `RefineScalableNumber`: `{ base: number, increment: number }`.
  - The resolved value at runtime is: `base + (refineLevel - 1) * increment`.
  - Values that do NOT scale across refinement levels remain as plain numbers.
- **Passives:**
  - **Differentiation:**
    - _Unconditional_ (e.g., "ATK +12%") -> `permanentStats` with `RefineScalableNumber` value.
    - _Conditional_ (e.g., "After using Skill...") -> `modifiers` with `RefineScalableNumber` value.
  - **Scaling Calculation:** Given raw Rank values `[r1, r2, r3, r4, r5]`:
    - `base` = `r1` (the Rank 1 value)
    - `increment` = `r2 - r1` (the per-rank increase, assuming linear scaling)
  - **Stackable Buffs:** For `UserParameterizedNumber` values, the `scale` field inside `parameterConfigs` should be a `RefineScalableNumber` if it scales with refinement.

**Example RefineScalableNumber:**

```json
{
  "stat": "attackScalingBonus",
  "value": { "base": 0.12, "increment": 0.03 },
  "tags": ["all"]
}
```

This resolves to 0.12 at R1, 0.15 at R2, 0.18 at R3, 0.21 at R4, 0.24 at R5.

**Example with UserParameterizedNumber:**

```json
{
  "stat": "attackScalingBonus",
  "value": {
    "parameterConfigs": {
      "0": {
        "scale": { "base": 0.04, "increment": 0.01 },
        "minimum": 0,
        "maximum": 4
      }
    }
  },
  "tags": ["all"]
}
```

The `scale` resolves to 0.04 at R1, 0.05 at R2, etc., while `minimum` and `maximum` remain constant.

## 3. Formatting & Validation

1.  **Verbatim Text:** `description` fields must be populated with a subsequence of the skill description.
2.  **Strict Typing:** Do not invent fields. If it's not in the Type definition, do not include it.
3.  Error Flagging: If raw data uses non-standard scaling or ambiguous phrasing, flag it to the user.
4.  Your output for a single entity should be a JSON file with modifiers, attacks, and permanent stats as fields, each conforming to the schemas defined above
