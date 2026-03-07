import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteRotationHandler } from './delete-rotation.server';

const mocks = vi.hoisted(() => {
  const findFirst = vi.fn();
  const where = vi.fn();
  const delete_ = vi.fn(() => ({ where }));

  const database = {
    query: { rotations: { findFirst } },
    delete: delete_,
  };

  return { findFirst, delete_, where, database };
});

vi.mock('@/db/client', () => ({
  database: mocks.database,
}));

describe('deleteRotationHandler', () => {
  beforeEach(() => {
    mocks.findFirst.mockClear();
    mocks.delete_.mockClear();
    mocks.where.mockClear();
  });

  it('deletes an existing rotation', async () => {
    mocks.findFirst.mockResolvedValue({ id: 1, ownerId: 'dev-local-owner' });
    const result = await deleteRotationHandler({ id: 1 }, 'dev-local-owner');
    expect(mocks.delete_).toHaveBeenCalledTimes(1);
    expect(mocks.where).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });

  it('throws when rotation does not exist', async () => {
    mocks.findFirst.mockResolvedValue(undefined as any);
    await expect(deleteRotationHandler({ id: 999 }, 'dev-local-owner')).rejects.toThrow(
      'Rotation not found for ID 999',
    );
  });

  it('throws when rotation belongs to a different user', async () => {
    mocks.findFirst.mockResolvedValue({ id: 1, ownerId: 'other-user' });
    await expect(deleteRotationHandler({ id: 1 }, 'dev-local-owner')).rejects.toThrow(
      'Rotation 1 does not belong to the current user',
    );
  });
});
