# Skill: parse_wuwa_echo_data

Transform raw Hakushin API echo data into the project's structured `Echo` and `EchoSet` formats. Refer to `src/services/game-data/echo/types.ts` and `src/services/game-data/echo-set/types.ts` for the definitive data structures.

## 1. Data Acquisition

- **Command:** `curl -s https://api.hakush.in/ww/data/en/echo/{id}.json > src/services/game-data/data/echo/raw/{id}.json`
- **Raw Storage:** `src/services/game-data/data/echo/raw/{id}.json`
- **Parsed Echo Storage:** `src/services/game-data/data/echo/parsed/{id}.json`
- **Parsed EchoSet Storage:** `src/services/game-data/data/echo-set/parsed/{id}.json`

## 2. Echo Mapping (`Echo`)

- **id:** The echo ID as a string.
- **name:** The echo name.
- **echoSetIds:** Extract IDs from the `Group` field keys.
- **attack:** Map the `Skill.Damage` entries.
  - **scalingStat:** Use `RelatedProperty` (e.g., `"ATK"` -> `"atk"`).
  - **motionValues:** Extract `RateLv[4] / 10000` (Max Level 5).
  - **tags:** Use `["echoSkill"]` and include the appropriate attribute tag (e.g., `"aero"`, `"spectro"`, etc.) based on the element mapping.
- **modifiers:** Parse the `Skill.Desc` for conditional buffs.
  - If the description says "increases ATK by 12% for 15s", create a modifier.
  - Use `StatValue` or `UserParameterizedNumber` if applicable.
- **stats:** Map any permanent stat increases mentioned in the active skill description (rare for echoes, usually they are modifiers).

## 3. Echo Set Mapping (`EchoSet`)

Echo sets are extracted from the `Group` field in the Echo JSON. Each entry in `Group` represents a set.

- **id:** The set ID as a string (e.g., `"4"`).
- **name:** The set name (e.g., `"Sierra Gale"`).
- **setEffects:** Map the `"2"` and `"5"` entries from the `Set` field.
  - **TWO_PIECE:** Map from `"2"`.
  - **FOUR_PIECE:** Map from `"5"` (Wuwa uses 2/5, but our schema uses `FOUR_PIECE` for the second tier).
  - **stats:** Permanent stat increases (e.g., "Aero DMG + 10%").
  - **modifiers:** Conditional buffs (e.g., "increases ATK by 15% for 30s upon healing allies").

## 4. Stat and Tag Mapping

- **Element Mapping:**
  - 1 -> `glacio`
  - 2 -> `fusion`
  - 3 -> `electro`
  - 4 -> `aero`
  - 5 -> `spectro`
  - 6 -> `havoc`
- **Stat Key Mapping:**
  - "ATK" (flat) -> `attackFlat`
  - "ATK" (ratio) -> `attackScalingBonus`
  - "Crit. Rate" -> `criticalRate`
  - "Crit. DMG" -> `criticalDamage`
  - "Energy Regen" -> `energyRegen`
  - "Healing Bonus" -> `healingBonus`
  - "DMG +" -> `damageBonus` with appropriate element/type tag.
- **Tagging:**
  - Always include `["all"]` for generic buffs.
  - Use elemental tags (`"aero"`, `"fusion"`, etc.) for damage bonuses.
  - Use skill tags (`"basicAttack"`, `"heavyAttack"`, etc.) if the buff specifies a skill type.

## 5. Implementation Notes

- Echo skills often have multiple damage instances in `Skill.Damage`. Map them all to the `attack` field if the schema allows, or pick the primary one if it's a single `Attack` object. _Note: `Echo` type defines `attack?: Attack`, so aggregate multiple instances into one `motionValues` array._
- When parsing an Echo, also check if its `EchoSet` has been parsed. If not, generate the parsed JSON for the set(s) as well.
- Use fractional values for percentages (e.g., `"10%"` -> `0.1`).

## 6. Output Example (Echo)

```json
{
  "id": "6000040",
  "name": "Hoochief",
  "echoSetIds": ["4", "7"],
  "attack": {
    "scalingStat": "atk",
    "motionValues": [2.682],
    "parameterizedMotionValues": [],
    "tags": ["echoSkill", "aero"]
  },
  "modifiers": [],
  "stats": {}
}
```

## 7. Output Example (EchoSet)

```json
{
  "id": "4",
  "name": "Sierra Gale",
  "setEffects": {
    "TWO_PIECE": {
      "modifiers": [],
      "stats": {
        "damageBonus": [
          {
            "value": 0.1,
            "tags": ["aero"],
            "description": "Aero DMG + 10%"
          }
        ]
      }
    },
    "FOUR_PIECE": {
      "modifiers": [
        {
          "target": "self",
          "modifiedStats": {
            "damageBonus": [
              {
                "value": 0.3,
                "tags": ["aero"]
              }
            ]
          },
          "description": "Aero DMG + 30% for 15s after releasing Intro Skill"
        }
      ],
      "stats": {}
    }
  }
}
```
