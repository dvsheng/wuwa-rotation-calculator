# Detailed Plan: Parse Wuthering Waves Game Data

## Overview

This plan outlines the process for transforming raw Hakushin API JSON data into the project's internal TypeScript schemas for Characters, Weapons, Echoes, and Echo Sets.

### Important: Manual Parsing Required

**Writing a fully programmatic parser is infeasible** due to the complexity and variety of edge cases:

- Sequence replacement vs additive patterns require understanding intent from descriptions
- Specific attack tagging requires analyzing which buffs target which attacks
- Multi-form characters need manual decisions on naming conventions
- Stack-based vs flat buffs require interpreting game mechanics
- "Considered as X DMG" phrases need contextual understanding

**Do NOT attempt shortcuts.** Parse each character, weapon, and echo individually.

**Checkpointing**: After parsing each individual entity (Character, Weapon, or Echo), update `PARSE_CHECKPOINT.md` with the entity ID and a brief summary of the changes/additions made. This ensures progress is tracked and allows for easier recovery if the session is interrupted.

## Entity Summary

| Entity    | Raw Path                              | Parsed Path                              | Output Schema                         |
| --------- | ------------------------------------- | ---------------------------------------- | ------------------------------------- |
| Character | `.local/data/character/raw/{id}.json` | `.local/data/character/parsed/{id}.json` | `Character` from `character/types.ts` |
| Weapon    | `.local/data/weapon/raw/{id}.json`    | `.local/data/weapon/parsed/{id}.json`    | `Weapon` from `weapon/types.ts`       |
| Echo      | `.local/data/echo/raw/{id}.json`      | `.local/data/echo/parsed/{id}.json`      | `Echo` from `echo/types.ts`           |
| Echo Set  | N/A (derived from Echo)               | `.local/data/echo-set/parsed/{id}.json`  | `EchoSet` from `echo-set/types.ts`    |

---

## Schema Structure Overview

All entities use a **Capabilities** structure that contains:

```typescript
interface Capabilities {
  attacks: Array<Attack>;
  modifiers: Array<Modifier>;
  permanentStats: Array<PermanentStat>;
}
```

### Key Schema Changes (from old format)

1. **`capabilities` wrapper**: All attacks, modifiers, and stats are now nested under a `capabilities` object
2. **`permanentStats` is an array**: Changed from `Record<StatKey, Array<...>>` to `Array<{stat, name, description, value, tags, ...}>`
3. **`modifiedStats` is an array**: Changed from `Record<StatKey, Array<{value, tags}>>` to `Array<{stat, value, tags}>`
4. **No `parameterizedMotionValues`**: Removed from attacks - use `motionValues` with `UserParameterizedNumber` objects when needed
5. **Weapons**: `baseStats` incorporated into each refine level's `permanentStats`

---

## Phase 1: Character Data Parsing

### 1.1 Input Structure (Raw Hakushin JSON)

Key fields to extract from raw character JSON:

- `Id`, `Name` - Basic identity
- `Element` - Attribute (1=glacio, 2=fusion, 3=electro, 4=aero, 5=spectro, 6=havoc)
- `Stats["6"]["90"]` - Level 90 base stats (Life/Atk/Def)
- `SkillTrees` - All skills, attacks, and stat nodes

### 1.2 SkillTree Node Types

The `SkillTrees` object contains nodes with different `NodeType` values:

- `NodeType: 2` - Active skills (Normal Attack, Resonance Skill, Resonance Liberation, etc.)
- `NodeType: 4` - Permanent stat bonuses (DEF+, HP+, etc.)
- `NodeType: 5` - Inherent Skills (passive abilities)

Each node contains:

- `Skill.Name`, `Skill.Desc` - Skill name and description
- `Skill.Type` - Origin type ("Normal Attack", "Resonance Skill", etc.)
- `Skill.Damage` - Motion value data for attacks
- `Skill.Level` - Level-scaled parameters

### 1.3 Exclusion Rules

**DO NOT include** the following in parsed data:

1. **Healing-only effects**: Skills/abilities that ONLY heal without providing stat buffs
   - Example: Outer Stellarealm (base kit) - just heals, no damage or stat modifier
   - If a healing skill also buffs stats, include only the buff portion

