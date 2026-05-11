'use client';

import { useTranslations } from 'next-intl';

import type { Achievement } from '../types';

import { cn } from '@/libs/utils';

interface AchievementsPanelProps {
  achievements: Achievement[];
}

export function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  const t = useTranslations('dashboard');

  return (
    <div className={cn(panelBase, panelGold)}>
      <div className={panelHeader}>
        <span className={panelHeaderTitle}>{t('achievements')}</span>
        <span className={panelHeaderOrnament}>◆ ◆ ◆</span>
      </div>
      <div className={achGrid}>
        {achievements.map((a) => (
          <div
            key={a.id}
            className={cn(achChipBase, a.earned ? achChipEarned : achChipNotEarned)}
            title={a.desc}
          >
            <span className={achIcon}>{a.icon}</span>
            <span className={cn(achLabel, a.earned && achLabelEarned)}>{a.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const panelBase =
  "bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] overflow-hidden relative before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)]";
const panelGold =
  'border-[oklch(0.74_0.17_85_/_0.35)] shadow-[0_0_20px_oklch(0.74_0.17_85_/_0.06),inset_0_0_20px_oklch(0.74_0.17_85_/_0.03)]';

const panelHeader =
  'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)]';
const panelHeaderTitle =
  'font-[var(--font-title)] text-[10px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase flex-1';
const panelHeaderOrnament = 'text-[var(--gold-dim)] text-[8px] tracking-[3px] opacity-60';

const achGrid = 'grid grid-cols-3 gap-1.5 px-3 py-2.5';
const achChipBase =
  'flex flex-col items-center gap-0.5 px-1 py-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] cursor-default relative transition-[border-color,box-shadow] duration-200';
const achChipEarned =
  'border-[oklch(0.74_0.17_85_/_0.4)] bg-[oklch(0.74_0.17_85_/_0.06)] hover:border-[var(--gold)] hover:shadow-[0_0_12px_var(--gold-glow)]';
const achChipNotEarned = 'opacity-35 grayscale';

const achIcon = 'text-[16px]';
const achLabel = 'text-[8px] text-[var(--text-mid)] tracking-[0.05em] text-center';
const achLabelEarned = 'text-[var(--gold)]';
