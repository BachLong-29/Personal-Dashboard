'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import { cn } from '@/libs/utils';
import { Link } from '@/i18n/navigation';
import { useGoals } from '@/features/achievements/hooks/useGoals';

const CAT_ICON: Record<string, string> = {
  career: '⚜',
  health: '❀',
  learning: '◈',
  finance: '◆',
  personal: '✦',
};

export function AchievementsPanel() {
  const t = useTranslations('dashboard');
  const { data: goals = [] } = useGoals();

  const achievements = useMemo(() => {
    const completed = goals.filter((g) => g.status === 'completed');
    const inProgress = goals.filter(
      (g) => g.status === 'in-progress' || g.status === 'not-started',
    );

    const earnedSlots = completed.slice(0, 6).map((g) => ({
      id: g.id,
      title: g.title.length > 12 ? g.title.slice(0, 11) + '…' : g.title,
      desc: g.desc ?? '',
      icon: CAT_ICON[g.cat] ?? '✦',
      earned: true,
    }));

    const remaining = 6 - earnedSlots.length;
    const lockedSlots = inProgress.slice(0, remaining).map((g) => ({
      id: g.id,
      title: g.title.length > 12 ? g.title.slice(0, 11) + '…' : g.title,
      desc: g.desc ?? '',
      icon: CAT_ICON[g.cat] ?? '✦',
      earned: false,
    }));

    return [...earnedSlots, ...lockedSlots];
  }, [goals]);

  return (
    <div className={cn(panelBase, panelGold)}>
      <div className={panelHeader}>
        <span className={panelHeaderTitle}>{t('achievements')}</span>
        <Link
          href="/achievements"
          className="inline-flex items-center gap-1 text-[8px] font-bold tracking-[0.1em] text-[var(--text-lo)] hover:text-[var(--gold)] font-[var(--font-title)] transition-colors no-underline"
        >
          <span>VIEW ALL</span>
          <Icon icon="ArrowRight" className="text-[14px]" />
        </Link>
      </div>
      <div className={achGrid}>
        {achievements.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn(achChipBase, achChipNotEarned)}>
                <span className={achIcon}>✦</span>
                <span className={achLabel}>—</span>
              </div>
            ))
          : achievements.map((a) => (
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
const achGrid = 'grid grid-cols-3 gap-1.5 px-3 py-2.5';
const achChipBase =
  'flex flex-col items-center gap-0.5 px-1 py-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] cursor-default relative transition-[border-color,box-shadow] duration-200';
const achChipEarned =
  'border-[oklch(0.74_0.17_85_/_0.4)] bg-[oklch(0.74_0.17_85_/_0.06)] hover:border-[var(--gold)] hover:shadow-[0_0_12px_var(--gold-glow)]';
const achChipNotEarned = 'opacity-35 grayscale';

const achIcon = 'text-[16px]';
const achLabel = 'text-[8px] text-[var(--text-mid)] tracking-[0.05em] text-center line-clamp-1';
const achLabelEarned = 'text-[var(--gold)]';
