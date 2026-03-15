export const rotationResultDataTableClassNames = {
  wrapper: 'bg-card min-w-0 rounded-lg w-full',
  scrollArea: 'h-full min-h-0 overflow-hidden [&>div]:h-full [&>div]:overflow-auto',
  headerRow: 'hover:bg-transparent',
  headerCell:
    'sticky top-0 z-20 bg-muted/90 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm',
  row: 'cursor-pointer transition-colors',
  cell: 'py-inset',
};

export const rotationResultTableColumnLayout = {
  index: 'w-[9rem] min-w-[9em]',
  attack: 'w-full min-w-[18rem]',
  damage: 'w-[10rem] min-w-[10rem]',
  details: 'w-[3rem] min-w-[3rem]',
  expand: 'w-[3rem] min-w-[3rem]',
  magnitude: 'w-[6rem] min-w-[6rem]',
} as const;
