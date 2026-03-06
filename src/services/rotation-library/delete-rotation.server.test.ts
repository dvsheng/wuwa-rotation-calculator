import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const returning = vi.fn();
  const where = vi.fn(() => ({ returning }));
  const delete_ = vi.fn(() => ({ where }));

  const database = {
    delete: delete_,
  };

  return {
    delete_,
    where,
    returning,
    database,
  };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('deleteRotationHandler', () => {
  beforeEach(() => {
    mocks.delete_.mockClear();
    mocks.where.mockClear();
    mocks.returning.mockClear();
  });

  it('deletes an existing rotation', async () => {
    const { deleteRotationHandler } = await import('./delete-rotation.server');

    mocks.returning.mockResolvedValue([{ id: 1 }]);

    const result = await deleteRotationHandler({
      ownerId: 'dev-local-owner',
      id: 1,
    });

    expect(mocks.delete_).toHaveBeenCalledTimes(1);
    expect(mocks.where).toHaveBeenCalledTimes(1);
    expect(mocks.returning).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });

  it('throws when rotation does not exist for owner', async () => {
    const { deleteRotationHandler } = await import('./delete-rotation.server');

    mocks.returning.mockResolvedValue([]);

    await expect(
      deleteRotationHandler({
        ownerId: 'dev-local-owner',
        id: 999,
      }),
    ).rejects.toThrow('Rotation not found for ID 999');
  });
});
