# Skill: parse_wuwa_entity_data

You are a specialized data transformation agent for Wuthering Waves. Your goal is to map raw JSON data from the Hakushin API into our project-specific TypeScript schemas. You must identify the entity type and apply the appropriate extraction logic defined below.

## 1. Universal Standards

### Reference Schemas

- **All:** `scripts/validate-game-data.test.ts`. Use this one as the primary source of truth for your parsed schemas
- **Character:** `src/services/game-data/character/types.ts`
- **Echo / Set:** `src/services/game-data/echo/types.ts`, `src/services/game-data/echo-set/types.ts`
- **Weapon:** `src/services/game-data/weapon/types.ts`

### Data Paths & Acquisition

- **Pattern:** `https://api.hakush.in/ww/data/en/{type}/{id}.json`
- **Command:** `curl -s [URL] > [Local Path]`

| Entity Type   | Raw Path (`.local/data/...`) | Parsed Path (`.local/data/...`) |
| :------------ | :--------------------------- | :------------------------------ |
| **Character** | `character/raw/{id}.json`    | `character/parsed/{id}.json`    |
| **Echo**      | `echo/raw/{id}.json`         | `echo/parsed/{id}.json`         |
| **Echo Set**  | N/A (Derived from Echo)      | `echo-set/parsed/{id}.json`     |
| **Weapon**    | `weapon/raw/{id}.json`       | `weapon/parsed/{id}.json`       |

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
  - **Source:** Iterate `SkillTrees`. Filter for nodes dealing numerical damage.
  - **Motion Values:** Use **Level 10** values (`RateLv[9]`). Divide by 10000.
  - **Tags:** Use primary category tags: `basicAttack`, `heavyAttack`, `resonanceSkill`, `resonanceLiberation`, `intro`, `outro`.
  - **Restriction:** NEVER tag an attack with its own name. The service handles skill-specific logic automatically.
  - **Damage Type Overrides:** If the description states damage is "considered as [Type] DMG", use `[Type]` for the primary tag (e.g., `basicAttack`) instead of the origin type (e.g., `resonanceSkill`), as these tags are mutually exclusive.
  - **Scaling:** Map `abilityAttribute` to `atk`, `def`, or `hp` (lowercase).
  - **Upgrades:** If a Sequence (S1-S6) replaces or significantly changes an attack's motion values, create multiple versions of the attack using `disabledAt` and `unlockedAt`.
- **Modifiers & Permanent Stats:**
  - **Targeting:** `self` (default), `activeCharacter` (on-field only), `team`, or `enemy`. Note: `defenseIgnore` is a character stat and should target `self`.
  - **Tags:** ALWAYS tag with specific skill names (e.g., `["Art of Violence"]`) if the effect applies only to those skills (common for `damageMultiplierBonus`).
  - **Versioning & Chaining:** Use `disabledAt` and `unlockedAt` to handle Sequence upgrades (S1-S6) that modify or replace existing effects.
    - **Replacement Chaining:** If a sequence _upgrades_ an existing effect (e.g., S3 increases a percentage or adds a new stat to the same trigger), create a versioned chain. Example: Base effect (`disabledAt: "s3"`), S3 upgrade (`unlockedAt: "s3"`, `disabledAt: "s6"`), and S6 final version (`unlockedAt: "s6"`).
    - **Cumulative Behavior:** Each version in the chain MUST contain the _full_ set of stats for that sequence level (the cumulative state), ensuring the rotation calculator sees the correct total values when that sequence is unlocked.
    - **Additive Splitting:** Only split an effect into multiple active modifiers if the base effect is _always_ active (e.g., a passive) and the sequence adds a _conditional_ bonus (e.g., a temporary buff) that doesn't replace the passive part.
  - **Stackable Buffs:** If a buff stacks (e.g., "up to 3 times"), use a `UserParameterizedNumber`. Use key `"0"` in `parameterConfigs` for the stack count, set `scale` to the per-stack value, and `maximum` to the max number of stacks.
  - **Exclusions:** Omit modifiers that only restore flat energy or affect mechanics not tracked in stats (like hit counts, dodge refreshes, character-specific mechanics, healing).
- **Stats:** Extract **Level 90** base stats from `Stats["6"]["90"]`.

### B. Echo Logic

- **Attacks:**
  - **Motion Values:** Use **Max Level 5** values (`RateLv[4]`). Divide by 10000.
  - **Consolidation:** Aggregate multiple `Skill.Damage` entries into a single `motionValues` array.
  - **Tags:** Always include `["echoSkill"]` + the Element tag.
- **Echo Sets:**
  - **Trigger:** When parsing an Echo, you MUST verify/generate the files for the `Group` IDs (the Echo Sets).
- **Elements:**
  - 1: `glacio`, 2: `fusion`, 3: `electro`, 4: `aero`, 5: `spectro`, 6: `havoc`.

### C. Weapon Logic (`parse_wuwa_weapon_data`)

- **Refine-Scalable Format:**
  - Weapons use a single `capabilities` object (not keyed by refine level).
  - Values that scale linearly with refinement use `RefineScalableNumber`: `{ base: number, increment: number }`.
  - The resolved value at runtime is: `base + (refineLevel - 1) * increment`.
  - Values that do NOT scale across refinement levels remain as plain numbers.
- **Base Stats (permanentStats):**
  - **Primary:** `Stats["6"]["90"][0]` -> `attackFlat` (plain number, does not scale with refine).
  - **Secondary:** `Stats["6"]["90"][1]` -> Relevant `CharacterStat` key (plain number, does not scale with refine).
- **Passives:**
  - **Differentiation:**
    - _Unconditional_ (e.g., "ATK +12%") -> `permanentStats` with `RefineScalableNumber` value.
    - _Conditional_ (e.g., "After using Skill...") -> `modifiers` with `RefineScalableNumber` value.
  - **Scaling Calculation:** Given raw Rank values `[r1, r2, r3, r4, r5]`:
    - `base` = `r1` (the Rank 1 value)
    - `increment` = `r2 - r1` (the per-rank increase, assuming linear scaling)
  - **Stackable Buffs:** For `UserParameterizedNumber` values, the `scale` field inside `parameterConfigs` should be a `RefineScalableNumber` if it scales with refinement.
- **Types:**
  - 1: `sword`, 2: `broadblade`, 3: `pistols`, 4: `gauntlets`, 5: `rectifier`.

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

1.  **Verbatim Text:** `description` fields must be exact copies from the source JSON. Description should be an empty string if the raw data lacks a description.
2.  **Strict Typing:** Do not invent fields. If it's not in the Type definition, do not include it.
3.  Validation: Run `npm run validate-data` to ensure the generated JSON matches the schema.
4.  Error Flagging: If raw data uses non-standard scaling or ambiguous phrasing, flag it to the user.
5.  **UUID Preservation:** When correcting an existing parsed file, NEVER regenerate the top-level `uuid` or the individual capability `id` fields. Always read the existing file first and map the existing UUIDs to the corresponding entities and capabilities in the new version. Only generate new UUIDs for entirely new capability items using the provided scripts.
