# Skill: parse_wuwa_weapon_data

Transform raw Hakushin API weapon data into the project's structured `Weapon` format. Refer to `src/services/game-data/weapon/types.ts` for the definitive output data structure.

## 1. Data Acquisition

- **Command:** `curl -s https://api.hakush.in/ww/data/en/weapon/{id}.json > src/services/game-data/data/weapon/raw/{id}.json`
- **Raw Storage:** `src/services/game-data/data/weapon/raw/{id}.json`
- **Parsed Storage:** `src/services/game-data/data/weapon/parsed/{id}.json`

## 2. Base Fields

- **id:** The weapon ID as a string.
- **name:** The weapon name.
- **baseStats:** A record of non-refinement-dependent stats at Level 90.
  - **attackFlat:** Extract base ATK from `Stats["6"]["90"]`.
  - **Secondary Stat:** Extract from `Stats["6"]["90"]`.
    - `ATK` (secondary) -> `attackPercentage`
    - `DEF` (secondary) -> `defensePercentage`
    - `HP` (secondary) -> `hpPercentage`
    - `Crit. Rate` -> `criticalRate`
    - `Crit. DMG` -> `criticalDamage`
    - `Energy Regen` -> `energyRegen`
    - **Values:** Divide percentage values by 10000 (e.g., `4860.0` -> `0.486`).

## 3. Attributes Mapping (`attributes`)

The `attributes` field is a record of 5 refinement levels ("1", "2", "3", "4", "5"). Each level contains `attack`, `modifiers`, and `stats`.

### 3.1. Passive Effects (Refine 1-5)

Extract values from `Param` using the refinement index `r-1`.

- **Stats:** Permanent stat increases from the weapon passive (e.g., "Increases Attribute DMG Bonus by 12%").
  - Map to the correct `CharacterStat` key.
  - These go into `attributes[r].stats`.
- **Modifiers:** Temporary or conditional buffs (e.g., "increases Heavy Attack DMG Bonus by 24%, stacking up to 2 time(s)").
  - If the buff is stackable or depends on a user-defined parameter, use `UserParameterizedNumber`.
- **Attack:** Additional damage procs provided by the weapon.

## 4. Handling Weapon Effects with Stacks (UserParameterizedNumber)

When a weapon effect has stacks (e.g., "stacking up to 5 times"), use a `UserParameterizedNumber` for the stat value. This structure follows a linear scaling model: `value = scale * (input - minimum) + offset`.

### Mapping Stacks to Linear Scaling

1.  **Linear Scaling (e.g., "increases ATK by 8%, stacking up to 5 times"):**
    - `scale`: The value per stack (e.g., `0.08`).
    - `minimum`: `0`.
    - `maximum`: The maximum number of stacks (e.g., `5`).
    - `parameterConfigs`: Use `"0"` as the key for the user-provided stack count.

    ```json
    "value": {
      "parameterConfigs": {
        "0": {
          "scale": 0.08,
          "minimum": 0,
          "maximum": 5
        }
      }
    }
    ```

2.  **Step Functions (e.g., "at 10 stacks, increases Crit. Rate by 6%"):**
    - `scale`: The total value granted at the step (e.g., `0.06`).
    - `minimum`: The stack count minus 1 (e.g., `9`).
    - `maximum`: The stack count required (e.g., `10`).

    ```json
    "value": {
      "parameterConfigs": {
        "0": {
          "scale": 0.06,
          "minimum": 9,
          "maximum": 10
        }
      }
    }
    ```

## 5. Stat Key Mapping Reminder

- **ATK (flat)** -> `attackFlat`
- **ATK (ratio)** -> `attackScalingBonus` (e.g., "ATK increased by 12%")
- **DEF** -> `defenseScalingBonus`
- **HP** -> `hpScalingBonus`
- **Crit. Rate** -> `criticalRate`
- **Crit. DMG** -> `criticalDamage`
- **Energy Regen** -> `energyRegen`
- **Healing Bonus** -> `healingBonus`
- **Attribute DMG Bonus** -> `damageBonus` with appropriate elemental tag (e.g., `aero`, `spectro`)
- **Basic/Heavy/Skill/Ult DMG Bonus** -> `damageBonus` with appropriate tag (e.g., `basicAttack`, `heavyAttack`, `resonanceSkill`, `resonanceLiberation`)
- **DEF Ignore** -> `defenseIgnore`
- **RES Pen** -> `resistancePenetration` with appropriate elemental tag

## 6. Output Example Structure

```json
{
  "id": "21010016",
  "name": "Verdant Summit",
  "baseStats": {
    "attackFlat": 587.5,
    "criticalDamage": 0.486
  },
  "attributes": {
    "1": {
      "modifiers": [...],
      "stats": {
        "damageBonus": [{
          "value": 0.12,
          "tags": ["all"]
        }]
      }
    }
  }
}
```