2. **Non-damaging "attacks"**: Abilities that deploy effects but deal no damage
   - Example: Shorekeeper's Resonance Liberation "End Loop" - deploys Stellarealm fields but doesn't deal damage
   - Even though Resonance Liberations typically deal damage, skip if `Skill.Damage` is empty/missing
   - The BUFFS from such abilities should still be captured as modifiers

3. **Utility-only skills**: Dodges, movement abilities, or other skills with no damage/buff component

**Rule of thumb**: Only include data relevant to damage calculations and buff tracking. If it doesn't deal damage AND doesn't provide stat modifiers, exclude it.

### 1.4 Attack Extraction Logic

For each SkillTree node with `Skill.Damage` (skip nodes without damage data per exclusion rules):

1. **Extract Motion Values**:
   - Source: `Skill.Damage[key].RateLv[9]` (Level 10, 0-indexed as 9)
   - Formula: `value / 10000` to convert from basis points to decimal
   - Example: `22270` → `0.2227`

2. **Map Scaling Stat**:
   - Source: `Skill.Damage[key].RelatedProperty`
   - Mapping: `"ATK"` → `"atk"`, `"DEF"` → `"def"`, `"HP"` → `"hp"`

3. **Determine Tags**:
   Based on `Skill.Type` and skill context:
   - "Normal Attack" → `["basicAttack"]` or `["heavyAttack"]` based on name
   - "Resonance Skill" → `["resonanceSkill"]`
   - "Resonance Liberation" → `["resonanceLiberation"]`
   - "Intro Skill" → `["intro"]`
   - "Outro Skill" → `["outro"]`
   - "Forte Circuit" containing "Tune Rupture" → `["tuneRupture"]`
   - **Dodge Counter** → `["basicAttack"]` (unless otherwise stated)
   - **Mid-air Attack** → `["basicAttack"]` (unless otherwise stated)

   **Mutually exclusive tags**: `basicAttack`, `heavyAttack`, `resonanceSkill`, `resonanceLiberation` are mutually exclusive - an attack has exactly one of these.

   **Additional tags**: An attack can have multiple tags beyond the main category:
   - `coordinatedAttack` - for attacks that trigger as coordinated attacks
   - `intro`, `outro` - for intro/outro skills
   - `tuneRupture`, `tuneStrain` - for Tune Break mechanics
   - Example: Yinlin's "Judgement Strike" has `["resonanceSkill", "coordinatedAttack"]`

   **Tags NOT to include** (added by runtime):
   - Attack names (engine adds automatically)
   - Attribute/element tags (spectro, glacio, etc. - engine adds automatically)

   **Specific attack names as tags**: Some attacks should use their own name as a tag for targeted buffs (see "Edge Cases > Specific Attack Tagging")

4. **Output Format** (inside `capabilities.attacks`):
   ```typescript
   {
     name: "Basic Attack Stage 1",
     description: "Perform up to 4 consecutive attacks...",
     scalingStat: "atk",
     motionValues: [0.2227, 0.1671, 0.1671],
     tags: ["basicAttack"],
     // Character-specific fields:
     originType: "Normal Attack",
     parentName: "Ground State Calibration"
   }
   ```

### 1.5 Modifier Extraction Logic

For effects with duration or conditions (from `Skill.Desc`):

1. **Identify Modifiers**:
   - Look for patterns like "for Xs", "increases...by X%", "when...", "after..."
   - Field effects, outro buffs, sequence bonuses

2. **Determine Target**:
   - `self` - Applies to the character only
   - `activeCharacter` - Applies to on-field character. **Crucial**: Use this for buffs that target the "next character" (e.g., Outro-triggered buffs like Impermanence Heron).
   - `team` - Applies to entire party

3. **Handle Dynamic Scaling**:
   - For effects that scale with stats (e.g., "for every 1% of Energy Regen exceeding 100%"):
   - Use `RotationRuntimeResolvableNumber`:
     ```typescript
     {
       resolveWith: "self",
       parameterConfigs: {
         energyRegen: { scale: 0.5, minimum: 1.0, maximum: 2.6 }
       },
       maximum: 0.8
     }
     ```

