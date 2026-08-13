'use client';

import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/libs/utils';

const TABS = [
  { href: '/finance', key: 'overview', match: (p: string) => p === '/finance' },
  {
    href: '/finance/wallets',
    key: 'accounts',
    match: (p: string) => p.startsWith('/finance/wallets'),
  },
  {
    href: '/finance/budget',
    key: 'budget',
    match: (p: string) => p.startsWith('/finance/budget'),
  },
  {
    href: '/finance/goals',
    key: 'goals',
    match: (p: string) => p.startsWith('/finance/goals'),
  },
  {
    href: '/finance/transactions',
    key: 'transactions',
    match: (p: string) => p.startsWith('/finance/transactions'),
  },
] as const;

export function FinanceTabs() {
  const t = useTranslations('finance.tabs');
  const pathname = usePathname();

  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[var(--border)] px-4 py-2">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'shrink-0 rounded-[var(--r-sm)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] no-underline transition-colors [font-family:var(--f-title)]',
            tab.match(pathname)
              ? 'bg-[oklch(0.74_0.17_85_/_0.14)] text-[var(--gold)]'
              : 'text-[var(--text-mid)] hover:text-[var(--text-hi)]',
          )}
        >
          {t(tab.key)}
        </Link>
      ))}
    </div>
  );
}
