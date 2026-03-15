import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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

describe('ParameterConfigurationDialog', () => {
  it('opens the configuration sheet with its save controls', async () => {
    render(
      <ParameterConfigurationDialog capability={capability}>
        <button type="button">Open configuration</button>
      </ParameterConfigurationDialog>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open configuration' }));

    expect(screen.getByText('Configure Configure Me')).toBeInTheDocument();
    expect(screen.getByText(capability.description)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sheet-overlay"]')).toBeInTheDocument();
  });

  it('notifies when the sheet closes after saving', async () => {
    const onOpenChange = vi.fn();

    render(
      <ParameterConfigurationDialog capability={capability} onOpenChange={onOpenChange}>
        <button type="button">Open configuration</button>
      </ParameterConfigurationDialog>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open configuration' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
