import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const findFirst = vi.fn();

  const database = {
    query: {
      capabilities: {
        findFirst,
      },
    },
    update,
  };

  return {
    where,
    set,
    update,
    findFirst,
    database,
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('updateAdminCapabilityHandler', () => {
  beforeEach(() => {
    mocks.findFirst.mockClear();
    mocks.update.mockClear();
    mocks.set.mockClear();
    mocks.where.mockClear();
  });

  it('updates capability fields when the capability exists', async () => {
    const { updateAdminCapabilityHandler } =
      await import('./update-admin-capability.server');

    mocks.findFirst.mockResolvedValue({ id: 1 });
    mocks.where.mockImplementation(() => {});

    await updateAdminCapabilityHandler({
      capabilityId: 1,
      name: 'Updated Name',
      description: 'Updated Description',
      capabilityJson: {
        type: 'modifier',
        modifiedStats: [],
      },
    });

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.set).toHaveBeenCalledWith({
      name: 'Updated Name',
      description: 'Updated Description',
      capabilityJson: {
        type: 'modifier',
        modifiedStats: [],
      },
    });
  });

  it('throws when capability does not exist', async () => {
    const { updateAdminCapabilityHandler } =
      await import('./update-admin-capability.server');

    mocks.findFirst.mockImplementation(() => {});

    await expect(
      updateAdminCapabilityHandler({
        capabilityId: 999,
        capabilityJson: {
          type: 'attack',
          damageInstances: [
            {
              motionValue: 1,
              tags: ['basicAttack'],
              scalingStat: 'atk',
            },
          ],
          attribute: 'aero',
        },
      }),
    ).rejects.toThrow('Capability not found for ID 999');
  });
});
