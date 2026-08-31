'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

import { currentMonthKey, formatMonthLabel, shiftMonth } from '../../utils';

const SESSION_KEY = 'finance_monthly_report_nudge_dismissed';
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface MonthlyReportBannerProps {
  /** The month currently selected via MonthStepper on the Overview page. */
  month: string;
}

/**
 * Entry point into the Monthly Report:
 * - Browsing a month that has already ended (via MonthStepper) → CTA for that exact month.
 * - Viewing the current (default) month → a dismissible nudge for last month's report instead,
 *   so the report is discoverable without the user having to step back manually.
 */
export function MonthlyReportBanner({ month }: MonthlyReportBannerProps) {
  const t = useTranslations('finance');
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const current = currentMonthKey();

  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1',
  );

  const isPastMonth = month < current;
  const reportMonth = isPastMonth ? month : shiftMonth(current, -1);

  if (!isPastMonth && (month !== current || dismissed)) return null;

  function handleDismiss() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setDismissed(true);
  }

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: EASE_OUT }}
      className="flex flex-wrap items-center gap-2 rounded-[var(--r-lg)] border border-[var(--gold-border)] bg-[oklch(0.74_0.17_85_/_0.07)] px-3 py-2 sm:gap-3 sm:px-4 sm:py-3"
    >
      <span aria-hidden className="text-[13px] text-[var(--gold)]">
        📊
      </span>
      <p className="min-w-[16ch] flex-1 text-[12px] text-[var(--text-hi)]">
        {isPastMonth
          ? t('monthlyReport.pastMonthBanner', { month: formatMonthLabel(reportMonth, locale) })
          : t('monthlyReport.previousMonthNudge', { month: formatMonthLabel(reportMonth, locale) })}
      </p>
      <Link href={{ pathname: '/finance/monthly-report', query: { month: reportMonth } }}>
        <Button variant="ghost" size="sm">
          {t('monthlyReport.viewReport')}
        </Button>
      </Link>
      {!isPastMonth && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t('monthlyReport.dismiss')}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-[13px] text-[var(--text-lo)] transition-colors hover:text-[var(--text-hi)] cursor-pointer"
        >
          ×
        </button>
      )}
    </motion.div>
  );
}
