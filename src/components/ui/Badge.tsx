import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

export type BadgeVariant = 'gold' | 'violet' | 'cyan' | 'mint' | 'rose' | 'crimson' | 'solid';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gold: 'bg-[oklch(0.78_0.16_82_/_0.12)] text-[var(--gold)] border-[oklch(0.78_0.16_82_/_0.4)]',
  violet:
    'bg-[oklch(0.68_0.22_295_/_0.12)] text-[var(--violet)] border-[oklch(0.68_0.22_295_/_0.4)]',
  cyan: 'bg-[oklch(0.78_0.16_205_/_0.12)] text-[var(--cyan)] border-[oklch(0.78_0.16_205_/_0.4)]',
  mint: 'bg-[oklch(0.76_0.14_162_/_0.12)] text-[var(--mint)] border-[oklch(0.76_0.14_162_/_0.4)]',
  rose: 'bg-[oklch(0.74_0.18_5_/_0.12)] text-[var(--rose)] border-[oklch(0.74_0.18_5_/_0.4)]',
  crimson:
    'bg-[oklch(0.62_0.24_22_/_0.12)] text-[var(--crimson)] border-[oklch(0.62_0.24_22_/_0.4)]',
  solid: 'bg-[var(--gold)] text-[#0a0400] border-[var(--gold)]',
};

export function Badge({ children, variant = 'gold', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border rounded-full px-[10px] py-[3px]',
        '[font-family:var(--f-title)] text-[9px] font-bold tracking-[0.18em] uppercase',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
