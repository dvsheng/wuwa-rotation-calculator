import { arrange, filter, map, tidy } from '@tidyjs/tidy';

import type {
  ClientSensitivityAnalysis,
  ClientSensitivityAnalysisScenario,
} from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import { SensitivityAnalysisCategory } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';

import type {
  SensitivityAnalysisSection,
  SensitivityChartDatum,
} from './result-breakdown.types';
import { truncateChartLabel } from './result-chart.utilities';

// ---------------------------------------------------------------------------
// Section definitions (inlined from sensitivity-analysis.utilities)
// ---------------------------------------------------------------------------

const sectionDefinitions = [
  { category: SensitivityAnalysisCategory.SUBSTAT_ROLL, title: 'Substat Rolls' },
  {
    category: SensitivityAnalysisCategory.THREE_COST_MAIN_STAT_SWAP,
    title: '3-Cost Swaps',
  },
  {
    category: SensitivityAnalysisCategory.FOUR_COST_MAIN_STAT_SWAP,
    title: '4-Cost Swap',
  },
] as const;

const sortByDeltaDesc = (
  a: ClientSensitivityAnalysisScenario,
  b: ClientSensitivityAnalysisScenario,
) => b.totalDamageDelta - a.totalDamageDelta;

// ---------------------------------------------------------------------------
// sensitivitySections — group scenarios by category into titled sections
// ---------------------------------------------------------------------------

export const sensitivitySections = (
  sensitivityAnalysis: ClientSensitivityAnalysis,
): Array<SensitivityAnalysisSection> =>
  sectionDefinitions
    .map((section) => ({
      ...section,
      rows: tidy(
        sensitivityAnalysis.scenarios,
        filter((s) => s.category === section.category),
        arrange([sortByDeltaDesc]),
      ),
    }))
    .filter((section) => section.rows.length > 0);

// ---------------------------------------------------------------------------
// substatSensitivityChartData — bar chart data for substat roll scenarios
// ---------------------------------------------------------------------------

export const substatSensitivityChartData = (
  sensitivityAnalysis: ClientSensitivityAnalysis,
): Array<SensitivityChartDatum> =>
  tidy(
    sensitivityAnalysis.scenarios,
    filter((s) => s.category === SensitivityAnalysisCategory.SUBSTAT_ROLL),
    arrange([sortByDeltaDesc]),
    map(
      (s): SensitivityChartDatum => ({
        id: s.id,
        label: s.label,
        shortLabel: truncateChartLabel(s.label),
        description: s.description,
        value: s.relativeDelta,
        relativeDelta: s.relativeDelta,
      }),
    ),
  );
