export interface Bullet {
  id: string;
  name: string;
  hits: Array<number>;
  hitInterval: number;
  duration: number;
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