4. **Sequence Unlocks**:
   - If from Resonance Chain (S1-S6), add `unlockedAt: "s1"` through `"s6"`
   - If a sequence replaces/upgrades a base modifier, add `disabledAt` to the base version
   - See "Edge Cases > Sequence Replacement Pattern" for detailed example (Aemeath S3)

5. **Output Format** (inside `capabilities.modifiers`):
   ```typescript
   {
     name: "Condensation Resonance Skill Buff",
     description: "Damage dealt by Sanhua's Resonance Skill increased by 20%...",
     target: "self",
     modifiedStats: [
       { stat: "damageBonus", value: 0.2, tags: ["resonanceSkill"] }
     ],
     // Character-specific fields:
     originType: "Inherent Skill",
     parentName: "Condensation"
   }
   ```

### 1.6 Stat Extraction Logic

1. **Base Stats** (Level 90):
   - Source: `Stats["6"]["90"]`
   - Map: `Life` → `hpFlat`, `Atk` → `attackFlat`, `Def` → `defenseFlat`

2. **Permanent Bonuses** (`NodeType: 4` and unconditional Inherent Skills):
   - Extract stat increases without duration/conditions
   - Convert percentages to decimals (e.g., "2.28%" → `0.0228`)

3. **Output Format** (inside `capabilities.permanentStats`):
   ```typescript
   {
     stat: "hpFlat",
     name: "Base HP",
     description: "Base HP at Level 90",
     value: 10062.5,
     tags: ["all"],
     // Character-specific fields:
     originType: "Base Stats",
     parentName: "Sanhua"
   }
   ```

### 1.7 Character Output Structure

```typescript
{
  id: "1102",
  name: "Sanhua",
  attribute: "glacio",
  capabilities: {
    attacks: [
      {
        name: "Basic Attack Stage 1",
        description: "Perform up to 5 consecutive attacks...",
        scalingStat: "atk",
        motionValues: [0.4871],
        tags: ["basicAttack"],
        originType: "Normal Attack",
        parentName: "Frigid Light"
      },
      // ... more attacks
    ],
    modifiers: [
      {
        name: "Condensation Resonance Skill Buff",
        description: "Damage dealt by Sanhua's Resonance Skill increased by 20%...",
        target: "self",
        modifiedStats: [
          { stat: "damageBonus", value: 0.2, tags: ["resonanceSkill"] }
        ],
        originType: "Inherent Skill",
        parentName: "Condensation"
      },
      // ... more modifiers
    ],
    permanentStats: [
      {
        stat: "hpFlat",
        name: "Base HP",
        description: "Base HP at Level 90",
        value: 10062.5,
        tags: ["all"],
        originType: "Base Stats",
        parentName: "Sanhua"
      },
      // ... more permanent stats
    ]
  }
}
```

---

## Phase 2: Weapon Data Parsing

### 2.1 Input Structure

Key fields:

- `Id`, `Name`, `Type`, `Rarity`
- `Stats["6"]["90"]` - Level 90 stats (array with flat ATK and secondary stat)
- `Effect` - Weapon passive descriptions per refine level

### 2.2 Base Stats Extraction

1. **Primary Stat** (Attack):
   - Source: `Stats["6"]["90"][0]` where `IsRatio: false`
   - Map to `attackFlat`

2. **Secondary Stat**:
   - Source: `Stats["6"]["90"][1]` where `IsRatio: true`
   - Identify stat type from `Name`:
     - "ATK" → `attackScalingBonus`
     - "Crit. Rate" → `criticalRate`
     - "Crit. DMG" → `criticalDamage`
     - "Energy Regen" → `energyRegen`

### 2.3 Weapon Passive (Per Refine Level)

Weapons have 5 refinement levels. Parse `Effect["1"]` through `Effect["5"]`.

1. **Permanent Stats**: If no condition/trigger → `permanentStats`
2. **Conditional Buffs**: If trigger/duration → `modifiers`
3. **Weapon Attacks**: Some weapons add attacks → `attacks`

