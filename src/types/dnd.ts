import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import type {
  CharacterAttack,
  CharacterModifier,
} from '@/services/game-data/get-team-capabilities';

interface DragPreviewData {
  characterIconUrl?: string;
  iconUrl?: string;
  name?: string;
}

export interface SidebarCapabilityDragData {
  kind: 'sidebar-capability';
  capability: CharacterAttack | CharacterModifier;
}

export interface CanvasAttackDragData extends DragPreviewData {
  kind: 'canvas-attack';
  capability: DetailedAttackInstance;
}

export type TimelineDragData = SidebarCapabilityDragData | CanvasAttackDragData;
