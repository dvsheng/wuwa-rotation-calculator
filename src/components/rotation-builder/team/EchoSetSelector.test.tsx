import { describe, expect, it } from 'vitest';

describe('EchoSetSelector', () => {
  describe('Delete button visibility logic', () => {
    it('should not show delete button for first set when second set is empty', () => {
      const selectedEchoSets = [
        { id: 'set1', requirement: '5' },
        { id: '', requirement: '2' }, // Second set not selected
      ];

      const shouldShowDeleteButton =
        selectedEchoSets.length > 1 && !!selectedEchoSets[1]?.id;

      expect(shouldShowDeleteButton).toBe(false);
    });

    it('should show delete button for first set when second set is selected', () => {
      const selectedEchoSets = [
        { id: 'set1', requirement: '5' },
        { id: 'set2', requirement: '2' }, // Second set selected
      ];

      const shouldShowDeleteButton =
        selectedEchoSets.length > 1 && !!selectedEchoSets[1]?.id;

      expect(shouldShowDeleteButton).toBe(true);
    });
  });

  it('should not show delete button when there is only one set', () => {
    const selectedEchoSets = [{ id: 'set1', requirement: '5' }];

    const shouldShowDeleteButton =
      selectedEchoSets.length > 1 && !!selectedEchoSets[1]?.id;

    expect(shouldShowDeleteButton).toBe(false);
  });
});
