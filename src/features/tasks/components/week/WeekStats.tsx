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
    { label: 'XP Earned', value: `+${xp}`, color: 'violet' },
    { label: 'Combo', value: '×3', color: 'cyan', sub: 'active' },
    { label: 'Streak', value: '14d', color: 'rose', sub: 'best 21d' },
    { label: 'Focus Hours', value: '16.5h', color: 'mint', sub: 'this week' },
  ];

  const mainStats = stats.slice(0, 2);
  const subStats = stats.slice(2);

  return (
    <>
      {/* ── Desktop: 5-column row ─────────────────── */}
      <div className="hidden md:flex gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Mobile: 2-row layout ──────────────────── */}
      <div className="flex flex-col gap-2 md:hidden">
        {/* Row 1 — 2 main stats as prominent cards */}
        <div className="grid grid-cols-2 gap-2">
          {mainStats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Row 2 — 3 secondary stats as compact pills */}
        <div className="flex gap-2">
          {subStats.map((s) => (
            <StatPill key={s.label} {...s} />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Desktop card ─────────────────────────────────────────────────────────────

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
      <div className="text-[18px] font-black font-[var(--font-title)]" style={{ color: cssColor }}>
        {value}
      </div>
      {sub && <div className="text-[8px] text-[var(--text-lo)] mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Mobile pill (secondary stats) ───────────────────────────────────────────

function StatPill({ label, value, color, sub }: StatCardProps) {
  const cssColor = COLOR_VAR[color] ?? `var(--${color})`;

  return (
    <div
      className="flex-1 min-w-0 flex items-center gap-2 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] px-2.5 py-1.5"
      style={{ borderLeftColor: cssColor, borderLeftWidth: 2 }}
    >
      <div
        className="text-[14px] font-black font-[var(--font-title)] shrink-0 leading-none"
        style={{ color: cssColor }}
      >
        {value}
      </div>
      <div className="min-w-0">
        <div className="text-[7px] tracking-[0.1em] text-[var(--text-lo)] uppercase truncate leading-tight">
          {label}
        </div>
        {sub && (
          <div className="text-[7px] text-[var(--text-lo)] truncate leading-tight opacity-70">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
