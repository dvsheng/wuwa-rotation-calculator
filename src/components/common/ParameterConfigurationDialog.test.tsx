import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { RotationSectionSheetContainerContext } from '@/components/rotation-builder/rotation-timeline/RotationSectionSheetContainerContext';
import { CapabilityType, OriginType } from '@/services/game-data';
import { Attribute } from '@/types';

import { ParameterConfigurationDialog } from './ParameterConfigurationDialog';

const capability = {
  instanceId: 'attack-1',
  id: 1,
  entityId: 1,
  characterId: 1,
  name: 'Configure Me',
  description: 'Contextual configuration should stay inside the rotation section.',
  characterName: 'Rover',
  iconUrl: '',
  characterIconUrl: '',
  parentName: 'Basic Attack',
  capabilityType: CapabilityType.ATTACK,
  originType: OriginType.NORMAL_ATTACK,
  attribute: Attribute.SPECTRO,
  damageInstances: [],
  parameters: [
    {
      id: '0' as const,
      minimum: 0,
      maximum: 10,
      value: 5,
      valueConfiguration: undefined,
    },
  ],
};

function TestHarness() {
  const [rotationSection, setRotationSection] = useState<HTMLDivElement | undefined>();

  return (
    <div>
      <div data-testid="nav-menu">Navigation menu</div>
      <div data-testid="toolbar-buttons">Toolbar buttons</div>
      <RotationSectionSheetContainerContext.Provider value={rotationSection}>
        <div
          ref={(node) => setRotationSection(node ?? undefined)}
          data-testid="rotation-section"
          className="relative h-96 overflow-hidden"
        >
          <ParameterConfigurationDialog capability={capability}>
            <button type="button">Open configuration</button>
          </ParameterConfigurationDialog>
        </div>
      </RotationSectionSheetContainerContext.Provider>
    </div>
  );
}

describe('ParameterConfigurationDialog', () => {
  it('renders a contextual non-modal sheet inside the rotation section instead of covering sibling ui', async () => {
    render(<TestHarness />);

    await userEvent.click(screen.getByRole('button', { name: 'Open configuration' }));

    const sheetContent = screen
      .getByText('Configure Configure Me')
      .closest<HTMLElement>('[data-slot="parameter-sheet"]');
    const rotationSection = screen.getByTestId('rotation-section');
    const navMenu = screen.getByTestId('nav-menu');
    const toolbarButtons = screen.getByTestId('toolbar-buttons');

    expect(sheetContent).toBeInTheDocument();
    expect(sheetContent).toHaveClass('absolute');
    expect(rotationSection).toContainElement(sheetContent);
    expect(navMenu).not.toContainElement(sheetContent);
    expect(toolbarButtons).not.toContainElement(sheetContent);
    expect(
      within(rotationSection).getByRole('button', { name: 'Save changes' }),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="sheet-overlay"]'),
    ).not.toBeInTheDocument();
  });
});
