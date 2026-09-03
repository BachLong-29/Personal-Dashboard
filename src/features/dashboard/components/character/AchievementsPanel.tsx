'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { GoldPanel } from '@/components/common/GoldPanel';
import { Icon } from '@/components/common/Icon';
import { cn } from '@/libs/utils';
import { Link } from '@/i18n/navigation';
import { useGoals } from '@/features/achievements/hooks/useGoals';
import type { GoalDTO } from '@/types';
import { AchievementDetailModal } from './AchievementDetailModal';

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
  const [selectedGoal, setSelectedGoal] = useState<GoalDTO | null>(null);

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
      goal: g,
    }));

    const remaining = 6 - earnedSlots.length;
    const lockedSlots = inProgress.slice(0, remaining).map((g) => ({
      id: g.id,
      title: g.title.length > 12 ? g.title.slice(0, 11) + '…' : g.title,
      desc: g.desc ?? '',
      icon: CAT_ICON[g.cat] ?? '✦',
      earned: false,
      goal: g,
    }));

    return [...earnedSlots, ...lockedSlots];
  }, [goals]);

  return (
    <GoldPanel>
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
              <div key={i} className={cn(achChipBase, achChipNotEarned, 'cursor-default')}>
                <span className={achIcon}>🔒</span>
                <span className={achLabel}>—</span>
              </div>
            ))
          : achievements.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedGoal(a.goal)}
                className={cn(achChipBase, a.earned ? achChipEarned : achChipNotEarned)}
                title={a.desc}
              >
                <span className={cn(achIcon, a.earned && achIconEarned)}>
                  {a.earned ? a.icon : '🔒'}
                </span>
                <span className={cn(achLabel, a.earned && achLabelEarned)}>{a.title}</span>
              </button>
            ))}
      </div>
      {selectedGoal && (
        <AchievementDetailModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} />
      )}
    </GoldPanel>
  );
}

const panelHeader =
  'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)]';
const panelHeaderTitle =
  'font-[var(--font-title)] text-[10px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase flex-1';
const achGrid = 'grid grid-cols-3 gap-1.5 px-3 py-2.5';
const achChipBase =
  'flex flex-col items-center gap-0.5 px-1 py-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] cursor-pointer relative transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]';
const achChipEarned =
  'border-[oklch(0.74_0.17_85_/_0.55)] bg-[linear-gradient(150deg,oklch(0.74_0.17_85_/_0.16),oklch(0.74_0.17_85_/_0.03))] shadow-[0_0_10px_oklch(0.74_0.17_85_/_0.15)] hover:border-[var(--gold)] hover:shadow-[0_0_16px_var(--gold-glow)] hover:-translate-y-0.5';
const achChipNotEarned = 'opacity-50 grayscale-[0.7]';

const achIcon = 'text-[16px] text-[var(--text-lo)]';
const achIconEarned = 'text-[var(--gold)] drop-shadow-[0_0_5px_var(--gold-glow)]';
const achLabel = 'text-[8px] text-[var(--text-mid)] tracking-[0.05em] text-center line-clamp-1';
const achLabelEarned = 'text-[var(--gold)] font-bold';
