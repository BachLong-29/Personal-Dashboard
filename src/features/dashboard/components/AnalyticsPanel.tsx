'use client';

import { cn } from '@/libs/utils';

import { useStats } from '../hooks/useStats';
import type { PendingTask } from '../hooks/useStats';
import { MiniBarChart } from './MiniBarChart';

const STATUS_LABEL: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  pending: 'Pending',
  waiting: 'Waiting',
};

const STATUS_COLOR: Record<string, string> = {
  todo: 'var(--text-lo)',
  in_progress: 'var(--cyan)',
  pending: 'var(--gold)',
  waiting: 'var(--amber)',
};

function OverdueChip({ days }: { days?: number }) {
  if (!days) return <span className={chipOverdue}>Overdue</span>;
  return <span className={chipOverdue}>{days}d overdue</span>;
}

function PendingRow({ task }: { task: PendingTask }) {
  const statusColor = STATUS_COLOR[task.status] ?? 'var(--text-lo)';
  return (
    <div className={pendingRow}>
      <span className="text-[14px] shrink-0 leading-none">{task.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={pendingName}>{task.name}</span>
          {task.overdue && <OverdueChip days={task.daysOverdue} />}
        </div>
        <div className="flex items-center gap-2 mt-[2px]">
          <span
            className="text-[9px] font-bold font-[var(--font-title)]"
            style={{ color: statusColor }}
          >
            {STATUS_LABEL[task.status] ?? task.status}
          </span>
          <span className="text-[9px] text-[var(--text-lo)]">{task.startDate}</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsPanel() {
  const { data, isLoading } = useStats();

  if (isLoading || !data) {
    return (
      <div className={outer}>
        <div className="flex-1 flex items-center justify-center text-[11px] text-[var(--text-lo)]">
          Loading stats…
        </div>
      </div>
    );
  }

  const { tasks, habits, weekly, pendingTasks } = data;

  const ringPct = tasks.completionRate;
  const habitPct = habits.completionRateToday;

  return (
    <div className={outer}>
      <div className={wrap}>
        {/* ── Task summary cards ─────────────────────────────────────────── */}
        <section>
          <SectionTitle>Task Overview</SectionTitle>
          <div className={grid4}>
            <StatCard label="Total" value={tasks.total} sub="active tasks" />
            <StatCard
              label="Done"
              value={tasks.done}
              sub={`${ringPct}% rate`}
              accent="var(--mint)"
            />
            <StatCard
              label="In Progress"
              value={tasks.inProgress}
              sub="ongoing"
              accent="var(--cyan)"
            />
            <StatCard
              label="Overdue"
              value={tasks.overdue}
              sub="past due"
              accent={tasks.overdue > 0 ? 'var(--rose)' : undefined}
            />
          </div>
        </section>

        {/* ── Task completion ring + breakdown ───────────────────────────── */}
        <section className="flex gap-3">
          {/* Ring */}
          <div className={ringCard}>
            <svg viewBox="0 0 36 36" className="w-[72px] h-[72px] -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="var(--mint)"
                strokeWidth="3"
                strokeDasharray={`${ringPct * 0.879} 87.9`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[18px] font-bold text-[var(--mint)] leading-none">
                {ringPct}%
              </span>
              <span className="text-[8px] text-[var(--text-lo)] mt-0.5">done</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 flex flex-col gap-1.5 justify-center">
            {[
              { label: 'To Do', val: tasks.todo, color: 'var(--text-lo)' },
              { label: 'In Progress', val: tasks.inProgress, color: 'var(--cyan)' },
              { label: 'Pending', val: tasks.pending, color: 'var(--gold)' },
              { label: 'Overdue', val: tasks.overdue, color: 'var(--rose)' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-[8px] h-[8px] rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span className="text-[9px] text-[var(--text-mid)] flex-1">{label}</span>
                <span className="text-[10px] font-bold text-[var(--text-hi)]">{val}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Habit today ───────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Habits Today</SectionTitle>
          <div className={grid2}>
            <StatCard
              label="Done Today"
              value={`${habits.doneToday}/${habits.totalToday}`}
              sub={`${habitPct}% complete`}
              accent={habitPct === 100 ? 'var(--mint)' : habitPct > 50 ? 'var(--gold)' : undefined}
            />
            <StatCard
              label="Active Habits"
              value={habits.activeCount}
              sub="in schedule"
              accent="var(--violet)"
            />
          </div>

          {/* Habit completion bar */}
          <div className={progressWrap}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[var(--text-lo)]">Today&apos;s progress</span>
              <span className="text-[9px] font-bold text-[var(--text-mid)]">{habitPct}%</span>
            </div>
            <div className={progressTrack}>
              <div
                className={progressFill}
                style={{
                  width: `${habitPct}%`,
                  background:
                    habitPct === 100
                      ? 'linear-gradient(90deg, var(--mint), var(--cyan))'
                      : 'linear-gradient(90deg, var(--violet), var(--cyan))',
                }}
              />
            </div>
          </div>
        </section>

        {/* ── Weekly charts ─────────────────────────────────────────────── */}
        <section>
          <SectionTitle>This Week</SectionTitle>
          <div className={chartCard}>
            <div className={chartTitle}>Tasks completed / day</div>
            <MiniBarChart
              data={weekly.tasksDone}
              labels={weekly.dates}
              color="oklch(0.76 0.14 162)"
              maxOverride={Math.max(...weekly.tasksDone, 1)}
            />
          </div>
          <div className={cn(chartCard, 'mt-2')}>
            <div className={chartTitle}>Habits done / day</div>
            <MiniBarChart
              data={weekly.habitsDone}
              labels={weekly.dates}
              color="oklch(0.66 0.22 295)"
              maxOverride={Math.max(...weekly.habitsDone, 1)}
            />
          </div>
        </section>

        {/* ── Pending tasks ─────────────────────────────────────────────── */}
        {pendingTasks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <SectionTitle className="mb-0">Pending Tasks</SectionTitle>
              <span className="text-[9px] text-[var(--text-lo)]">
                {pendingTasks.length} remaining
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {pendingTasks.map((t) => (
                <PendingRow key={t.id} task={t} />
              ))}
            </div>
          </section>
        )}

        {pendingTasks.length === 0 && tasks.total > 0 && (
          <div className={allDone}>
            <span className="text-[20px]">✦</span>
            <span className="text-[11px] font-semibold text-[var(--mint)]">
              All tasks complete!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] font-[var(--font-title)] mb-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className={statCard}>
      <div className={statLabel}>{label}</div>
      <div className={statVal} style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className={statSub}>{sub}</div>}
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const outer = 'flex-1 overflow-hidden min-h-0 flex flex-col';
const wrap = 'flex-1 overflow-y-auto p-3 flex flex-col gap-4 min-h-0';

const grid4 = 'grid grid-cols-2 gap-2';
const grid2 = 'grid grid-cols-2 gap-2 mb-2';

const statCard =
  'bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2.5';
const statLabel =
  'text-[8px] uppercase tracking-[0.1em] text-[var(--text-lo)] font-[var(--font-title)] mb-0.5';
const statVal = 'text-[20px] font-bold text-[var(--text-hi)] leading-none font-[var(--font-title)]';
const statSub = 'text-[9px] text-[var(--text-mid)] mt-0.5';

const ringCard =
  'relative w-[88px] h-[88px] flex items-center justify-center bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] shrink-0';

const progressWrap = 'mt-2';
const progressTrack = 'h-[6px] bg-[var(--panel3)] rounded-full overflow-hidden';
const progressFill = 'h-full rounded-full transition-all duration-500';

const chartCard =
  'bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2.5';
const chartTitle =
  'text-[8px] font-[var(--font-title)] uppercase tracking-[0.1em] text-[var(--text-lo)] mb-2';

const pendingRow =
  'flex items-start gap-2.5 px-3 py-2 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] hover:border-[var(--border-hi)] transition-colors';
const pendingName = 'text-[11px] font-semibold text-[var(--text-hi)] truncate';
const chipOverdue =
  'text-[7px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] px-1.5 py-[1px] rounded bg-[oklch(0.72_0.18_5_/_0.12)] border border-[oklch(0.72_0.18_5_/_0.3)] text-[var(--rose)] shrink-0';

const allDone = 'flex flex-col items-center gap-2 py-6 text-[var(--text-lo)]';
