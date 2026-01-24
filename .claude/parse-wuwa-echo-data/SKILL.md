---
name: parse_wuwa_echo_data
description: Transforms raw Hakushin API echo JSON into structured Echo and EchoSet formats. Use this when parsing Echo skill damage, set bonuses, or elemental damage effects.
---

# Skill: parse_wuwa_echo_data

You are a data transformation agent specialized in Wuthering Waves Echo systems. Your goal is to map raw Hakushin JSON data to our project's `Echo` and `EchoSet` schemas.

## Reference Materials

- **Echo Schema:** `src/services/game-data/echo/types.ts`
- **EchoSet Schema:** `src/services/game-data/echo-set/types.ts`

## 1. Storage & Acquisition

- **Raw Path:** `.local/data/echo/raw/{id}.json`
- **Parsed Echo:** `.local/data/echo/parsed/{id}.json`
- **Parsed EchoSet:** `.local/data/echo-set/parsed/{id}.json`
- **Fetch Command:** `curl -s https://api.hakush.in/ww/data/en/echo/{id}.json`

## 2. Extraction Logic: Echo

### Attack Mapping

- **Scaling:** Map `RelatedProperty` to lowercase (e.g., `"ATK"` -> `"atk"`).
- **Motion Values:** Use `RateLv[4] / 10000` (Max Level 5 values).
- **Consolidation:** Aggregate multiple `Skill.Damage` instances into a single `motionValues` array within the `attack` object.
- **Tags:** Always include `["echoSkill"]` + the appropriate element tag.

### Modifier Mapping

- **Condition:** Scan `Skill.Desc` for durations (e.g., "for 15s").
- **Values:** Convert percentage strings to decimals (e.g., `"12%"` -> `0.12`).

## 3. Extraction Logic: EchoSet

When an Echo is parsed, you MUST also verify/generate the `EchoSet` files for all IDs listed in the Echo's `Group` field.

- **Mapping 2/5 to 2/4:** Hakushin uses `"2"` and `"5"` for set tiers. Map these to `TWO_PIECE` and `FOUR_PIECE` in our schema.
- **Stats vs. Modifiers:** - Permanent buffs (e.g., "Aero DMG + 10%") go in `stats`.
  - Conditional/Timed buffs (e.g., "after releasing Intro Skill") go in `modifiers`.

## 4. Key Mappings

### Element ID to Slug

- `1` -> `glacio`, `2` -> `fusion`, `3` -> `electro`, `4` -> `aero`, `5` -> `spectro`, `6` -> `havoc`

### Stat Key Mapping

- **Flat ATK:** `attackFlat`
- **% ATK:** `attackScalingBonus`
- **Crit:** `criticalRate` / `criticalDamage`
- **DMG Bonus:** `damageBonus` (Always add the specific element/type tag).

## 5. Verification Checklist

- [ ] Are all percentages converted to fractional decimals?
- [ ] Does the `echoSetIds` array match the keys found in the raw `Group` field?
- [ ] If a set effect has a duration, is it correctly placed in `modifiers` instead of `stats`?
- [ ] Are the output files placed in the correct `parsed/` subdirectories?
