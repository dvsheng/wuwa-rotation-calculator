import { z } from 'zod';

import { EntityType } from '@/db/schema';
import { OriginType, Sequence, Target } from '@/services/game-data/types';
import { AbilityAttribute, Attribute, CharacterStat, EnemyStat } from '@/types';

// ============================================================================
// Entity Type Schema
// ============================================================================

export const EntityTypeSchema = z.enum(EntityType);

// ============================================================================
// Sequence Schema
// ============================================================================

export const SequenceSchema = z.enum(Sequence);

// ============================================================================
// Target Schema
// ============================================================================

export const TargetSchema = z.enum(Target);

// ============================================================================
// Origin Type Schemas
// ============================================================================

export const OriginTypeSchema = z.enum(OriginType);

// AttackOriginType excludes 'Inherent Skill' and 'Base Stats'
export const AttackOriginTypeSchema = z
  .enum(OriginType)
  .exclude(['INHERENT_SKILL', 'BASE_STATS']);

// ============================================================================
// Attribute Schemas
// ============================================================================

export const AttributeSchema = z.enum(Attribute);

export const AbilityAttributeSchema = z.enum(AbilityAttribute);

// ============================================================================
// Stat Schemas
// ============================================================================

export const CharacterStatSchema = z.enum(CharacterStat);

export const EnemyStatSchema = z.enum(EnemyStat);
