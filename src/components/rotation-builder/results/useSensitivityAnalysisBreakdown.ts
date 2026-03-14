import type { ClientSensitivityAnalysis } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import { SensitivityAnalysisCategory } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';

import type {
  SensitivityAnalysisSection,
  SensitivityChartDatum,
} from './result-breakdown.types';
import { truncateChartLabel } from './result-chart.utilities';
import {
  sensitivitySectionDefinitions,
  sortSensitivityRows,
} from './sensitivity-analysis.utilities';

export const buildSensitivitySections = (
  sensitivityAnalysis: ClientSensitivityAnalysis,
): Array<SensitivityAnalysisSection> =>
  sensitivitySectionDefinitions
    .map((section) => ({
      ...section,
      rows: sensitivityAnalysis.scenarios
        .filter((scenario) => scenario.category === section.category)
        .toSorted(sortSensitivityRows),
    }))
    .filter((section) => section.rows.length > 0);

export const buildSubstatSensitivityChartData = (
  sensitivityAnalysis: ClientSensitivityAnalysis,
): Array<SensitivityChartDatum> =>
  sensitivityAnalysis.scenarios
    .filter(
      (scenario) => scenario.category === SensitivityAnalysisCategory.SUBSTAT_ROLL,
    )
    .toSorted(sortSensitivityRows)
    .map((scenario) => ({
      id: scenario.id,
      label: scenario.label,
      shortLabel: truncateChartLabel(scenario.label),
      description: scenario.description,
      value: scenario.relativeDelta,
      relativeDelta: scenario.relativeDelta,
    }));

export const useSensitivityAnalysisBreakdown = (
  sensitivityAnalysis: ClientSensitivityAnalysis,
) => ({
  sections: buildSensitivitySections(sensitivityAnalysis),
  substatChartData: buildSubstatSensitivityChartData(sensitivityAnalysis),
});
