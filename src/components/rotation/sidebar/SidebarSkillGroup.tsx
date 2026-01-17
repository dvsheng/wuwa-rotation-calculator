import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/typography';

import { DraggableItem } from '../../common/DragableItem';
import { SIDEBAR_ORIGIN } from '../constants';
import type { RotationItem } from '../types';

import { SidebarDamageInstance } from './SidebarDamageInstance';

interface SidebarSkillGroupProps {
  skillName: string;
  originType: string;
  items: Array<RotationItem>;
  onSkillClick: (item: Omit<RotationItem, 'id'>) => void;
  isDragging: boolean;
}

export const SidebarSkillGroup = ({
  skillName,
  originType,
  items,
  onSkillClick,
  isDragging,
}: SidebarSkillGroupProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1">
        <Text
          variant="small"
          className="text-muted-foreground text-[10px] font-semibold uppercase"
        >
          {skillName}
        </Text>
        <Badge
          variant="outline"
          className="h-3.5 px-1 text-[8px] font-normal opacity-70"
        >
          {originType}
        </Badge>
      </div>

      <div className="grid min-w-0 gap-1 pl-2">
        {items.map((item) => (
          <DraggableItem
            key={item.id}
            id={item.id}
            data={{ item, origin: SIDEBAR_ORIGIN }}
          >
            <SidebarDamageInstance
              item={item}
              onClick={() => onSkillClick(item)}
              isDragging={isDragging}
            />
          </DraggableItem>
        ))}
      </div>
    </div>
  );
};
