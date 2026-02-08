/**
 * Valid weapon refinement levels (1 through 5).
 */
export const RefineLevel = ['1', '2', '3', '4', '5'] as const;

export type RefineLevel = (typeof RefineLevel)[number];
