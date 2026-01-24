---
name: parse_wuwa_character_data
description: Transforms raw Hakushin API JSON data for Wuthering Waves characters into the project's internal structured Character format. Use this when I provide a raw JSON file or a Hakushin ID.
---

# Skill: parse_wuwa_character_data

You are a specialized data transformation agent. Your goal is to map raw character data from Hakushin into our project-specific TypeScript schema.

## Reference Materials

- **Output Schema:** `src/services/game-data/character/types.ts`
- **Gold Standard Example:** `.local/data/character/parsed/1209.json` (Mornye)

## 1. Data Acquisition & Paths

- **Raw Storage:** `.local/data/character/raw/{id}.json`
- **Parsed Storage:** `.local/data/character/parsed/{id}.json`
- If the raw file is missing, you may use `curl -s https://api.hakush.in/ww/data/en/character/{id}.json` to fetch it.

## 2. Extraction Logic

### Attack Mapping (`attacks`)

- **Filter:** Iterate `SkillTrees`. Include ONLY nodes that deal numerical damage.
- **Motion Values:** - Source: `RateLv[9]` (Level 10).
  - Formula: Value / 10000.
  - Type: Always `Array<number>`.
- **Scaling:** Map `RelatedProperty` to `AbilityAttribute`. Use lowercase: `"atk"`, `"def"`, or `"hp"` (NOT `"hpFlat"`).
- **Tags:** Categorize using `basicAttack`, `resonanceSkill`, `resonanceLiberation`, `intro`, `outro`, `aerial`, `tuneRupture`, `tuneStrain`.
- **Unlocks:** Only include `unlockedAt` for sequences (`"s1"`-`"s6"`). Omit for base kit.

### Modifier Mapping (`modifiers`)

- **Condition:** Include effects with a duration (e.g., "for 10s") or stack-based triggers.
- **Targeting:** - `self`: Character-specific (even off-field).
  - `activeCharacter`: On-field character only.
  - `team`: Entire party.
- **Dynamic Scaling:** Use `RotationRuntimeResolvableNumber` or `UserParameterizedNumber` from `@/types/parameterized-number` for values that scale based on stacks or other variables.
- **Upgrades:** Use `disabledAt` on base modifiers if a higher sequence (e.g., S3) replaces the functionality.

### Stat Mapping (`stats`)

- **Level 90 Base:** Extract from `Stats["6"]["90"]`. Map to `hpFlat`, `attackFlat`, `defenseFlat`.
- **Permanent Buffs:** Map `NodeType: 4` and unconditional Inherent Skills (no duration/conditions) to the `stats` record.

## 3. Formatting Rules

- **Verbatim Text:** Descriptions in the `description` field MUST be exact chunks from `Skill.Desc`.
- **Strict Types:** Follow the `Character` interface strictly. If a field is not in the schema, do not include it.

## 4. Error Handling

If the raw data contains non-standard scaling or ambiguous descriptions, flag these to the user after generating the JSON.
