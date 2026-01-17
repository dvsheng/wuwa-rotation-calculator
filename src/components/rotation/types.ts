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
  isParameterized: boolean;
  parameterValue?: number;
}
