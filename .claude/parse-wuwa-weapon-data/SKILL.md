---
name: parse_wuwa_weapon_data
description: Transforms raw Hakushin API weapon JSON into the project's structured Weapon format. Use this to map base stats, secondary scaling, and unique passive effects (modifiers).
---

# Skill: parse_wuwa_weapon_data

You are a specialized data transformation agent for Wuthering Waves weapon systems. Your goal is to map raw Hakushin JSON data to the `Weapon` schema.

## Reference Materials

- **Output Schema:** `src/services/game-data/weapon/types.ts`
- **Reference Logic:** Follow the pattern established in character and echo parsers for stat naming and modifier structures.

## 1. Storage & Acquisition

- **Raw Path:** `.local/data/weapon/raw/{id}.json`
- **Parsed Path:** `.local/data/weapon/parsed/{id}.json`
- **Fetch Command:** `curl -s https://api.hakush.in/ww/data/en/weapon/{id}.json`

## 2. Extraction Logic

### Base Stats (Level 90)

- **Primary Stat:** Extract `Stats["6"]["90"][0]` and map to `attackFlat`.
- **Secondary Stat:** Extract `Stats["6"]["90"][1]`.
  - Map the value to the correct `CharacterStats` key (e.g., `attackScalingBonus`, `criticalRate`, `energyRegen`).
  - Convert percentages to decimals.

### Weapon Passives (`modifiers`)

- **Source:** Parse `Skill.Desc`.
- **Scaling:** Weapons have 5 tiers of passives. Use `Array<number>` for values that change per rank.
- **Rules:**
  - **Permanent Stats:** If a weapon provides a flat bonus without conditions (e.g., "Increases ATK by 12%"), place it in `stats`.
  - **Conditional Buffs:** If the bonus has a trigger or duration (e.g., "After using Resonance Skill, increases Basic Attack DMG by 20% for 10s"), place it in `modifiers`.
- **Target:** Always set to `self` unless the weapon explicitly states it buffs the team (e.g., support weapons).

## 3. Key Mappings

### Weapon Type Mapping

Map the raw `WeaponType` string or ID to our internal slugs:

- `1` -> `sword`
- `2` -> `broadblade`
- `3` -> `pistols`
- `4` -> `gauntlets`
- `5` -> `rectifier`

### Stat Keys

- Always use the standardized keys: `attackFlat`, `attackScalingBonus`, `criticalRate`, `criticalDamage`, `energyRegen`, `damageBonus`.
- For `damageBonus`, ensure the `tags` array contains the specific damage type (e.g., `["basicAttack"]` or `["all"]`).

## 4. Output Example

```json
{
  "id": "12050015",
  "name": "Stringless",
  "type": "rectifier",
  "rarity": 5,
  "stats": {
    "attackFlat": 500,
    "attackScalingBonus": [{ "value": 0.54, "tags": ["all"] }]
  },
  "modifiers": [
    {
      "target": "self",
      "description": "Increases Resonance Skill DMG by 20%",
      "modifiedStats": {
        "damageBonus": [{ "value": 0.2, "tags": ["resonanceSkill"] }]
      }
    }
  ]
}
```
