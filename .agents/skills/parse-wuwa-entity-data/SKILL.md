# Skill: parse_wuwa_entity_data

You are a specialized data transformation agent for Wuthering Waves. Your goal is to map raw JSON data from the API into our project-specific TypeScript schemas. You must identify the entity type and apply the appropriate extraction logic defined below.

### 1. Universal Standards

### Reference Schemas & Data

- **Schemas:** `/Users/david/Code/wuwa-rotation-builder/src/db/schema.ts, /Users/david/Code/wuwa-rotation-builder/src/schemas/database.ts`. Use these as the primary source of truth.
- **Vetted Data:** ALWAYS query examples of the current data from PostgreSQL for reference before parsing. This data has been vetted and should guide your naming and tagging:
  ```sql
  SELECT capability_id, capability_json, entity_name, skill_name
  FROM full_capabilities
  WHERE entity_game_id = {{id}}
  ORDER BY skill_id, capability_id;
  ```
- **Game IDs:** Include a `gameId` field only if the raw data provides a specific sub-attribute ID (e.g., `1106001` for a specific attack stage). If the only ID available is the parent skill or resonant chain node ID, leave `gameId` blank (null or omit it) to avoid redundancy with `skillId`. `gameId` is NOT a required field.
- **Skill IDs:** ALWAYS include a `skillId` field for every attack, modifier, and permanent stat. Use the `id` of the parent skill (from the `skills` array) or the resonant chain node (from the `resonantChain` array) where the capability was found.
- **Modifiers vs. Permanent Stats:**
  - **`permanentStats`:** Use for unconditional, "always-on" bonuses once unlocked (e.g., "Crit. DMG is increased by 100%" or "ATK +15%").
  - **`modifiers`:** Use for conditional bonuses (e.g., "After casting Skill...", "When HP is below 70%", "When hitting a target marked with...").

### Data Paths & Acquisition

| Entity Type   | Raw Path (`.local/data/encore.moe/transformed...`) |
| :------------ | :------------------------------------------------- |
| **Character** | `character-ai/{id}.json`                           |
| **Echo**      | `echo-ai/{id}.json`                                |
| **Echo Set**  | `echo-set-ai/{id}.json`                            |
| **Weapon**    | `weapon-ai/{id}.json`                              |

### General Stat Mapping

- **Values:** Convert all percentage strings (e.g., `"12%"`) to decimal numbers (e.g., `0.12`).
- **Current Number Schemas:** Use the number types from `src/schemas/database.ts`.
  - **`DatabaseLeafNumber`:** Use either a plain number or a refine-scalable object: `0.12` or `{ "base": 0.12, "increment": 0.03 }`.
  - **`DatabaseUserNumber`:** Use a plain/refine-scalable number or a user input leaf:
    ```json
    {
      "type": "userParameterizedNumber",
      "parameterId": "0",
      "scale": 1,
      "minimum": 0,
      "maximum": 4
    }
    ```
  - **`DatabaseNumberNode`:** For stat-scaled or composed values, use expression trees with `sum`, `product`, `clamp`, `conditional`, and `statParameterizedNumber`.
  - **Important restriction:** `attacks[].damageInstances[].motionValue` is `DatabaseUserNumber` only. Do not emit `sum`, `product`, `clamp`, `conditional`, or `statParameterizedNumber` under `motionValue`.
- **Keys:**
  - `ATK`/`DEF`/`HP`: Map to `*Flat` if absolute, or `*ScalingBonus` if percentage.
  - `Crit`: Map to `criticalRate` or `criticalDamage`.
  - `DMG Bonus`:
    - **`damageBonus` (Most Common):** Default for "increases [Type] DMG" or "[Type] DMG Bonus +X%". Always append specific tags (e.g., `["aero"]`, `["basicAttack"]`).
    - **`damageMultiplierBonus`:** ONLY use if the description explicitly mentions "damage multiplier" (e.g., "increases the damage multiplier of...").
    - **`finalDamageBonus` (Very Rare):** Generally reserved for high-level Resonant Chains (S4-S6) or extremely specific late-game effects.
  - Damage amplification bonuses are explicitly stated with "amplified" keywords.

