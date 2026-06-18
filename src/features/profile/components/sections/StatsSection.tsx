'use client';

import { cn } from '@/libs/utils';
import { Slider } from '@/components/ui';
import type { HeroStats } from '@/types/profile';

interface Props {
  stats: HeroStats;
  pool: number;
  onChange: (stats: HeroStats) => void;
}

const STAT_KEYS: { key: keyof HeroStats; label: string; desc: string }[] = [
  { key: 'discipline', label: 'Discipline', desc: 'habits, focus, follow-through' },
  { key: 'wisdom', label: 'Wisdom', desc: 'skills, study, language' },
  { key: 'endurance', label: 'Endurance', desc: 'long goals, body' },
  { key: 'composition', label: 'Composition', desc: 'craft, writing, making' },
  { key: 'serenity', label: 'Serenity', desc: 'sleep, breath, rest' },
];

export function StatsSection({ stats, pool, onChange }: Props) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const remaining = pool - total;

  const setStat = (key: keyof HeroStats, next: number) => {
    const clamped = Math.max(1, Math.min(10, next));
    const others = total - stats[key];
    if (others + clamped > pool) return;
    onChange({ ...stats, [key]: clamped });
  };

  const remainingCls = cn(
    '[font-family:var(--f-mono)] text-[10px] tracking-[0.12em] px-[10px] py-[5px]',
    'border rounded-xs',
    remaining < 0 ? 'text-rose border-rose' : 'text-gold border-gold',
  );

  return (
    <div
      className="border border-border-lo rounded-sm p-5"
      style={{ background: 'oklch(15% 0.03 270/0.5)' }}
    >
      {/* head */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-lo">
        <div>
          <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.22em] uppercase text-text-lo">
            POOL
          </div>
          <div className="[font-family:var(--f-title)] italic text-[24px] text-text-hi">
            {total} <span className="text-text-lo">/ {pool}</span>
          </div>
        </div>
        <div className={remainingCls}>
          {remaining > 0
            ? `${remaining} unspent`
            : remaining === 0
              ? 'Allocated'
              : `${-remaining} over`}
        </div>
      </div>

      {/* rows */}
      <div className="flex flex-col gap-4">
        {STAT_KEYS.map(({ key, label, desc }) => (
          <div key={key}>
            <div className="flex justify-between items-baseline mb-[6px]">
              <span className="[font-family:var(--f-title)] italic text-[14px] text-text-md">
                {label} <span className="text-[11px] text-text-lo not-italic">· {desc}</span>
              </span>
              <span className="[font-family:var(--f-title)] italic text-[20px] text-gold">
                {stats[key]}
              </span>
            </div>
            <Slider min={1} max={10} value={stats[key]} onChange={(v) => setStat(key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