**Important**: Base stats are included in each refine level's `permanentStats`.

### 2.4 Output Structure

```typescript
{
  id: "21050015",
  name: "Cosmic Ripples",
  capabilities: {
    "1": {
      attacks: [],
      modifiers: [
        {
          description: "When dealing Basic Attack DMG, increases Basic Attack DMG Bonus by 3.2%...",
          target: "self",
          modifiedStats: [
            {
              stat: "damageBonus",
              value: { parameterConfigs: { "Stacks": { scale: 0.032 } }, minimum: 0, maximum: 5 },
              tags: ["basicAttack"]
            }
          ]
        }
      ],
      permanentStats: [
        { stat: "attackFlat", name: "Base attackFlat", description: "Base weapon stat", value: 500, tags: ["all"] },
        { stat: "attackScalingBonus", name: "Base attackScalingBonus", description: "Base weapon stat", value: 0.54, tags: ["all"] },
        { stat: "energyRegen", name: "energyRegen", description: "Increases Energy Regen by 12.8%.", value: 0.128, tags: ["all"] }
      ]
    },
    "2": { /* ... */ },
    "3": { /* ... */ },
    "4": { /* ... */ },
    "5": { /* ... */ }
  }
}
```

### 2.5 Weapon Type Mapping

| Raw Type | Internal Slug |
| -------- | ------------- |
| 1        | sword         |
| 2        | broadblade    |
| 3        | pistols       |
| 4        | gauntlets     |
| 5        | rectifier     |

---

## Phase 3: Echo Data Parsing

### 3.1 Input Structure

Key fields:

- `Id`, `Name`
- `Skill.Damage` - Echo skill damage instances
- `Skill.Desc` - Skill description (may contain buffs)
- `Group` - Associated echo sets

**Note**: Include Nightmare versions of Echoes (e.g., Nightmare: Crownless) as they have unique stats/buffs. However, do NOT parse Phantom versions (skins), which are purely cosmetic.

### 3.2 Attack Extraction

1. **Motion Values**:
   - Source: `Skill.Damage[key].RateLv[4]` (Max Level 5, 0-indexed as 4)
   - Formula: `value / 10000`

2. **Element**:
   - Source: `Skill.Damage[key].Element`
   - Mapping: 1=glacio, 2=fusion, 3=electro, 4=aero, 5=spectro, 6=havoc

3. **Scaling Stat**:
   - Source: `Skill.Damage[key].RelatedProperty`
   - Lowercase: "ATK" → "atk"

4. **Tags**: Always include `["echo"]` or `["echoSkill"]`

### 3.3 Modifier Extraction

- Scan `Skill.Desc` for duration-based effects
- Parse buff amounts, convert percentages to decimals

### 3.4 Echo Set IDs

Extract from `Group` object keys (e.g., `"12"`, `"13"`):

```typescript
echoSetIds: ['12', '13'];
```

### 3.5 Output Structure

```typescript
{
  id: "390070078",
  name: "Baby Viridblaze Saurian",
  echoSetIds: ["2", "3", "9"],
  capabilities: {
    attacks: [
      {
        description: "Transform into Baby Viridblaze Saurian to rest in place...",
        scalingStat: "atk",
        motionValues: [],
        tags: ["echo", "all"]
      }
    ],
    modifiers: [],
    permanentStats: []
  }
}
```

---

## Phase 4: Echo Set Data Parsing

### 4.1 Source

Echo Sets are derived from Echo `Group` data, not separate raw files.

### 4.2 Set Effect Tiers

Hakushin uses `"2"` and `"5"` for set bonuses. Map to:

- `"2"` → 2-piece bonus
- `"5"` → 5-piece bonus (shown as "4" in game but stored as "5" in API)

### 4.3 Effect Classification

1. **Permanent Stats** (e.g., "Havoc DMG + 10%"):
   - No trigger/duration → `setEffects["2"].permanentStats`

2. **Conditional Modifiers** (e.g., "When Outro Skill is triggered..."):
   - Has trigger/duration → `setEffects["5"].modifiers`

### 4.4 Output Structure

