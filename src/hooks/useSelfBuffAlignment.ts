import { Target } from '@/services/game-data/types';
import { useStore } from '@/store';

interface BuffPosition {
  x: number;
  w: number;
  characterId: number;
  target: string;
}

export interface SelfBuffAlignmentResult {
  /** Whether this is a self-targeting buff */
  isSelf: boolean;
  /** Array of booleans indicating if each column is aligned (true) or not (false) */
  columnAlignments: Array<boolean>;
  /** Overall status: all aligned, all misaligned, or mixed */
  status: 'all-aligned' | 'all-misaligned' | 'mixed' | 'not-self';
}

/**
 * Hook to determine column-by-column alignment for self-targeting buffs.
 *
 * For self buffs, each column (attack position) is checked to see if there's
 * an attack from the same character at that position.
 *
 * Returns detailed alignment info that can be used to render partial fills.
 */
export const useSelfBuffAlignment = (buff: BuffPosition): SelfBuffAlignmentResult => {
  const attacks = useStore((state) => state.attacks);

  // Non-self buffs don't need alignment checking
  if (buff.target !== Target.SELF) {
    return {
      isSelf: false,
      columnAlignments: Array.from({ length: buff.w }, () => true),
      status: 'not-self' as const,
    };
  }

  // Check alignment for each column the buff covers
  const columnAlignments: Array<boolean> = [];
  for (let index = 0; index < buff.w; index++) {
    const attackIndex = buff.x + index;
    const attack = attacks[attackIndex] as (typeof attacks)[number] | undefined;
    // Column is aligned if there's an attack from the same character
    const isAligned = attack?.characterId === buff.characterId;
    columnAlignments.push(isAligned);
  }

  // Determine overall status
  const alignedCount = columnAlignments.filter(Boolean).length;
  let status: SelfBuffAlignmentResult['status'];
  if (alignedCount === 0) {
    status = 'all-misaligned';
  } else if (alignedCount === buff.w) {
    status = 'all-aligned';
  } else {
    status = 'mixed';
  }

  return {
    isSelf: true,
    columnAlignments,
    status,
  };
};

export interface AlignmentSegment {
  /** Start position as percentage (0-100) */
  start: number;
  /** Width as percentage */
  width: number;
}

/**
 * Generates an array of aligned segments for rendering individual fills.
 * Each segment represents a contiguous run of aligned columns.
 */
export const getAlignmentSegments = (
  columnAlignments: Array<boolean>,
): Array<AlignmentSegment> => {
  if (columnAlignments.length === 0) return [];

  const segmentWidth = 100 / columnAlignments.length;
  const segments: Array<AlignmentSegment> = [];

  let currentStart: number | undefined;

  for (const [index, isAligned] of columnAlignments.entries()) {
    if (isAligned) {
      if (currentStart === undefined) {
        // Start a new segment
        currentStart = index * segmentWidth;
      }
    } else {
      if (currentStart !== undefined) {
        // End the current segment
        segments.push({
          start: currentStart,
          width: index * segmentWidth - currentStart,
        });
        currentStart = undefined;
      }
    }
  }

  // Handle segment that extends to the end
  if (currentStart !== undefined) {
    segments.push({
      start: currentStart,
      width: 100 - currentStart,
    });
  }

  return segments;
};
