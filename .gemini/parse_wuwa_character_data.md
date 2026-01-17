# Skill: parse_wuwa_character_data

Transform raw Hakushin API character data into the project's structured `Character` format. Refer to `src/services/game-data/character/types.ts` for the definitive output data structure and **`src/services/game-data/data/character/parsed/1209.json` (Mornye)** as the gold-standard reference for implementation details.

## 1. Data Acquisition

- **Command:** `curl -s https://api.hakush.in/ww/data/en/character/{id}.json > src/services/game-data/data/character/raw/{id}.json`
- **Raw Storage:** `src/services/game-data/data/character/raw/{id}.json`
- **Parsed Storage:** `src/services/game-data/data/character/parsed/{id}.json`

## 2. Character Level Fields

- **attribute:** The elemental attribute of the character (e.g., `"fusion"`, `"spectro"`).

## 3. Attack Mapping (`attacks`)

- Iterate through all `SkillTrees` nodes.
- **Filtering:** ONLY include damage-dealing instances. If an entry (e.g., a heal) does not actually deal numerical damage to enemies (motion value 0), do NOT include it.
- Map entries belonging to the same stage (e.g., "Basic Attack Stage 1") to a single attack object.
- **motionValues:** ALWAYS an `Array<number>`.
  - Divide `RateLv[9]` (Level 10) by `10000` for each static hit.
- **parameterizedMotionValues:** `Array<UserParameterizedNumber>`.
  - Import types from `@/types/parameterized-number`.
  - Use this for hits that scale with user-defined inputs (e.g., Jinhsi's Incandescence stacks).
- **Scaling Stat:** Map `RelatedProperty` to `AbilityAttribute` (lowercase: `"atk"`, `"def"`, or `"hp"`).
  - **Correction:** Use `"hp"`, NOT `"hpFlat"`.
- **Tags:** Include categorization tags (e.g., `basicAttack`, `resonanceSkill`, `resonanceLiberation`, `intro`, `outro`, `aerial`, `tuneRupture`, `tuneStrain`).
- **Base Fields:**
  - `unlockedAt`: Omit if this is part of the base kit (unlocked by default). Only use `"s1"` through `"s6"`.
  - `originType`: Map to the raw data's Skill Type (e.g., "Normal Attack", "Resonance Skill", "Forte Circuit").
  - `parentName`, `name`.
- **description:** MUST be select verbatim chunks of the actual descriptions from the raw JSON (`Skill.Desc`).

## 4. Modifier Mapping (`modifiers`)

- **Scope:** ONLY temporary or conditional effects (e.g., buffs with durations like "for 10s", stack-based effects that fall off).
- **Duration Rule:** If a skill or sequence description specifies a duration (e.g., "for X seconds"), it MUST be a modifier, even if it is a "permanent" upgrade to a skill's behavior.
- **Exclusion:**
  - If a skill or passive provides a permanent, unconditional stat increase, map it to `stats` instead.
  - Do NOT include healing-specific multipliers (e.g., "increases healing of skill X by 20%") unless they affect a damage-related stat.
- **Target:** Use `self` for buffs that only apply to the character themself (even when off-field), `activeCharacter` for buffs that only apply to whoever is currently on-field, and `team` for buffs applying to everyone.
- **Tags:** MUST represent what is being buffed.
- **Stat Values:** Use `RotationRuntimeResolvableNumber` or `UserParameterizedNumber` from `@/types/parameterized-number` when values scale dynamically.
- **RotationRuntimeResolvableNumber Structure:**
  ```json
  {
    "resolveWith": "CharacterName",
    "parameterConfigs": {
      0: {
        "scale": number,
        "minimum": number,
        "maximum": number,
        "offset": number
      }
    },
    "offset": number,
    "minimum": number,
    "maximum": number
  }
  ```
- **Replacements (`disabledAt`):** Use `disabledAt` on the base version when a sequence (e.g., S3) replaces/upgrades it significantly.

## 5. Stat Mapping (`stats`)

- **Structure:** `Record<keyof CharacterStats, Array<(StatValue | UserParameterizedNumber) & Tagged & Base>>`.
- **Base Stats (Level 90):** Extract from `Stats["6"]["90"]`. Map to `hpFlat`, `attackFlat`, `defenseFlat`.
- **OriginType for Base Stats:** Use `"Base Stats"`.
- **Permanent Bonuses:** Include Skill Tree nodes (`NodeType: 4`) AND any unconditional Inherent Skills/Sequences that provide permanent stat increases (no duration, no condition). Tag these with `["all"]` or specific skill tags if applicable.

## 6. Validation

- **Auto-Improvement:** If you receive feedback that an output was incorrect, specifically analyze _why_ it was incorrect and update these instructions to prevent recurrence.
