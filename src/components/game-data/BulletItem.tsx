import type { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import type { Bullet } from '@/services/game-data-v2/bullets';

type BulletTimelineRow = {
  order: number;
  sortTime: number;
  time: string;
  type: string;
  id: string;
};

const formatTime = (time: number) => `${time.toFixed(3)}s`;

const getTimelineRows = (bullet: Bullet): Array<BulletTimelineRow> => {
  const hitRows = bullet.hits.map((hitId, index) => ({
    order: index,
    sortTime: index * bullet.hitInterval,
    time: formatTime(index * bullet.hitInterval),
    type: 'hit',
    id: String(hitId),
  }));

  const childRows = bullet.children.map((child, index) => ({
    order: bullet.hits.length + index,
    sortTime: child.delay,
    time: formatTime(child.delay),
    type: `childBullet x ${child.count}`,
    id: String(child.bulletId),
  }));

  return [...hitRows, ...childRows].toSorted((left, right) => {
    if (left.sortTime !== right.sortTime) {
      return left.sortTime - right.sortTime;
    }

    if (left.type !== right.type) {
      return left.type === 'hit' ? -1 : 1;
    }

    return left.id.localeCompare(right.id) || left.order - right.order;
  });
};

const columns: Array<ColumnDef<BulletTimelineRow>> = [
  {
    accessorKey: 'time',
    header: 'Time',
    meta: {
      headerClassName: 'min-w-24',
      cellClassName: 'min-w-24 font-mono text-sm',
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    meta: {
      headerClassName: 'min-w-40',
      cellClassName: 'min-w-40',
    },
  },
  {
    accessorKey: 'id',
    header: 'ID',
    meta: {
      headerClassName: 'min-w-24',
      cellClassName: 'min-w-24 font-mono text-sm',
    },
  },
];

export const BulletItem = ({ bullet }: { bullet: Bullet }) => {
  const rows = getTimelineRows(bullet);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 py-4">
        <div className="space-y-2">
          <CardTitle className="text-base">
            {bullet.name || `Bullet ${bullet.id}`}
          </CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className="font-mono">
              {bullet.id}
            </Badge>
            <Badge variant="secondary">{bullet.hits.length} hits</Badge>
            <Badge variant="secondary">{bullet.children.length} child bullets</Badge>
            <Badge variant="secondary">duration: {formatTime(bullet.duration)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage="No hits or child bullets."
          classNames={{
            wrapper: 'bg-muted/30 rounded-md border',
          }}
        />
      </CardContent>
    </Card>
  );
};
