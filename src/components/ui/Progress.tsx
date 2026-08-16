import { cn } from '@/libs/utils';

export type ProgressVariant = 'gold' | 'violet' | 'cyan' | 'mint' | 'danger';

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  tall?: boolean;
  xp?: boolean;
  /** Sweep a highlight across the filled part — for bars still in progress. */
  shimmer?: boolean;
  label?: string;
  className?: string;
}

const barStyles: Record<ProgressVariant, string> = {
  gold: 'bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold)] shadow-[0_0_12px_var(--gold-glow)]',
  violet:
    'bg-gradient-to-r from-[var(--violet-2)] to-[var(--violet)] shadow-[0_0_12px_var(--violet-glow)]',
  cyan: 'bg-gradient-to-r from-[oklch(0.55_0.16_205)] to-[var(--cyan)] shadow-[0_0_12px_var(--cyan-glow)]',
  mint: 'bg-gradient-to-r from-[oklch(0.55_0.14_162)] to-[var(--mint)] shadow-[0_0_12px_var(--mint-glow)]',
  danger:
    'bg-gradient-to-r from-[oklch(0.50_0.20_22)] to-[var(--crimson)] shadow-[0_0_12px_var(--crimson-glow)]',
};

export function Progress({
  value,
  max = 100,
  variant = 'gold',
  tall,
  xp,
  label,
  className,
  shimmer,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  if (xp) {
    return (
      <div
        className={cn(
          'relative bg-[var(--bg-3)] border border-[var(--border)] rounded-full h-[18px] overflow-hidden',
          className,
        )}
      >
        <div
          className="h-full rounded-[inherit] transition-[width] duration-500 relative"
          style={{
            width: `${pct}%`,
            background:
              'linear-gradient(90deg, var(--gold-2), var(--gold) 60%, oklch(0.85 0.18 60))',
            boxShadow: '0 0 16px var(--gold-glow), inset 0 1px 0 oklch(1 0 0 / 0.3)',
          }}
        />
        {label && (
          <span
            className="absolute inset-0 flex items-center justify-center [font-family:var(--f-title)] text-[11px] font-bold tracking-[0.12em] text-[var(--text-hi)] z-[2]"
            style={{ textShadow: '0 0 4px oklch(0 0 0 / 0.6)' }}
          >
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full bg-[var(--bg-3)] rounded-full overflow-hidden relative',
        tall ? 'h-[14px]' : 'h-2',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-[inherit] transition-[width] duration-500',
          barStyles[variant],
          shimmer && SHIMMER_CLASSES,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * The sweeping highlight used on the hero XP bar, as a pseudo-element on the filled part.
 * Held still for users who asked for reduced motion.
 */
const SHIMMER_CLASSES = [
  "relative overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:left-[-100%]",
  'after:w-[60%] after:bg-[linear-gradient(90deg,transparent,oklch(1_0_0_/_0.35),transparent)]',
  'after:animate-[shimmer_2.5s_infinite] motion-reduce:after:animate-none',
].join(' ');
