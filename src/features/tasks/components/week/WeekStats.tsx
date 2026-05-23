import { COLOR_VAR, type UITask } from '../../data/mock';

interface WeekStatsProps {
  tasks: UITask[];
}

export function WeekStats({ tasks }: WeekStatsProps) {
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const xp = tasks.filter((t) => t.done).reduce((sum, t) => sum + t.xp, 0);

  const stats: Array<{ label: string; value: string; color: string; sub?: string }> = [
    { label: 'Quests Cleared', value: `${done}/${total}`, color: 'gold' },
    { label: 'XP Earned',      value: `+${xp}`,           color: 'violet' },
    { label: 'Combo',          value: '×3',                color: 'cyan',   sub: 'active'   },
    { label: 'Streak',         value: '14d',               color: 'rose',   sub: 'best 21d' },
    { label: 'Focus Hours',    value: '16.5h',             color: 'mint',   sub: 'this week' },
  ];

  return (
    <div className="flex gap-3">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}

// ─── Single stat card ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  sub?: string;
}

function StatCard({ label, value, color, sub }: StatCardProps) {
  const cssColor = COLOR_VAR[color] ?? `var(--${color})`;

  return (
    <div
      className="flex-1 min-w-0 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2.5"
      style={{ borderTopColor: cssColor, borderTopWidth: 2 }}
    >
      <div className="text-[8px] tracking-[0.12em] text-[var(--text-lo)] font-[var(--font-title)] uppercase mb-1">
        {label}
      </div>
      <div
        className="text-[18px] font-black font-[var(--font-title)]"
        style={{ color: cssColor }}
      >
        {value}
      </div>
      {sub && <div className="text-[8px] text-[var(--text-lo)] mt-0.5">{sub}</div>}
    </div>
  );
}
