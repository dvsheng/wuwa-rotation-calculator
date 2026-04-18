export interface Bullet {
  id: string;
  name: string;
  hits: Array<number>;
  hitInterval: number;
  duration: number;
  /**
   * Tags that must be active to fire th bullet
   */
  requiredTags: Array<string>;
  /**
   * Tags that suppress the bullet from firing if present
   */
  forbiddenTags: Array<string>;
  shouldDestroyOnSkillEnd: boolean;
  children: Array<{
    bulletId: number;
    delay: number;
    count: number;
  }>;
  onHitBuffs: {
    attacker: Array<number>;
    victim: Array<number>;
    energy: Array<number>;
    onField: Array<number>;
  };
}
