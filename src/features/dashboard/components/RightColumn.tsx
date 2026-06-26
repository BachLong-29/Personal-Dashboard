import { memo } from 'react';

import { useTranslations } from 'next-intl';

import type { DashboardSettings } from '../types';
import { ProjectsPanel } from './ProjectsPanel';
import { WeekPeekPanel } from './WeekPeekPanel';

interface Quote {
  text: string;
  author: string;
}

interface Props {
  settings: DashboardSettings;
  quote: Quote | undefined;
}

export const RightColumn = memo(function RightColumn({ settings, quote }: Props) {
  const t = useTranslations('dashboard');

  return (
    <>
      <ProjectsPanel />
      {settings.showQuoteCard && quote && (
        <div className={motivationCard}>
          <div className={motivationLabel}>◆ {t('motivation.dailyWisdom')}</div>
          <div className={motivationText}>&ldquo;{quote.text}&rdquo;</div>
          <div className={motivationAuthor}>{quote.author}</div>
        </div>
      )}
      {settings.showGuildPanel && <WeekPeekPanel />}
    </>
  );
});

const motivationCard =
  'bg-[linear-gradient(135deg,oklch(0.35_0.15_295_/_0.25),oklch(0.28_0.12_270_/_0.2))] border border-[oklch(0.66_0.22_295_/_0.3)] rounded-[var(--r)] px-[14px] py-3 shrink-0';
const motivationLabel =
  'text-[8px] tracking-[0.12em] uppercase text-[var(--violet)] font-[var(--font-title)] mb-[5px]';
const motivationText = 'text-[11px] text-[var(--text-hi)] leading-[1.6] italic';
const motivationAuthor = 'text-[9px] text-[var(--text-mid)] mt-1 text-right';
