import { SensitivityAnalysisCategory } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import type { ClientSensitivityAnalysisScenario } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';

export const sensitivitySectionDefinitions = [
  {
    category: SensitivityAnalysisCategory.SUBSTAT_ROLL,
    title: 'Substat Rolls',
  },
  {
    category: SensitivityAnalysisCategory.THREE_COST_MAIN_STAT_SWAP,
    title: '3-Cost Swaps',
  },
  {
    category: SensitivityAnalysisCategory.FOUR_COST_MAIN_STAT_SWAP,
    title: '4-Cost Swap',
  },
] as const;

export const sortSensitivityRows = (
  left: ClientSensitivityAnalysisScenario,
  right: ClientSensitivityAnalysisScenario,
) => right.totalDamageDelta - left.totalDamageDelta;
