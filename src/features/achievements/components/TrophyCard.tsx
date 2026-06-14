'use client';

import { cn } from '@/libs/utils';
import type { Trophy, TrophyTier } from '../types';

interface TrophyCardProps {
  trophy: Trophy;
}

const TIER_LABEL: Record<TrophyTier, string> = {
  bronze:    'Bronze',
  silver:    'Silver',
  gold:      'Gold',
  legendary: 'Legendary',
};

const TIER_MEDAL: Record<TrophyTier, string> = {
  bronze:    'bg-[linear-gradient(135deg,oklch(0.62_0.1_60),oklch(0.5_0.09_55))]   shadow-[0_0_16px_oklch(0.62_0.1_60_/_0.4)]',
  silver:    'bg-[linear-gradient(135deg,oklch(0.72_0.02_270),oklch(0.58_0.02_270))] shadow-[0_0_16px_oklch(0.72_0.02_270_/_0.35)]',
  gold:      'bg-[linear-gradient(135deg,var(--gold),oklch(0.6_0.15_80))]           shadow-[0_0_20px_var(--gold-glow)]',
  legendary: 'bg-[linear-gradient(135deg,oklch(0.78_0.18_295),var(--gold),oklch(0.78_0.18_295))] shadow-[0_0_24px_oklch(0.74_0.18_295_/_0.5)]',
};

const TIER_BADGE: Record<TrophyTier, string> = {
  bronze:    'text-[oklch(0.62_0.1_60)]   border-[oklch(0.62_0.1_60_/_0.4)]   bg-[oklch(0.62_0.1_60_/_0.08)]',
  silver:    'text-[oklch(0.78_0.02_270)] border-[oklch(0.72_0.02_270_/_0.4)] bg-[oklch(0.72_0.02_270_/_0.08)]',
  gold:      'text-[var(--gold)]           border-[oklch(0.74_0.17_85_/_0.4)]  bg-[oklch(0.74_0.17_85_/_0.08)]',
  legendary: 'text-[var(--violet)]         border-[oklch(0.66_0.22_295_/_0.5)] bg-[oklch(0.66_0.22_295_/_0.1)]',
};

const TIER_PROGRESS: Record<TrophyTier, string> = {
  bronze:    'bg-[oklch(0.62_0.1_60)]',
  silver:    'bg-[oklch(0.72_0.02_270)]',
  gold:      'bg-[var(--gold)]',
  legendary: 'bg-[linear-gradient(90deg,var(--violet),var(--gold))]',
};

export function TrophyCard({ trophy: t }: TrophyCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2.5 p-4 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)]',
        'transition-[border-color,box-shadow] duration-200 text-center',
        t.unlocked
          ? 'hover:border-[oklch(0.74_0.17_85_/_0.4)] hover:shadow-[0_4px_20px_oklch(0_0_0_/_0.2)]'
          : 'opacity-60 grayscale-[0.4]',
        t.tier === 'legendary' && t.unlocked && 'border-[oklch(0.66_0.22_295_/_0.3)] shadow-[0_0_24px_oklch(0.66_0.22_295_/_0.08)]',
      )}
    >
      {/* Medal */}
      <div
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center text-[28px] shrink-0',
          TIER_MEDAL[t.tier],
        )}
      >
        {t.unlocked ? t.icon : <span className="text-[20px] grayscale opacity-60">🔒</span>}
      </div>

      {/* Tier badge */}
      <span
        className={cn(
          'text-[8px] font-black tracking-[0.14em] uppercase px-2 py-0.5 rounded-full border font-[var(--font-title)]',
          TIER_BADGE[t.tier],
        )}
      >
        {TIER_LABEL[t.tier]}
      </span>

      {/* Name + desc */}
      <div className="flex flex-col gap-1 flex-1">
        <div className="font-[var(--font-title)] text-[12px] font-bold text-[var(--text-hi)] tracking-[0.04em] leading-tight">
          {t.name}
        </div>
        <p className="text-[10px] text-[var(--text-mid)] leading-[1.5]">{t.desc}</p>
      </div>

      {/* Footer */}
      {t.unlocked ? (
        <div className="flex items-center justify-between w-full pt-1 border-t border-[var(--border)] mt-auto">
          <span className="text-[9px] text-[var(--text-lo)] flex items-center gap-1">
            <span className="opacity-70">◷</span>{t.date}
          </span>
          <span className="text-[9px] font-bold text-[var(--gold)] font-[var(--font-title)]">
            {t.reward}
          </span>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-1.5 pt-1 border-t border-[var(--border)] mt-auto">
          <div className="flex justify-between text-[9px]">
            <span className="text-[var(--text-lo)]">Locked</span>
            <span className="text-[var(--text-mid)] font-bold">{Math.round((t.progress ?? 0) * 100)}%</span>
          </div>
          <div className="h-[3px] bg-[var(--panel2)] rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-[width] duration-700', TIER_PROGRESS[t.tier])}
              style={{ width: `${(t.progress ?? 0) * 100}%` }}
            />
          </div>
          <div className="text-[9px] text-[var(--text-lo)] text-left">↪ {t.linkedGoal}</div>
        </div>
      )}
    </div>
  );
}