```typescript
{
  id: "12",
  name: "Midnight Veil",
  setEffects: {
    "2": {
      attacks: [],
      modifiers: [],
      permanentStats: [
        { stat: "damageBonus", name: "damageBonus", description: "Havoc DMG + 10%", value: 0.1, tags: ["havoc"] }
      ]
    },
    "5": {
      attacks: [],
      modifiers: [
        {
          description: "When Outro Skill is triggered, deal additional 480% Havoc DMG...",
          target: "activeCharacter",
          modifiedStats: [
            { stat: "damageBonus", value: 0.15, tags: ["havoc"] }
          ]
        }
      ],
      permanentStats: []
    }
  }
}
```

---

### 5: Run Validation

After parsing, validate all output:

```bash
npx vitest run scripts/validate-game-data.test.ts
```

The existing validation script at `scripts/validate-game-data.test.ts` will:

- Read all files from `{entity}/parsed/` directories
- Validate each file against the corresponding Zod schema
- Report any schema violations with file path and error details

---

## Phase 6: Verification Checklist

### Automated Validation

Run the validation test suite after parsing:

```bash
npx vitest run scripts/validate-game-data.test.ts
```

This will validate all parsed files against Zod schemas defined in `scripts/validate-game-data.test.ts`.

### Manual Verification

#### Character Data

- [ ] All motion values divided by 10000
- [ ] Scaling stats lowercase ("atk", "def", "hp")
- [ ] Tags match attack type (basicAttack, resonanceSkill, etc.)
- [ ] Sequence bonuses have `unlockedAt`
- [ ] Base stats from `Stats["6"]["90"]`
- [ ] `parentName` and `originType` present on all items in capabilities
- [ ] All data wrapped in `capabilities` object

#### Weapon Data

- [ ] Level 90 stats extracted correctly
- [ ] Secondary stat mapped to correct key
- [ ] All 5 refine levels (`"1"` through `"5"`) parsed
- [ ] Base stats included in each refine level's `permanentStats`
- [ ] Weapon type mapped correctly

#### Echo Data

- [ ] Motion values from `RateLv[4]` (max level)
- [ ] Element tag included
- [ ] All echo set IDs extracted as strings
- [ ] Data wrapped in `capabilities` object

#### Echo Set Data

- [ ] 2pc and 5pc (stored as `"2"` and `"5"`) bonuses parsed
- [ ] Permanent vs conditional effects separated
- [ ] All values converted to decimals
- [ ] Each set effect is a `Capabilities` object

---

## Gold Standard References

- **Character**: `.local/data/character/parsed/1102.json` (Sanhua), `.local/data/character/parsed/1103.json`
- **Weapon**: `.local/data/weapon/parsed/21050015.json` (Cosmic Ripples)
- **Echo**: `.local/data/echo/parsed/390070078.json` (Baby Viridblaze Saurian)
- **Echo Set**: `.local/data/echo-set/parsed/12.json` (Midnight Veil)

---

## Validation Script

Location: `scripts/validate-game-data.test.ts`

This Vitest test file validates all parsed JSON files against Zod schemas. Run after parsing to ensure correctness.

### Running Validation

```bash
npx vitest run scripts/validate-game-data.test.ts
```

### Schema Requirements

The validation script enforces these constraints:

#### Attack Schema

- `scalingStat`: Must be `"hp"`, `"atk"`, or `"def"` (lowercase)
- `motionValues`: `Array<number | UserParameterizedNumber>`
- `description`: Required string
- `tags`: Required `Array<string>`

#### Modifier Schema

- `target`: Optional - one of `"team"`, `"enemy"`, `"activeCharacter"`, `"self"`, or array `[1, 2, 3]` for slot targeting
- `modifiedStats`: `Array<{ stat: string, value: number | ParameterizedNumber, tags: Array<string> }>`
- `description`: Required string

#### PermanentStat Schema

- `stat`: Required string (stat key like "hpFlat", "damageBonus", etc.)
- `name`: Required string
- `description`: Required string
- `value`: `number | ParameterizedNumber`
- `tags`: Required `Array<string>`

#### Character-Specific Fields

