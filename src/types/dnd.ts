import type { DetailedAttackInstance } from '@/hooks/useTeamAttackInstances';
import type { DetailedAttack, DetailedModifier } from '@/hooks/useTeamDetails';

interface DragPreviewData {
  characterIconUrl?: string;
  iconUrl?: string;
  name?: string;
}

export interface SidebarCapabilityDragData {
  kind: 'sidebar-capability';
  capability: DetailedAttack | DetailedModifier;
}

export interface CanvasAttackDragData extends DragPreviewData {
  kind: 'canvas-attack';
  capability: DetailedAttackInstance;
}

export type TimelineDragData = SidebarCapabilityDragData | CanvasAttackDragData;
