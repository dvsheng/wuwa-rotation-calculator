/**
 * Unified palette item type for both attacks and buffs.
 * Used for drag-and-drop from the sidebar/palette into the rotation timeline.
 */
export interface PaletteItem {
  /** Unique identifier for drag operations */
  id: string;
  /** Type discriminator for handling drops */
  type: 'attack' | 'buff';
  /** Character this item belongs to */
  characterId: string;
  characterName: string;
  /** Display name of the item */
  name: string;
  /** Description shown in tooltip */
  description: string;
  /** Optional group/parent name (e.g., skill name for attack instances) */
  groupName?: string;
  /** Source of the item */
  source: 'character' | 'weapon' | 'echo-set' | 'echo';
  /** Additional metadata specific to the item type */
  metadata?: Record<string, unknown>;
}

export interface RotationDisplayItemProps {
  characterName: string;
  name: string;
  description?: string;
}

export const PALETTE_DRAG_TYPE = 'application/palette-item';
