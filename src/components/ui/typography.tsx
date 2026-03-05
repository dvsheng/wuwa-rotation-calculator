import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode } from 'react';

// ─── Shared prop types ────────────────────────────────────────────────────────

type TypographyProps = HTMLAttributes<HTMLElement> & {
  className?: string;
  children?: ReactNode;
};

// ─── Typography Primitives ────────────────────────────────────────────────────

export function DisplayHeading({ className, children, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        'text-foreground scroll-m-20 text-5xl leading-[1.05] font-black tracking-[-0.03em]',
        className,
      )}
      {...(props as HTMLAttributes<HTMLHeadingElement>)}
    >
      {children}
    </h1>
  );
}

export function PageTitle({ className, children, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        'text-foreground scroll-m-20 text-4xl leading-tight font-bold tracking-tight',
        className,
      )}
      {...(props as HTMLAttributes<HTMLHeadingElement>)}
    >
      {children}
    </h1>
  );
}

export function SectionHeading({ className, children, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        'text-foreground scroll-m-20 text-2xl leading-snug font-semibold tracking-tight',
        className,
      )}
      {...(props as HTMLAttributes<HTMLHeadingElement>)}
    >
      {children}
    </h2>
  );
}

export function CardTitle({ className, children, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        'text-foreground scroll-m-20 text-lg leading-snug font-semibold tracking-tight',
        className,
      )}
      {...(props as HTMLAttributes<HTMLHeadingElement>)}
    >
      {children}
    </h3>
  );
}

export function BodyText({ className, children, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-foreground text-base leading-7 not-first:mt-4', className)}
      {...(props as HTMLAttributes<HTMLParagraphElement>)}
    >
      {children}
    </p>
  );
}

export function SmallText({ className, children, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-muted-foreground text-sm leading-6', className)}
      {...(props as HTMLAttributes<HTMLParagraphElement>)}
    >
      {children}
    </p>
  );
}

export function Label({ className, children, ...props }: TypographyProps) {
  return (
    <span
      className={cn(
        'text-muted-foreground text-xs font-medium tracking-widest uppercase',
        className,
      )}
      {...(props as HTMLAttributes<HTMLSpanElement>)}
    >
      {children}
    </span>
  );
}

export function Caption({ className, children, ...props }: TypographyProps) {
  return (
    <span
      className={cn('text-muted-foreground/70 text-[11px] leading-5', className)}
      {...(props as HTMLAttributes<HTMLSpanElement>)}
    >
      {children}
    </span>
  );
}
