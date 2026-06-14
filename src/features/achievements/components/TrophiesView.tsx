'use client';

import { useState } from 'react';

import { cn } from '@/libs/utils';
import type { Trophy, AmbitionsStats } from '../types';
import { StatCard } from './StatCard';
import { TrophyCard } from './TrophyCard';

interface TrophiesViewProps {
  trophies: Trophy[];
  stats: AmbitionsStats;
}

type TrophyFilter = 'all' | 'unlocked' | 'locked';

const TIER_LABEL: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', legendary: 'Legendary' };

export function TrophiesView({ trophies, stats }: TrophiesViewProps) {
  const [filter, setFilter] = useState<TrophyFilter>('all');

  const recent = trophies.filter((t) => t.recent).slice(0, 3);
  const shown   = trophies.filter((t) =>
    filter === 'all' ? true : filter === 'unlocked' ? t.unlocked : !t.unlocked,
  );

  const tierCounts = (['legendary', 'gold', 'silver', 'bronze'] as const).map((tier) => ({
    tier,
    n: trophies.filter((t) => t.tier === tier && t.unlocked).length,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Recent glory */}
      {recent.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recent.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-3 bg-[linear-gradient(135deg,oklch(0.22_0.06_82_/_0.4),oklch(0.18_0.05_82_/_0.3))] border border-[oklch(0.74_0.17_85_/_0.25)] rounded-[var(--r)]"
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-[oklch(0.74_0.17_85_/_0.15)] border border-[oklch(0.74_0.17_85_/_0.35)] flex items-center justify-center text-[20px]">
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[8px] text-[var(--gold)] tracking-[0.12em] uppercase font-[var(--font-title)]">✦ RECENTLY EARNED</div>
                <div className="text-[12px] font-bold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.03em] truncate">{t.name}</div>
                <div className="text-[9px] text-[var(--text-lo)]">{t.date} · {t.reward}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard tone="gold"   ico="🏆" label="Unlocked"  value={stats.trophies}     suffix={`/${stats.totalTrophies}`} sub="trophies earned" />
        <StatCard tone="violet" ico="♛" label="Legendary" value={tierCounts[0]!.n}   sub="rarest tier" />
        <StatCard tone="mint"   ico="✧" label="In Reach"  value={stats.lockedTrophies} sub="locked & tracking" />
        <StatCard tone="cyan"   ico="◈" label="Collected" value={Math.round((stats.trophies / (stats.totalTrophies || 1)) * 100)} suffix="%" sub="of all glory" />
      </div>

      {/* Header + filter */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-[var(--font-title)] text-[var(--gold)] text-[12px]">★</span>
          <span className="font-[var(--font-title)] text-[13px] font-bold text-[var(--text-hi)] tracking-[0.04em]">Trophy Hall</span>
        </div>
        {/* Tier legend */}
        <div className="hidden sm:flex items-center gap-3">
          {tierCounts.map(({ tier, n }) => (
            <span key={tier} className="text-[9px] text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.06em]">
              {TIER_LABEL[tier]} <span className="text-[var(--text-mid)] font-bold">{n}</span>
            </span>
          ))}
        </div>
        {/* Filter */}
        <div className="flex bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] p-0.5 gap-0.5 shrink-0">
          {(['all', 'unlocked', 'locked'] as TrophyFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 text-[10px] font-bold font-[var(--font-title)] tracking-[0.05em] rounded-[3px] capitalize transition-colors',
                filter === f
                  ? 'bg-[oklch(0.74_0.17_85_/_0.15)] text-[var(--gold)]'
                  : 'text-[var(--text-lo)] hover:text-[var(--text-mid)]',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Trophy grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {shown.map((t) => (
          <TrophyCard key={t.id} trophy={t} />
        ))}
      </div>

      {shown.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="text-[36px] opacity-20">✧</div>
          <p className="text-[11px] text-[var(--text-lo)]">No trophies in this filter</p>
        </div>
      )}
    </div>
  );
}
