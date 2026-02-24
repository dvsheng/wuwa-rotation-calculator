import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export const badgePillVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform,filter]',
  {
    variants: {
      size: {
        sm: 'h-5 px-2 text-[10px]',
        md: 'h-6 px-2.5 text-xs',
        lg: 'h-7 px-3 text-sm',
      },
      outline: {
        none: 'border-transparent',
        subtle: 'border border-border/70',
        default: 'border border-current/40',
        strong: 'border-2 border-current/60',
      },
      fill: {
        none: 'bg-transparent',
        subtle: 'bg-muted/60',
        solid: 'bg-primary text-primary-foreground',
      },
      text: {
        default: 'text-foreground',
        muted: 'text-muted-foreground',
        strong: 'text-foreground font-semibold',
        inverse: 'text-primary-foreground',
      },
      layout: {
        flex: 'w-fit shrink-0',
        fixed: 'w-24 shrink-0',
      },
      interaction: {
        static: '',
        clickable: 'cursor-pointer',
        draggable: 'cursor-grab active:cursor-grabbing',
      },
      selected: {
        true: 'ring-current/30 ring-2 ring-offset-1 shadow-sm -translate-y-px brightness-95',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      outline: 'default',
      fill: 'none',
      text: 'default',
      layout: 'flex',
      interaction: 'static',
      selected: false,
    },
  },
);

export type BadgePillVariants = VariantProps<typeof badgePillVariants>;
