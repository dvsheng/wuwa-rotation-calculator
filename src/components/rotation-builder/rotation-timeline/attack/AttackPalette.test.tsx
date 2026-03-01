import { render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { OriginType } from '@/services/game-data';

import { AttackPalette } from './AttackPalette';

vi.mock('@/hooks/useTeamDetails');

const { useTeamDetails } = await import('@/hooks/useTeamDetails');
const mockUseTeamDetails = vi.mocked(useTeamDetails);

// Mock ResizeObserver for ScrollArea component
beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const baseMockReturn = {
  buffs: [],
  hasTuneStrain: false,
  isLoading: false,
  isError: false,
};

describe('AttackPalette — Tune Break deduplication', () => {
  it('shows a single Tune Break button in an Other group when multiple characters have tune break attacks', () => {
    mockUseTeamDetails.mockReturnValue({
      ...baseMockReturn,
      attacks: [
        {
          id: 100,
          characterId: 1001,
          characterName: 'Lynae',
          name: 'Spectral Analysis',
          parentName: 'Spectral Analysis',
          originType: OriginType.TUNE_BREAK,
          isTuneBreakAttack: true,
          parameters: [],
        },
        {
          id: 200,
          characterId: 1002,
          characterName: 'Rover',
          name: 'Void Rift',
          parentName: 'Void Rift',
          originType: OriginType.TUNE_BREAK,
          isTuneBreakAttack: true,
          parameters: [],
        },
        {
          id: 300,
          characterId: 1001,
          characterName: 'Lynae',
          name: 'Basic Attack Stage 1',
          parentName: 'Chroma Drift',
          originType: OriginType.NORMAL_ATTACK,
          isTuneBreakAttack: false,
          parameters: [],
        },
      ],
    });

    render(<AttackPalette />);

    // The "Other" group heading is present
    const otherGroupHeading = screen.getByText('Other');
    expect(otherGroupHeading).toBeInTheDocument();

    // Exactly one "Tune Break" palette item exists inside the Other group container
    const otherGroupContainer = otherGroupHeading.closest('div')!;
    expect(within(otherGroupContainer).getAllByText('Tune Break')).toHaveLength(1);

    // Individual tune break capability names are NOT rendered as palette items
    expect(screen.queryByText('Spectral Analysis')).not.toBeInTheDocument();
    expect(screen.queryByText('Void Rift')).not.toBeInTheDocument();

    // Non-tune-break attack still appears under its character group
    expect(screen.getByText('Basic Attack Stage 1')).toBeInTheDocument();
    expect(screen.getByText('Lynae')).toBeInTheDocument();
  });

  it('shows no Other group when no characters have tune break attacks', () => {
    mockUseTeamDetails.mockReturnValue({
      ...baseMockReturn,
      attacks: [
        {
          id: 300,
          characterId: 1001,
          characterName: 'Lynae',
          name: 'Basic Attack Stage 1',
          parentName: 'Chroma Drift',
          originType: OriginType.NORMAL_ATTACK,
          isTuneBreakAttack: false,
          parameters: [],
        },
      ],
    });

    render(<AttackPalette />);

    expect(screen.queryByText('Other')).not.toBeInTheDocument();
  });
});
