export interface RotationItem {
  id: string;
  characterId: string;
  characterName: string;
  skillName: string;
  damageInstanceName: string;
  originType: string;
  description: string;
}

export interface TimelineBuff {
  timelineId: string;
  characterId: string;
  characterName: string;
  skillName: string;
  description: string;
  x: number;
  y: number;
  w: number;
  h: number;
  parameterValue?: number;
}

/**
 * Shared grid configuration for horizontal alignment between
 * RotationAttackSequence and BuffTimelineCanvas
 */
export interface SharedGridConfig {
  cols: number;
  width: number;
  colWidth: number;
  margin: [number, number];
  containerPadding: [number, number];
}

export const COL_WIDTH = 140;
export const GRID_MARGIN: [number, number] = [4, 0];
export const GRID_PADDING: [number, number] = [0, 0];

export function createSharedGridConfig(
  attackCount: number,
  containerWidth: number,
): SharedGridConfig {
  const cols = Math.max(attackCount + 1, 5);
  const width = Math.max(containerWidth, cols * COL_WIDTH);

  return {
    cols,
    width,
    colWidth: COL_WIDTH,
    margin: GRID_MARGIN,
    containerPadding: GRID_PADDING,
  };
}