- `name`: Required string
- `parentName`: Required (skill tree node name)
- `originType`: Required (e.g., "Normal Attack", "Resonance Skill")
- `unlockedAt`: Optional sequence `"s1"`-`"s6"`
- `disabledAt`: Optional sequence `"s1"`-`"s6"`

#### Weapon Schema

- `capabilities`: Record with keys `"1"` through `"5"` (refine levels)
- Each refine level is a `Capabilities` object with `attacks`, `modifiers`, `permanentStats`

#### Echo Schema

- `echoSetIds`: `Array<string>` (references to echo set IDs)
- `capabilities`: `Capabilities` object with `attacks`, `modifiers`, `permanentStats`

#### Echo Set Schema

- `setEffects`: Object with optional keys `"2"`, `"3"`, `"5"`
- Each set effect is a `Capabilities` object with `attacks`, `modifiers`, `permanentStats`

### Validation Workflow

1. Parse raw data → write to `{entity}/parsed/{id}.json`
2. Run validation: `npx vitest run scripts/validate-game-data.test.ts`
3. Fix any schema violations
4. Re-run until all tests pass

---

## Edge Cases

### Sequence Replacement Pattern (e.g., Aemeath S3)

Some sequences completely replace a base kit ability rather than just buffing it. The pattern to handle this:

**Example: Aemeath (ID 1210) - Inherent Skill "Between the Stars"**

**Base Kit Version** (stack-based, user-parameterized):

```
In Resonance Mode - Tune Rupture, when Resonators in the team inflict
Tune Rupture - Shifting or deal Tune Rupture DMG, Aemeath's Crit. DMG
increases by 20%, up to 3 times. Each Resonator can only trigger this
effect once.
```

This uses `UserParameterizedNumber` because the user controls stack count (0-3):

```typescript
{
  name: "Between the Stars (Tune Rupture)",
  description: "...",
  originType: "Inherent Skill",
  parentName: "Between the Stars",
  disabledAt: "s3",  // <-- Key: disabled when S3 unlocks
  target: "self",
  modifiedStats: [
    {
      stat: "criticalDamage",
      value: {
        parameterConfigs: { "0": { scale: 0.2 } },  // 20% per stack
        minimum: 0,
        maximum: 3
      },
      tags: ["all"]
    }
  ]
}
```

**S3 Replacement Version** (flat value, no stacks):

```
Inherent Skill Between the Stars is replaced with the following effects:
- In Resonance Mode - Tune Rupture, when Resonators in the team inflict
  Tune Rupture - Shifting or deal Tune Rupture DMG, Aemeath's Crit. DMG
  is increased by 60%...
```

This becomes a simple modifier with `unlockedAt`:

```typescript
{
  name: "Between the Stars (Tune Rupture) - S3",
  description: "...",
  originType: "s3",
  parentName: "Absolute Sovereignty",
  unlockedAt: "s3",  // <-- Key: only active at S3+
  target: "self",
  modifiedStats: [
    { stat: "criticalDamage", value: 0.6, tags: ["all"] }  // Flat 60%, no stacks
  ]
}
```

**Key Pattern**: When a sequence says "X is replaced with Y":

1. Add `disabledAt: "sN"` to the base version
2. Create new modifier with `unlockedAt: "sN"` for the replacement
3. The replacement typically simplifies user-parameterized values to flat numbers

### Other Sequence Replacement Indicators

Watch for these phrases in sequence descriptions:

- "X is replaced with..."
- "X is enhanced to..."
- "X now grants..."
- "X gains the following effect instead..."

### Sequence Additive Pattern (e.g., Shorekeeper S2)

Some sequences ADD a new effect to an existing ability without replacing/disabling the base version.

**Example: Shorekeeper S2 - "Outer Stellarealm now increases ATK by 40%"**

**Base Kit** has three separate modifiers from Resonance Liberation "End Loop":

1. **Outer Stellarealm** - Heals party (no damage modifier, just utility)
2. **Inner Stellarealm** - Crit Rate scaling with Energy Regen (`RotationRuntimeResolvableNumber`)
3. **Supernal Stellarealm** - Crit DMG scaling with Energy Regen (`RotationRuntimeResolvableNumber`)

