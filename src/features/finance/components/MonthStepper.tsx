'use client';

import { useLocale } from 'next-intl';

import { cn } from '@/libs/utils';

import { formatMonthLabel, shiftMonth } from '../utils';

interface MonthStepperProps {
  /** "YYYY-MM" */
  month: string;
  onChange: (month: string) => void;
  className?: string;
}

/** ◂ August 2026 ▸ — the month selector shared by the Overview and Budget tabs. */
export function MonthStepper({ month, onChange, className }: MonthStepperProps) {
  const locale = useLocale();
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--panel2)] p-1',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, -1))}
        className={arrowBtn}
        aria-label="Previous month"
      >
        ◂
      </button>
      <span className="min-w-[110px] text-center text-[11px] font-bold tracking-[0.04em] text-[var(--text-hi)] [font-family:var(--f-title)]">
        {formatMonthLabel(month, locale)}
      </span>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, 1))}
        className={arrowBtn}
        aria-label="Next month"
      >
        ▸
      </button>
    </div>
  );
}

const arrowBtn =
  'flex h-6 w-6 items-center justify-center rounded-[var(--r-xs)] text-[var(--text-mid)] transition-colors hover:text-[var(--gold)]';
