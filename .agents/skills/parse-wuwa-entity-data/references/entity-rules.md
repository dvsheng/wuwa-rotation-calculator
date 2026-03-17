# Entity Rules

## Universal Standards

### Required References

- Schemas: `src/db/schema.ts`, `src/schemas/database.ts`
- Existing vetted data: query PostgreSQL when an entity already exists

### IDs

- Include `skillId` on every attack, modifier, and permanent stat.
- Only include `gameId` when the raw data exposes a meaningful sub-attribute ID.
- If the only available ID is the parent skill or resonant chain node ID, omit `gameId`.

### Modifier vs Permanent Stat

- Use `permanentStats` for unconditional always-on effects once unlocked.
- Use `modifiers` for conditional or stateful effects.
- For sequence effects that say a damage multiplier is increased with no activation condition, default to `permanentStats`.

## General Stat Mapping

### Values

- Convert percentage strings like `"12%"` to decimals like `0.12`.

### Number Shapes

- `DatabaseLeafNumber`: plain number or refine-scalable object
- `DatabaseUserNumber`: plain number, refine-scalable number, or `userParameterizedNumber`
- `DatabaseNumberNode`: use expression trees such as `sum`, `product`, `clamp`, `conditional`, and `statParameterizedNumber`
- Restriction: `attacks[].damageInstances[].motionValue` must stay within `DatabaseUserNumber`; do not emit `sum`, `product`, `clamp`, `conditional`, or `statParameterizedNumber` there

### Common Stat Key Mapping

- `ATK` / `DEF` / `HP`: map to flat stats for absolute values or `*ScalingBonus` for percentages
- `Crit`: map to `criticalRate` or `criticalDamage`
- `damageBonus`: default for `[Type] DMG` or `[Type] DMG Bonus`
- `damageMultiplierBonus`: only when the text explicitly says `damage multiplier`
- `finalDamageBonus`: reserve for effects explicitly modeled that way
- Amplification bonuses should only be used when the source text explicitly says so

## Character Rules

### Attacks

- Always include a `description` derived from the source text.
- Use `damageInstances`, not `motionValues`.
- Every damage instance must include:
  - `motionValue`
  - `attribute`
  - `damageType`
  - `tags`
  - `scalingStat`
- Keep the main classification in `damageType` and the element in `attribute`.
- Use `tags` only for supplemental qualifiers such as `coordinatedAttack` or `aerial`.
- Do not tag an attack with its own name.
- Map `attackScalingProperty` to the correct scaling stat such as `atk`, `def`, `hp`, `fixed`, `tuneRuptureAtk`, `tuneRuptureHp`, or `tuneRuptureDef`.
- If a sequence replaces or materially changes an attack, model that with `alternativeDefinitions` on the base capability.

Attack example:

```json
{
  "motionValue": 0.4871,
  "attribute": "aero",
  "damageType": "basicAttack",
  "tags": [],
  "scalingStat": "atk"
}
```

### Modifiers And Permanent Stats

- Always include a `description` derived from the relevant source line.
- Permanent stats are not user-configurable.
- Modifiers represent effects whose activation depends on state, timing, stacks, or a trigger.
- `target` belongs on each `modifiedStats[]` entry, not at the modifier top level.
- Valid targets are `self`, `activeCharacter`, `team`, and `enemy`.
- Mixed-target effects should stay in one modifier with multiple `modifiedStats` entries.
- `defenseIgnore` targets a character; `defenseReduction` targets `enemy`.

### Modifier Tags

- `modifiedStats[].tags` describe which attacks the effect applies to.
- Use `["all"]` for broad buffs.
- Use category or element tags when the source effect is restricted that way.
- Use a specific attack capability name only when the effect truly applies to that one attack.

### Sequence Upgrades

- Use `alternativeDefinitions` when a sequence upgrades or replaces an existing effect.
- Each alternative definition must contain the full replacement payload for that sequence level.
- If S6 extends an existing effect instead of adding a separate trigger, extend the same base capability with another alternative definition.
- Split into multiple capabilities only when the base and upgraded effects are truly separate behaviors.

### Stacks And Conditional Values

- Do not use old `parameterConfigs` shapes.
- For direct stack counts, use `userParameterizedNumber`.
- For per-stack values, use `product` with a scalar amount and a `userParameterizedNumber`.
- If one effect has multiple conditional bands, keep it in one modifier and use `conditional` nodes.
- For stat-scaled buffs, use `statParameterizedNumber` inside a `DatabaseNumberNode`.
- For threshold-and-cap phrasing, prefer shapes like `clamp(product(rate, sum(stat, -threshold)), min, max)`.
- Omit mechanics not represented in tracked stats, such as flat energy restoration, hit-count behavior, dodge refreshes, healing-only mechanics, or other unsupported system logic.

### Character-Specific Modeling Notes

- Mixed-target blessing-style effects should remain one modifier with per-entry targets and conditional logic where needed.
- `Echo Skill DMG Bonus` wording should usually map to `damageBonus` with `tags: ["echo"]` unless the text explicitly says `damage multiplier`.
- Keep capability descriptions short and tied to the exact source line being modeled.

## Echo Rules

- Standard echo activation damage should use `damageType: "echo"`.
- Set `attribute` per damage instance.
- If the echo has a separate triggered variant, model it as a separate attack capability unless it truly replaces the base definition.
- Keep tags minimal.

## Weapon Rules

### Refine Scaling

- Use `{ "base": number, "increment": number }` for values that scale linearly by refinement.
- Runtime resolution is `base + (refineLevel - 1) * increment`.
- Values that do not scale across refinements should remain plain numbers.

### Weapon Passive Mapping

- Unconditional passives become `permanentStats`.
- Conditional passives become `modifiers`.
- For raw rank values `[r1, r2, r3, r4, r5]`:
  - `base = r1`
  - `increment = r2 - r1`
- For stackable refine-scaled effects, use a `product` node with the refine-scalable number and a `userParameterizedNumber`.

Example:

```json
{
  "stat": "attackScalingBonus",
  "value": { "base": 0.12, "increment": 0.03 },
  "tags": ["all"]
}
```

Stackable example:

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

## Formatting And Validation

- `description` should be a relevant subsequence of the source text.
- Escape embedded double quotes in JSON string values.
- Do not invent unsupported fields.
- If the source wording is ambiguous or uses unsupported scaling behavior, flag it explicitly.
- Validate with:
  - `npm run db:validate`
  - `npm run validate-data`
