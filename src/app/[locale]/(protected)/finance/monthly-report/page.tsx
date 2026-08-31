import type { Metadata } from 'next';

import { MonthlyReportPage } from '@/features/finance/components/monthly-report/MonthlyReportPage';
import type { Locale } from '@/i18n/config';
import { redirect } from '@/i18n/navigation';

export const metadata: Metadata = { title: 'Monthly Report' };

const MONTH_RE = /^\d{4}-\d{2}$/;

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}

// Report data only exists for a month that has fully ended — bounce anywhere else back to /finance.
export default async function Page({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { month } = await searchParams;

  if (!month || !MONTH_RE.test(month) || month >= currentMonthKey()) {
    redirect({ href: '/finance', locale: locale as Locale });
  }

  // `redirect()` throws — TS doesn't narrow across it, so assert what we already validated above.
  return <MonthlyReportPage month={month as string} />;
}