## 2. Entity-Specific Quirks

### A. Character Logic

- **Attacks:**
  - **Description:** ALWAYS include a `description` field. Sourcing it from a concise, relevant subset of the original skill description (e.g., "perform up to 5 consecutive attacks, dealing Aero DMG").
  - **Shape:** Attacks now use `damageInstances`, not `motionValues`. Each entry must include `motionValue`, `attribute`, `damageType`, `tags`, and `scalingStat`:
    ```json
    {
      "motionValue": 0.4871,
      "attribute": "aero",
      "damageType": "basicAttack",
      "tags": [],
      "scalingStat": "atk"
    }
    ```
  - **Required fields:** `attribute` and `damageType` are REQUIRED per damage instance. Never use top-level attack `attribute`.
  - **Classification source of truth:** Put the primary classification in `damageType` (for example `basicAttack`, `resonanceSkill`, `echo`, `outro`) and element in `attribute`.
  - **Tags:** Keep `tags` for supplemental qualifiers only (for example `coordinatedAttack`, `aerial`, character-specific tags). Do not duplicate `attribute`/`damageType` in `tags`; runtime injects those automatically.
  - **Restriction:** NEVER tag an attack with its own name. The service handles skill-specific logic automatically.
  - **Scaling:** Map `attackScalingProperty` to `atk`, `def`, `hp`, `fixed`, `tuneRuptureAtk`, `tuneRuptureHp`, or `tuneRuptureDef` as needed.
  - **Upgrades:** If a Sequence (S1-S6) replaces or significantly changes an attack's `damageInstances` or a modifier's stats, use the `alternativeDefinitions` field in the base capability entry. Key each alternative by the sequence level (e.g., `"s1"`, `"s6"`).
- **Modifiers & Permanent Stats:**
  - **Description:** ALWAYS include a `description` field, using a relevant subset of the skill description that explains the effect.
  - **Modifier vs Permanent Stat** A permanent stat can not be configured by a user. It generally represents a buff or debuff that is ALWAYS active, regardless of user configuration. A modifier is configurable by a user for when it is active. Modifiers descriptions will include descriptions on when they are active.
  - **Targeting:** `target` is per modified stat. Every `modifiedStats[]` entry MUST include `target` (`self`, `activeCharacter`, `team`, or `enemy`).
    - Mixed-target effects (for example self + team from one trigger) should be a single modifier capability with multiple `modifiedStats` entries that each carry their own target.
    - `defenseIgnore` is a character stat and should target `self`, `activeCharacter`, or `team`; `defenseReduction` is an enemy stat and should target `enemy`.
  - **Tags:** `modifiedStats[].tags` should represent the tags an attack must have for the modifier to affect that attack during damage calculation.
    - Use `["all"]` for broad buffs that should apply to any qualifying attack once the modifier is active (for example a general team buff).
    - Use category tags like `["basicAttack"]`, `["resonanceSkill"]`, or element tags when the effect is restricted to those attack classes.
    - Use specific names of attack capabilities only when the effect truly applies only to that attack
  - **Versioning & alternativeDefinitions:** Use `alternativeDefinitions` to handle Sequence upgrades (S1-S6) that modify or replace existing effects.
    - **Replacement:** If a sequence _upgrades_ an existing effect (e.g., S3 increases a percentage or adds a new stat to the same trigger), add an entry to `alternativeDefinitions` keyed by the sequence.
    - **Cumulative Behavior:** Each entry in `alternativeDefinitions` MUST contain the full replacement `modifiedStats` array (including per-stat `target`) for that sequence level.
    - **Additive Splitting:** Only split an effect into multiple separate base entries if the base effect is _always_ active (e.g., a passive) and the sequence adds a _conditional_ bonus (e.g., a temporary buff) that doesn't replace the passive part.
  - **Stackable Buffs:** If a buff stacks (e.g., "up to 3 times"), do not use the old `parameterConfigs` shape. Use the current node format.
    - For a pure stack count that directly becomes the value, use:
      ```json
      {
        "type": "userParameterizedNumber",
        "parameterId": "0",
        "minimum": 0,
        "maximum": 3
      }
      ```
    - For "per-stack amount x stacks", use a `product` node:
      ```json
      {
        "type": "product",
        "operands": [
          0.15,
          {
            "type": "userParameterizedNumber",
            "parameterId": "0",
            "minimum": 0,
            "maximum": 3
          }
        ]
      }
      ```
  - **Stat-Scaled Buffs:** If an effect scales with a tracked stat (for example Energy Regen or Crit Rate), use a `statParameterizedNumber` inside a `DatabaseNumberNode` expression tree
  - **Exclusions:** Omit modifiers that only restore flat energy or affect mechanics not tracked in stats (like hit counts, dodge refreshes, character-specific mechanics, healing).

