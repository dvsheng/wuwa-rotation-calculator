import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { EntitySelectionDialog } from './EntitySelectionDialog';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

const CHARACTER_ITEMS = [
  {
    id: 1,
    name: 'Jiyan',
    attribute: 'aero',
    weaponType: 'Broadblade',
    rarity: 5,
  } as const,
  {
    id: 2,
    name: 'Calcharo',
    attribute: 'electro',
    weaponType: 'Broadblade',
    rarity: 5,
  } as const,
  {
    id: 3,
    name: 'Baizhi',
    attribute: 'glacio',
    weaponType: 'Rectifier',
    rarity: 4,
  } as const,
];

const ECHO_ITEMS = [
  { id: 10, name: 'Tempest Mephis', cost: 4, sets: [1] },
  { id: 11, name: 'Feilian Beringal', cost: 3, sets: [1] },
  { id: 12, name: 'Excarat', cost: 1, sets: [2] },
];

const ECHO_ITEMS_UNSORTED = [
  { id: 12, name: 'Excarat', cost: 1, sets: [2] },
  { id: 10, name: 'Tempest Mephis', cost: 4, sets: [1] },
  { id: 11, name: 'Feilian Beringal', cost: 3, sets: [1] },
];

const openDialog = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Jiyan' }));
  const dialog = await screen.findByRole('dialog');
  const input = within(dialog).getByPlaceholderText('Search...');
  return { dialog, input };
};

describe('EntitySelectionDialog', () => {
  it('shows selected entity name in trigger button', () => {
    render(
      <EntitySelectionDialog
        items={CHARACTER_ITEMS}
        value={1}
        onValueChange={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Jiyan' })).toBeInTheDocument();
  });

  it('shows placeholder when there are no items', () => {
    render(<EntitySelectionDialog items={[]} value={999} onValueChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Click to select' })).toBeInTheDocument();
  });

  it('shows character-specific filters and omits physical attribute', async () => {
    render(
      <EntitySelectionDialog
        items={CHARACTER_ITEMS}
        value={1}
        onValueChange={() => {}}
      />,
    );
    const { dialog } = await openDialog();

    expect(within(dialog).getByRole('button', { name: 'aero' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'electro' })).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'physical' }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Broadblade' }),
    ).toBeInTheDocument();
  });

  it('filters by search term case-insensitively', async () => {
    render(
      <EntitySelectionDialog
        items={CHARACTER_ITEMS}
        value={1}
        onValueChange={() => {}}
      />,
    );
    const { dialog, input } = await openDialog();

    await userEvent.type(input, 'cal');

    expect(within(dialog).getByText('Calcharo')).toBeInTheDocument();
    expect(within(dialog).queryByText('Jiyan')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Baizhi')).not.toBeInTheDocument();
  });

  it('excludes entities from selectable list when excludeIds is provided', async () => {
    render(
      <EntitySelectionDialog
        items={CHARACTER_ITEMS}
        value={1}
        excludeIds={[2]}
        onValueChange={() => {}}
      />,
    );
    const { dialog } = await openDialog();

    expect(within(dialog).queryByText('Calcharo')).not.toBeInTheDocument();
    expect(within(dialog).getByText('Jiyan')).toBeInTheDocument();
    expect(within(dialog).getByText('Baizhi')).toBeInTheDocument();
  });

  it('shows cost filters for echoes and not character-only filters', async () => {
    render(
      <EntitySelectionDialog items={ECHO_ITEMS} value={10} onValueChange={() => {}} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tempest Mephis' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('button', { name: 'Cost 4' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cost 3' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cost 1' })).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: '5★' }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'Broadblade' }),
    ).not.toBeInTheDocument();
  });

  it('sorts echoes by cost descending when rarity is not present', async () => {
    render(
      <EntitySelectionDialog
        items={ECHO_ITEMS_UNSORTED}
        value={10}
        onValueChange={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tempest Mephis' }));
    const dialog = await screen.findByRole('dialog');
    const dialogText = dialog.textContent;

    expect(dialogText.indexOf('Tempest Mephis')).toBeLessThan(
      dialogText.indexOf('Feilian Beringal'),
    );
    expect(dialogText.indexOf('Feilian Beringal')).toBeLessThan(
      dialogText.indexOf('Excarat'),
    );
  });
});
