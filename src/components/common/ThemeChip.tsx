'use client';

import { useTranslations } from 'next-intl';

import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/libs/utils';

/**
 * Sun / moon switch for the public pages (landing, login).
 *
 * Only flips the local preference — there is no account to save it to yet.
 * Once signed in, ThemeSync takes over with whatever the account holds.
 */
export function ThemeChip({ className }: { className?: string }) {
  const t = useTranslations('common');
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={t('toggleTheme')}
      title={t(dark ? 'themeDark' : 'themeLight')}
      className={cn(
        'flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-2)] text-[13px] leading-none text-[var(--gold)] transition hover:border-[var(--border-hi)] hover:bg-[var(--bg-3)]',
        className,
      )}
    >
      <span aria-hidden>{dark ? '☾' : '☀'}</span>
    </button>
  );
}
