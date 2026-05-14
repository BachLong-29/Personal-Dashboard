'use client';

import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useLogout } from '@/features/auth/hooks/useLogout';
import type { Character } from '../types';
import { cn } from '@/libs/utils';

interface DashboardTopbarProps {
  char: Character;
  dateStr: string;
  onEndDay: () => void;
}

const DashboardTopbar = (props: DashboardTopbarProps) => {
  const { char, dateStr, onEndDay } = props;

  const locale = useLocale() as Locale;
  const tNav = useTranslations('nav');
  const tDash = useTranslations('dashboard');
  const router = useRouter();
  const pathname = usePathname();

  const topBar =
    'flex items-center gap-3 px-5 py-2.5 bg-[var(--panel)] border-b border-[var(--border)] shrink-0 z-10';

  const topBarLogo =
    'font-[var(--font-title)] text-[18px] font-black tracking-[0.12em] bg-gradient-to-r from-[var(--gold)] to-[var(--violet)] bg-clip-text text-transparent mr-2';

  const currencyPill =
    'flex items-center gap-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[20px] py-1 pr-3 pl-2 text-[12px] font-semibold text-[var(--text-hi)] cursor-default';

  const currencyIcon = 'text-[14px]';
  const gems = '!border-[oklch(0.66_0.22_295_/_0.4)]';
  const coins = '!border-[oklch(0.74_0.17_85_/_0.4)]';

  const dateLabel = 'text-[11px] text-[var(--text-mid)] tracking-[0.08em] font-[var(--font-title)]';

  const streakPill =
    'flex items-center gap-[5px] bg-[oklch(0.74_0.17_85_/_0.1)] border border-[oklch(0.74_0.17_85_/_0.3)] rounded-[20px] px-[10px] py-1 text-[11px] font-bold text-[var(--gold)] font-[var(--font-title)] tracking-[0.05em]';

  const navPill =
    'flex items-center gap-[6px] bg-[var(--panel2)] border border-[var(--border)] rounded-[20px] px-[10px] py-1 text-[11px] font-bold font-[var(--font-title)] tracking-[0.05em] transition-colors duration-200 no-underline cursor-pointer hover:border-[oklch(0.74_0.17_85_/_0.35)]';
  const marketplacePill =
    'text-[var(--violet)] border-[oklch(0.66_0.22_295_/_0.35)] hover:border-[oklch(0.66_0.22_295_/_0.55)]';
  const languagePill =
    'text-[var(--text-mid)] hover:text-[var(--text-hi)] focus:outline-none focus:ring-2 focus:ring-[var(--border)]';

  const penaltyTrigger =
    'inline-flex items-center gap-[6px] bg-[oklch(0.62_0.24_22_/_0.1)] border border-[oklch(0.62_0.24_22_/_0.4)] text-[oklch(0.85_0.18_22)] px-[11px] py-[5px] rounded-[var(--r-sm)] text-[10px] font-[var(--font-title)] tracking-[0.12em] font-bold cursor-pointer transition-all duration-200 ml-1 hover:bg-[oklch(0.62_0.24_22_/_0.2)] hover:shadow-[0_0_12px_var(--danger-glow)]';

  const logout = useLogout();

  const handleToggleLocale = () => {
    const currentIndex = locales.indexOf(locale);
    const nextLocale = locales[(currentIndex + 1) % locales.length] ?? locales[0];
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className={cn(topBar)}>
      <span className={cn(topBarLogo)}>{char.name}</span>
      <span className="text-[var(--gold)] text-[8px] opacity-50">◆</span>
      <div className={cn(currencyPill, gems)}>
        <span className={currencyIcon}>💠</span>
        <span>{char.gems}</span>
      </div>
      <div className={cn(currencyPill, coins)}>
        <span className={currencyIcon}>🪙</span>
        <span>{char.coins}</span>
      </div>
      <div className="flex-1" />
      <Button
        type="button"
        variant="ghost"
        className={penaltyTrigger}
        onClick={onEndDay}
        title={tDash('buttons.endDayTitle')}
      >
        ⚠ {tDash('endDay')}
      </Button>
      <div className={dateLabel}>{dateStr}</div>
      <Link href="/marketplace" className={cn(navPill, marketplacePill)}>
        🛍 {tNav('marketplace')}
      </Link>
      <Link href="/vault" className={cn(streakPill, 'no-underline cursor-pointer')}>
        ✦ {tNav('vault')}
      </Link>
      <Button
        type="button"
        variant="ghost"
        className={cn(navPill, languagePill)}
        onClick={handleToggleLocale}
        aria-label={tDash('buttons.toggleLanguage')}
        title={localeLabels[locale]}
      >
        🌐 {locale.toUpperCase()}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={cn(navPill, 'text-[var(--text-lo)] hover:text-[var(--rose)] hover:!border-[oklch(0.74_0.18_5_/_0.4)]')}
        onClick={logout}
        aria-label="Logout"
      >
        ⏻
      </Button>
      <div className={streakPill}>{tDash('streakDays', { count: char.streak })}</div>
    </div>
  );
};

export default DashboardTopbar;
