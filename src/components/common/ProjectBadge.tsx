'use client';

import { cn } from '@/libs/utils';
import { Icon } from './Icon';

/** TaskColor token → CSS value. Mirrors projects' COLOR_CSS (includes blue). */
const PROJECT_COLOR: Record<string, string> = {
  gold: 'oklch(0.74 0.17 85)',
  mint: 'oklch(0.76 0.14 162)',
  violet: 'oklch(0.66 0.22 295)',
  cyan: 'oklch(0.76 0.16 205)',
  rose: 'oklch(0.72 0.18 5)',
  amber: 'oklch(0.76 0.16 55)',
  blue: 'oklch(0.65 0.18 250)',
};

interface ProjectBadgeProps {
  name: string;
  icon?: string;
  /** TaskColor token (gold, mint, …). Falls back to violet. */
  color?: string;
  /** Icon-only chip (used in tight layouts like the week mini-card). */
  iconOnly?: boolean;
  className?: string;
}

/** Small label marking a task as belonging to a project. */
export function ProjectBadge({ name, icon, color, iconOnly, className }: ProjectBadgeProps) {
  const c = PROJECT_COLOR[color ?? 'violet'] ?? PROJECT_COLOR.violet;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-[0.06em] font-[var(--font-title)] shrink-0 max-w-[120px] overflow-hidden whitespace-nowrap text-ellipsis',
        className,
      )}
      style={{ color: c, borderColor: `${c}55`, background: `${c}12` }}
      title={`Project · ${name}`}
    >
      <span className="leading-none">
        <Icon icon={icon ?? '◫'} />
      </span>
      {!iconOnly && <span className="overflow-hidden text-ellipsis">{name}</span>}
    </span>
  );
}
