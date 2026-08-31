'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import { useBudgets } from '../../hooks/useBudgets';
import { useFinanceOverview } from '../../hooks/useFinanceOverview';
import { formatMonthLabel } from '../../utils';
import { BookFlip } from './BookFlip';
import { ReportBudgetPage } from './ReportBudgetPage';
import { ReportOverviewPage } from './ReportOverviewPage';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface MonthlyReportPageProps {
  /** "YYYY-MM" — already validated (past month) by the server page. */
  month: string;
}

export function MonthlyReportPage({ month }: MonthlyReportPageProps) {
  const t = useTranslations('finance');
  const locale = useLocale();
  const reduceMotion = useReducedMotion();

  const { data: overview, isLoading: overviewLoading } = useFinanceOverview(month);
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(month);
  const isLoading = overviewLoading || budgetsLoading;

  const overallBudget = budgets.find((b) => b.categoryId === null) ?? null;
  const totalBudgetLimit = overallBudget
    ? overallBudget.limit
    : budgets.filter((b) => b.categoryId !== null).reduce((sum, b) => sum + b.limit, 0);

  const totalExpense = overview?.expense ?? 0;
  const savings =
    totalBudgetLimit > 0 && totalExpense < totalBudgetLimit
      ? totalBudgetLimit - totalExpense
      : null;
  const savingsPercent =
    savings != null && totalBudgetLimit > 0 ? Math.round((savings / totalBudgetLimit) * 100) : null;
  const overBudget = budgets.filter((b) => b.percentage >= 100);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-2 sm:p-4">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: EASE_OUT }}
        className="shrink-0"
      >
        <Link
          href="/finance"
          className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-mid)] no-underline transition-colors hover:text-[var(--gold)]"
        >
          ‹ {t('monthlyReport.back')}
        </Link>
      </motion.div>

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <div className="h-full animate-pulse rounded-[var(--r)] bg-[var(--panel2)]" />
        ) : !overview ? (
          <div className="flex h-full items-center justify-center text-[12px] text-[var(--text-mid)]">
            {t('monthlyReport.noData')}
          </div>
        ) : (
          <BookFlip
            labels={{
              prev: t('monthlyReport.prevPage'),
              next: t('monthlyReport.nextPage'),
              page: (n, total) => t('monthlyReport.pageIndicator', { n, total }),
            }}
            pages={[
              <ReportOverviewPage
                key="overview"
                monthLabel={formatMonthLabel(month, locale)}
                totalIncome={overview.income}
                totalExpense={overview.expense}
                balance={overview.net}
                savings={savings}
                savingsPercent={savingsPercent}
                overBudget={overBudget}
                topCategories={overview.topCategories}
              />,
              <ReportBudgetPage
                key="budget"
                budgets={budgets}
                totalBudgetLimit={totalBudgetLimit}
              />,
            ]}
          />
        )}
      </div>
    </div>
  );
}
