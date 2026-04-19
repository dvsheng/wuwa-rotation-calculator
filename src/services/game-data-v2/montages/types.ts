/**
 * A bullet fired by a track at a specific time
 */
export interface MontageBullet {
  time: number;
  bulletId: string;
}

/**
 * A tag added to game state by the montage at a specified time for a specified duration
 */
export interface MontageTag {
  name: string;
  time: number;
  duration?: number;
}

/**
 * An option for the sequence of bullets the montage fires
 */
export type MontageTrack = Array<MontageBullet>;

/**
 * An event fired off by a montage at a specified time
 */
export interface MontageEvent {
  name: string;
  time: number;
}

/**
 * An animation that stitches together a sequence of bullets, tags, and effects at specified time intervals
 */
export interface Montage {
  name: string;
  id: string;
  dedupedNames?: Array<string>;
  bullets: Array<MontageBullet>;
  cancelTime?: number;
  endTime?: number;
  tags: Array<MontageTag>;
  events: Array<MontageEvent>;
}
