import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  placement?: TooltipPlacement;
  className?: string;
}

const placementStyles: Record<
  TooltipPlacement,
  { container: string; tip: string; arrow: string }
> = {
  top: {
    container: 'bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2',
    tip: 'origin-bottom',
    arrow:
      'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[var(--border-hi)]',
  },
  bottom: {
    container: 'top-[calc(100%+8px)] left-1/2 -translate-x-1/2',
    tip: 'origin-top',
    arrow:
      'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[var(--border-hi)]',
  },
  left: {
    container: 'right-[calc(100%+8px)] top-1/2 -translate-y-1/2',
    tip: 'origin-right',
    arrow:
      'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[var(--border-hi)]',
  },
  right: {
    container: 'left-[calc(100%+8px)] top-1/2 -translate-y-1/2',
    tip: 'origin-left',
    arrow:
      'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[var(--border-hi)]',
  },
};

export function Tooltip({
  children,
  content,
  placement = 'top',
  className,
}: TooltipProps) {
  const { container, arrow } = placementStyles[placement];

  return (
    <span className={cn('relative inline-block group', className)}>
      {children}
      <span
        className={cn(
          'absolute z-30 px-[10px] py-[5px] whitespace-nowrap pointer-events-none',
          'bg-[var(--bg-3)] border border-[var(--border-hi)] rounded-[var(--r-sm)]',
          'text-[11px] text-[var(--text-hi)] shadow-[var(--sh-2)]',
          'opacity-0 translate-y-1 transition-all duration-[180ms] [transition-timing-function:var(--ease-out)]',
          'group-hover:opacity-100 group-hover:translate-y-0',
          container,
        )}
      >
        {content}
        <span className={cn('absolute border-[5px] border-solid', arrow)} />
      </span>
    </span>
  );
}
