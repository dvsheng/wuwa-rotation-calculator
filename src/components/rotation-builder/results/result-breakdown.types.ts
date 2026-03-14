import type {
  ClientSensitivityAnalysisScenario,
  SensitivityAnalysisCategory,
} from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';

export interface DistributionChartDatum {
  id: string;
  label: string;
  value: number;
  percentage: number;
  fill: string;
}

export interface SensitivityChartDatum {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  value: number;
  relativeDelta: number;
}

export interface SensitivityAnalysisSection {
  category: SensitivityAnalysisCategory;
  title: string;
  rows: Array<ClientSensitivityAnalysisScenario>;
}

export interface SkillOriginDistributionRow {
  originType: string;
  damage: number;
  pctOfCharacter: number;
}