**S2** adds a NEW static modifier:

```typescript
{
  name: "Outer Stellarealm ATK Buff",
  description: "...",
  originType: "s2",
  parentName: "Echerta",  // S2 node name
  unlockedAt: "s2",
  target: "team",
  modifiedStats: [
    { stat: "attackPercentage", value: 0.4, tags: ["all"] }  // 40% ATK
  ]
}
```

**Key Difference from Replacement Pattern**:

- NO `disabledAt` on any base modifiers
- Inner Stellarealm and Supernal Stellarealm remain active at all sequences
- S2 simply adds a fourth modifier

**Pattern Recognition**:

- "X now also grants..."
- "X now increases Y by Z%" (where base X had no Y effect)
- Sequence adds to an ability that previously had no damage/stat modifier

### Specific Attack Tagging (e.g., Sanhua S5)

**Key Rule**: Only tag a modifier with a category tag (e.g., `resonanceSkill`) if it applies to EVERY attack with that tag. If a buff targets a specific attack, use the attack name as the tag.

**Example: Sanhua S5 - "Crit. DMG of Forte Circuit Ice Burst is increased by 100%"**

Ice Burst is a specific attack in Sanhua's Forte Circuit that deals Resonance Skill DMG. However, S5 only buffs Ice Burst, not all Resonance Skills.

**Wrong approach**:

```typescript
// DON'T do this - would buff ALL resonance skills
{
  modifiedStats: [
    { stat: 'criticalDamage', value: 1.0, tags: ['resonanceSkill'] }, // Wrong!
  ];
}
```

**Correct approach**:

```typescript
// The Ice Burst attack only needs the category tag
{
  name: "Ice Burst",
  // ... other attack properties
  tags: ["resonanceSkill"]  // Only category tag - engine adds "Ice Burst" at runtime
}

// The S5 modifier targets only Ice Burst by name
{
  name: "Ice Burst Crit DMG Bonus",
  description: "...",
  originType: "s5",
  parentName: "Unraveling Fate",
  unlockedAt: "s5",
  target: "self",
  modifiedStats: [
    { stat: "criticalDamage", value: 1.0, tags: ["Ice Burst"] }  // Matches the attack name
  ]
}
```

**When to use specific attack names as tags**:

- Buffs that say "X skill/attack" gains bonus (not "all Basic Attacks" or "Resonance Skill DMG")
- Sequence bonuses that enhance a single named ability
- Any buff that wouldn't apply to other attacks in the same category

**Attack tagging pattern**:

- Only include the category tag (`basicAttack`, `resonanceSkill`, etc.) on the attack
- **DO NOT** add the attack name as a tag on the attack itself - the rotation calculation engine automatically adds each attack's name as a tag at runtime
- Modifiers can reference specific attack names in their tags - the engine will match them

### Multi-Form Characters (e.g., Cartethyia S2)

Characters with transformation stances have attacks that share category tags but must be distinguished for buffs.

**Example: Cartethyia** has two forms:

1. **Cartethyia form** - Basic attacks, Heavy Attack, Mid-air Attack, Dodge Counter
2. **Fleurdelys form** - Basic Attack - Fleurdelys, Heavy Attack - Fleurdelys, Mid-air Attack - Fleurdelys, etc.

**S2 buff**: "The DMG Multipliers of Cartethyia's Basic Attack, Heavy Attack, Dodge Counter, and Intro Skill are increased by 50%"

This explicitly names "Cartethyia's" attacks - it does NOT buff Fleurdelys form attacks.

**CRITICAL**: Tags must match the actual names you assign during parsing. The raw data has attack names like:

- "Stage 1 DMG", "Stage 2 DMG", etc. (basic attacks)
- "Heavy Attack DMG"
- "Dodge Counter DMG"
- "Mid-air Attack", "Mid-air Attack 1 Sword Shadow Recalled", etc.

You need to assign meaningful names AND use those exact names as tags.

**Attack naming and tagging**:

