'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { GoldPanel } from '@/components/common/GoldPanel';
import { cn } from '@/libs/utils';

interface FinancePageHeaderAction {
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Native title attribute — e.g. a tooltip explaining why the action is disabled. */
  title?: string;
}

interface FinancePageHeaderProps {
  title: ReactNode;
  /** Small helper line under the title/stat (e.g. "2 accounts · total balance"). */
  subtitle?: ReactNode;
  /** Prominent readout under the title row, full width (e.g. the wallets total balance). */
  stat?: ReactNode;
  /** Compact control bundled with the action button (e.g. a month stepper or filter select). */
  controls?: ReactNode;
  action: FinancePageHeaderAction;
  /**
   * Hide the title below `sm:` (kept for screen readers via `sr-only`) and let `controls` grow to
   * fill the freed width instead. Use when the title just repeats the active tab label and the
   * control (e.g. a month stepper) is the thing worth the space on a narrow screen.
   */
  hideTitleOnMobile?: boolean;
  className?: string;
}

/**
 * Shared header card for the finance sub-pages (Overview, Wallets, Budget, Goals, Transactions,
 * Categories). Title sits alone on the left; `controls` + the primary action stay bundled as one
 * unit on the right, so on a narrow screen that whole unit wraps below the title at its own
 * natural width instead of stretching into an empty full-width row. The action collapses to an
 * icon-only "+" below `sm:` — a standard, well-understood pattern (Notion, Linear, Todoist)
 * rather than a label that has to fit.
 */
export function FinancePageHeader({
  title,
  subtitle,
  stat,
  controls,
  action,
  hideTitleOnMobile = false,
  className,
}: FinancePageHeaderProps) {
  const titleClassName = hideTitleOnMobile
    ? 'sr-only sm:not-sr-only sm:min-w-0 sm:truncate sm:text-[20px] sm:font-bold sm:tracking-[0.02em] sm:text-[var(--text-hi)] sm:[font-family:var(--f-title)]'
    : 'min-w-0 truncate text-[16px] font-bold tracking-[0.02em] text-[var(--text-hi)] [font-family:var(--f-title)] sm:text-[20px]';

  const rowClassName = hideTitleOnMobile
    ? 'flex w-full items-center gap-2 sm:flex-wrap sm:justify-between sm:gap-x-3 sm:gap-y-2'
    : 'flex flex-wrap items-center justify-between gap-x-3 gap-y-2';

  const clusterClassName = hideTitleOnMobile
    ? 'flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:shrink-0'
    : 'flex shrink-0 items-center gap-2';

  const controlsWrapClassName = hideTitleOnMobile
    ? 'min-w-0 flex-1 sm:w-auto sm:flex-none'
    : undefined;

  return (
    <GoldPanel className={cn('flex flex-col gap-2 p-3 sm:p-4', className)}>
      <div className={rowClassName}>
        <h1 className={titleClassName}>{title}</h1>

        <div className={clusterClassName}>
          {controls && <div className={controlsWrapClassName}>{controls}</div>}

          <Button
            variant="primary"
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.title}
            aria-label={typeof action.label === 'string' ? action.label : undefined}
            className="h-9 w-9 shrink-0 justify-center gap-0 p-0 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-[9px]"
          >
            <span aria-hidden="true">＋</span>
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        </div>
      </div>

      {stat}

      {subtitle && (
        <p className="truncate text-[10px] text-[var(--text-mid)] sm:text-[11px]">{subtitle}</p>
      )}
    </GoldPanel>
  );
}
