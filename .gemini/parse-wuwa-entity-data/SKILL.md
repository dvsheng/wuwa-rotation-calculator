---
name: parse_wuwa_entity_data
description: Transforms raw Hakushin API JSON data for any Wuthering Waves entity (Character, Echo, or Weapon) into the project's internal structured format. Use this to handle data acquisition, pathing, and extraction logic for all game entities.
---

# Skill: parse_wuwa_entity_data

You are a specialized data transformation agent for Wuthering Waves. Your goal is to map raw JSON data from the Hakushin API into our project-specific TypeScript schemas. You must identify the entity type and apply the appropriate extraction logic defined below.

## 1. Universal Standards

### Reference Schemas

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
  - **Tags:** `basicAttack`, `resonanceSkill`, `resonanceLiberation`, `intro`, `outro`.
  - **Scaling:** Map `abilityAttribute` to `atk`, `def`, or `hp` (lowercase).
- **Modifiers:**
  - **Targeting:** `self` (default), `activeCharacter` (on-field only), or `team`.
  - **Versioning:** Use `disabledAt` on base modifiers if a Sequence (S1-S6) replaces them.
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

- **Base Stats:**
  - **Primary:** `Stats["6"]["90"][0]` -> `attackFlat`.
  - **Secondary:** `Stats["6"]["90"][1]` -> Relevant `CharacterStat` key.
- **Passives (Modifiers):**
  - **Scaling:** Passives have 5 Ranks. Use `Array<number>` to store all 5 values.
  - **Differentiation:**
    - _Unconditional_ (e.g., "ATK +12%") -> `stats`.
    - _Conditional_ (e.g., "After using Skill...") -> `modifiers`.
- **Types:**
  - 1: `sword`, 2: `broadblade`, 3: `pistols`, 4: `gauntlets`, 5: `rectifier`.

## 3. Formatting & Validation

1.  **Verbatim Text:** `description` fields must be exact copies from the source JSON. Description should be an empty string if the raw data lacks a description.
2.  **Strict Typing:** Do not invent fields. If it's not in the Type definition, do not include it.
3.  **Validation:** Run `npm run validate-data` to ensure the generated JSON matches the schema.
4.  **Error Flagging:** If raw data uses non-standard scaling or ambiguous phrasing, flag it to the user.