```typescript
// Cartethyia form attacks - only category tags needed
// The engine adds the attack name as a tag at runtime
{
  name: "Basic Attack Stage 1",
  tags: ["basicAttack"]
}
{
  name: "Basic Attack Stage 2",
  tags: ["basicAttack"]
}
{
  name: "Heavy Attack",
  tags: ["heavyAttack"]
}
{
  name: "Dodge Counter",
  tags: ["basicAttack"]  // Dodge counters default to basicAttack
}
{
  name: "Mid-air Attack",
  tags: ["basicAttack"]  // Mid-air attacks default to basicAttack
}

// Fleurdelys form attacks - different names (NOT buffed by S2)
{
  name: "Basic Attack - Fleurdelys Stage 1",
  tags: ["basicAttack"]
}
{
  name: "Heavy Attack - Fleurdelys",
  tags: ["heavyAttack"]
}
```

**S2 modifier** - list ALL the Cartethyia form attack names:

```typescript
{
  name: "Cartethyia Form DMG Multiplier Bonus",
  description: "...",
  originType: "s2",
  parentName: "Blade Broken by Tempest",
  unlockedAt: "s2",
  target: "self",
  modifiedStats: [
    {
      stat: "damageMultiplierBonus",
      value: 0.5,
      tags: [
        "Basic Attack Stage 1", "Basic Attack Stage 2", "Basic Attack Stage 3", "Basic Attack Stage 4",
        "Heavy Attack", "Dodge Counter", "Intro Skill"
      ]
    }
  ]
},
{
  name: "Cartethyia Mid-air Attack DMG Multiplier Bonus",
  description: "...",
  originType: "s2",
  parentName: "Blade Broken by Tempest",
  unlockedAt: "s2",
  target: "self",
  modifiedStats: [
    {
      stat: "damageMultiplierBonus",
      value: 2.0,  // 200%
      tags: [
        "Mid-air Attack", "Mid-air Attack 1 Sword Shadow Recalled",
        "Mid-air Attack 2 Sword Shadows Recalled", "Mid-air Attack 3 Sword Shadows Recalled"
      ]
    }
  ]
}
```

**Key insights**:

1. **Attacks only need category tags** - the engine automatically adds the attack name as a tag at runtime
2. **Modifier tags must match attack names exactly** - if you name an attack "Basic Attack Stage 1", the modifier tag must be "Basic Attack Stage 1"
3. **List all affected attacks explicitly in modifiers** - S2 buffs multiple specific attacks, so list each one
4. **Form distinction comes from naming** - Cartethyia form attacks have simpler names, Fleurdelys attacks include "- Fleurdelys"

**Other multi-form characters to watch for**:

- Characters with transformation/stance mechanics
- Characters with alternate skill sets (e.g., different modes)
- Any character where "Basic Attack" could refer to multiple distinct attacks

---

## Error Handling

1. **Non-standard scaling**: Flag if `RelatedProperty` is not ATK/DEF/HP
2. **Ambiguous descriptions**: Flag modifiers that can't be auto-parsed
3. **Missing data**: Log warning if expected fields are missing
4. **Schema Validation**: Run `scripts/validate-game-data.test.ts` after parsing to catch:
   - Missing required fields (`description`, `tags`, `stat`, etc.)
   - Invalid enum values (`scalingStat` must be `hp`/`atk`/`def`)
   - Incorrect types (numbers vs strings, arrays vs objects)
   - Malformed parameterized numbers

---

## Notes

- Motion values in raw data are in basis points (10000 = 100%)
- Level indices are 0-based (Level 10 = index 9 for characters, Level 5 = index 4 for echoes)
- Percentages in descriptions need regex extraction and conversion to decimals
- Some character abilities use `UserParameterizedNumber` for user-controllable parameters (e.g., stack counts)
- Some abilities use `RotationRuntimeResolvableNumber` for stats that scale with character stats at runtime
- **All entities use the `capabilities` wrapper** containing `attacks`, `modifiers`, and `permanentStats` arrays
- **`modifiedStats` is now an array** of `{ stat, value, tags }` objects, not a record
- **`permanentStats` is now an array** of `{ stat, name, description, value, tags, ... }` objects, not a record
