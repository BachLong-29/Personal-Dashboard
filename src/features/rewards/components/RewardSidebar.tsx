'use client';

import { cn } from '@/libs/utils';
import type { RewardRarity, RewardStatus } from '@/types/reward';
import { RARITIES, STATUSES } from '../constants';

interface RewardSidebarProps {
  rarFilter:    RewardRarity | 'all';
  setRarFilter: (v: RewardRarity | 'all') => void;
  statFilter:   RewardStatus | 'all';
  setStatFilter:(v: RewardStatus | 'all') => void;
  rarCounts:    Record<string, number>;
  statCounts:   Record<string, number>;
  total:        number;
}

export function RewardSidebar({
  rarFilter, setRarFilter,
  statFilter, setStatFilter,
  rarCounts, statCounts,
  total,
}: RewardSidebarProps) {
  const maxRar = Math.max(...RARITIES.map((r) => rarCounts[r.id] ?? 0), 1);

  return (
    <aside className={sidebarBase}>
      {/* Catalog header */}
      <div className={section}>
        <div className={sectionHead}>
          Catalog <span className={countBadge}>{total}</span>
        </div>

        <button
          type="button"
          className={cn(libRow, rarFilter === 'all' && libRowActive)}
          onClick={() => setRarFilter('all')}
        >
          <span className={glyph}>◈</span>
          <span className="flex-1 text-left">All Rewards</span>
          <span className={countNum}>{total}</span>
        </button>
      </div>

      {/* Rarity ladder */}
      <div className={section}>
        <div className={sectionHead}>Rarity Ladder</div>

        {RARITIES.map((r) => (
          <button
            key={r.id}
            type="button"
            className={cn(rarRow, rarFilter === r.id && rarRowActive)}
            style={{ ['--rar-color' as string]: r.color }}
            onClick={() => setRarFilter(r.id)}
          >
            <span
              className={rarPip}
              style={{ color: r.color, borderColor: `${r.color}55`, background: r.bg }}
            >
              {r.label[0]}
            </span>
            <span className="flex-1 text-left">{r.label}</span>
            <span className={countNum}>{rarCounts[r.id] ?? 0}</span>
          </button>
        ))}

        {/* Distribution bars */}
        <div className="mt-3 flex flex-col gap-1.5 px-1">
          {RARITIES.map((r) => {
            const pct = ((rarCounts[r.id] ?? 0) / maxRar) * 100;
            return (
              <div key={r.id} className="flex items-center gap-2">
                <span className="text-[8px] font-[var(--font-title)] tracking-[0.1em]" style={{ color: r.color, width: 52 }}>
                  {r.label.toUpperCase().slice(0, 5)}
                </span>
                <div className="flex-1 h-[4px] rounded-full bg-[var(--panel)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: r.color, boxShadow: `0 0 6px ${r.glow}` }}
                  />
                </div>
                <span className="text-[9px] font-[var(--font-mono)] text-[var(--text-lo)] w-4 text-right">
                  {rarCounts[r.id] ?? 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status filter */}
      <div className={section}>
        <div className={sectionHead}>Status</div>

        <button
          type="button"
          className={cn(statRow, statFilter === 'all' && statRowActive)}
          onClick={() => setStatFilter('all')}
        >
          <span className={statPip} style={{ background: 'var(--text-lo)' }} />
          <span className="flex-1 text-left">Any Status</span>
          <span className={countNum}>{total}</span>
        </button>

        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={cn(statRow, statFilter === s.id && statRowActive)}
            style={{ ['--stat-color' as string]: s.color }}
            onClick={() => setStatFilter(s.id)}
          >
            <span className={statPip} style={{ background: s.color, boxShadow: `0 0 4px ${s.color}` }} />
            <span className="flex-1 text-left">{s.label}</span>
            <span className={countNum}>{statCounts[s.id] ?? 0}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sidebarBase =
  'w-[196px] shrink-0 flex flex-col gap-0 border-r border-[var(--border)] bg-[var(--panel)] overflow-y-auto';
const section =
  'px-3 py-3 border-b border-[var(--border)]';
const sectionHead =
  'flex items-center gap-2 text-[9px] font-bold tracking-[0.18em] uppercase text-[var(--text-lo)] font-[var(--font-title)] mb-2';
const countBadge =
  'font-[var(--font-mono)] text-[var(--text-dim)] font-normal';
const countNum =
  'text-[9px] font-[var(--font-mono)] text-[var(--text-dim)]';
const glyph =
  'text-[11px] text-[var(--text-lo)] w-4 text-center shrink-0';

const libRow =
  'w-full flex items-center gap-2 px-1.5 py-[5px] rounded-[var(--r-sm)] text-[11px] text-[var(--text-mid)] transition-colors hover:bg-[var(--panel2)] hover:text-[var(--text-hi)] cursor-pointer';
const libRowActive =
  '!bg-[oklch(0.74_0.17_85_/_0.08)] !text-[var(--gold)] font-semibold';

const rarRow =
  'w-full flex items-center gap-2 px-1.5 py-[5px] rounded-[var(--r-sm)] text-[11px] text-[var(--text-mid)] transition-colors hover:bg-[var(--panel2)] cursor-pointer';
const rarRowActive =
  '!bg-[var(--panel2)] !text-[var(--text-hi)] font-semibold';
const rarPip =
  'shrink-0 text-[8px] font-bold tracking-[0.08em] px-1 py-0.5 rounded border font-[var(--font-title)]';

const statRow =
  'w-full flex items-center gap-2 px-1.5 py-[5px] rounded-[var(--r-sm)] text-[11px] text-[var(--text-mid)] transition-colors hover:bg-[var(--panel2)] cursor-pointer';
const statRowActive =
  '!bg-[var(--panel2)] !text-[var(--text-hi)] font-semibold';
const statPip =
  'w-2 h-2 rounded-full shrink-0';