### B. Echo Logic

- **Attacks:**
  - For normal Echo activation damage, use `damageType: "echo"` and set `attribute` per damage instance.
  - If an Echo has a separate trigger variant (for example damage triggered by Outro), model it as a separate attack capability (or an explicit alternate definition when it truly replaces the base attack), with its own `damageType` and `attribute`.
  - Keep `tags` minimal unless there is a true supplemental qualifier.

### C. Weapon Logic (`parse_wuwa_weapon_data`)

- **Refine-Scalable Format:**
  - Values that scale linearly with refinement use `DatabaseRefineScalableNumber`: `{ "base": number, "increment": number }`.
  - The resolved value at runtime is: `base + (refineLevel - 1) * increment`.
  - Values that do NOT scale across refinement levels remain as plain numbers.
- **Passives:**
  - **Differentiation:**
    - _Unconditional_ (e.g., "ATK +12%") -> `permanentStats` with `RefineScalableNumber` value.
    - _Conditional_ (e.g., "After using Skill...") -> `modifiers` with `RefineScalableNumber` value.
  - **Scaling Calculation:** Given raw Rank values `[r1, r2, r3, r4, r5]`:
    - `base` = `r1` (the Rank 1 value)
    - `increment` = `r2 - r1` (the per-rank increase, assuming linear scaling)
  - **Stackable Buffs:** Do not use the removed `parameterConfigs.scale` pattern. If a stackable weapon passive scales with refinement, use a `product` node whose scalar operand is a `DatabaseRefineScalableNumber`, and whose other operand is a `userParameterizedNumber`.

**Example RefineScalableNumber:**

```json
{
  "stat": "attackScalingBonus",
  "value": { "base": 0.12, "increment": 0.03 },
  "tags": ["all"]
}
```

This resolves to 0.12 at R1, 0.15 at R2, 0.18 at R3, 0.21 at R4, 0.24 at R5.

**Example with User-Parameterized Weapon Stacks:**

```json
{
  "stat": "attackScalingBonus",
  "value": {
    "type": "product",
    "operands": [
      { "base": 0.04, "increment": 0.01 },
      {
        "type": "userParameterizedNumber",
        "parameterId": "0",
        "minimum": 0,
        "maximum": 4
      }
    ]
  },
  "tags": ["all"]
}
```

The refine-scalable operand resolves to 0.04 at R1, 0.05 at R2, etc. The user node is the stack count.

## 3. Formatting & Validation

1.  **Verbatim Text:** `description` fields must be populated with a subsequence of the skill description.
2.  **Escape Quotes:** ALWAYS escape double quotes within `description` strings (e.g., `\"Frostbite\"`) to ensure the resulting JSON is valid.
3.  **Strict Typing:** Do not invent fields. If it's not in the Type definition, do not include it.
4.  **Error Flagging:** If raw data uses non-standard scaling or ambiguous phrasing, flag it to the user.
5.  **Validation:** ALWAYS validate against the current schemas after changing parsed data.
    - For database-backed capability JSON: `npm run db:validate`
    - For served local game-data checks: `npm run validate-data`

Your output for a single entity should be a JSON file with modifiers, attacks, and permanent stats as fields, each conforming to the schemas defined above.
