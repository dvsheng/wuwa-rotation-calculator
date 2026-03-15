/** Width of one attack column in pixels */
export const COLUMN_WIDTH = 96;

/** Gap between columns in pixels */
export const COLUMN_MARGIN = 4;

/** Gap between timeline rows in pixels */
export const ROW_GAP = 4;

/** Timeline drop target IDs */
export const ATTACK_CANVAS_DROP_ID = 'attack-canvas';
export const BUFF_CANVAS_DROP_ID = 'buff-canvas';

/** dnd-kit draggable types used by the rotation builder */
export const SIDEBAR_ATTACK_DRAG_TYPE = 'attack';
export const SIDEBAR_BUFF_DRAG_TYPE = 'modifier';
export const ATTACK_SORTABLE_DRAG_TYPE = 'canvas-attack';

/** Default width for newly added buffs */
export const BUFF_LENGTH_ON_ADD = 6;

/** Default layout for newly added buffs */
export const INITIAL_BUFF_LAYOUT = {
  x: 0,
  y: 0,
  w: BUFF_LENGTH_ON_ADD,
  h: 1,
} as const;

/** Height of a buff row in pixels */
export const BUFF_ROW_HEIGHT = 48;

/** Total step per column (width + gap) in pixels */
export const COLUMN_STEP = COLUMN_WIDTH + COLUMN_MARGIN;

/** Minimum number of visible columns when the canvas is sparse */
export const MIN_TIMELINE_COLUMNS = 20;

/** Fixed height of a single attack card row in pixels */
export const ATTACK_ROW_HEIGHT = 208;

export const getTimelineColumnCount = (attackCount: number) =>
  Math.max(attackCount, MIN_TIMELINE_COLUMNS);

export const getTimelineWidth = (attackCount: number) =>
  getTimelineColumnCount(attackCount) * COLUMN_STEP;
