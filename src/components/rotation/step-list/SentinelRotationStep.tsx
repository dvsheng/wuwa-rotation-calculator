import { useDroppable } from '@dnd-kit/core';

export const ROTATION_LIST_SENTINEL_ID = 'rotation-list-sentinel';

export const SentinelRotationStep = () => {
  const { setNodeRef, isOver } = useDroppable({
    id: ROTATION_LIST_SENTINEL_ID,
  });

  return (
    <div
      ref={setNodeRef}
      className={`mt-2 flex h-12 items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-transparent'
      }`}
    >
      {isOver && (
        <span className="text-primary text-xs font-medium">Drop to add to end</span>
      )}
    </div>
  );
};
