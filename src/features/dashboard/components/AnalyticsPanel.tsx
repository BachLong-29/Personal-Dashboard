'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from '@/libs/utils';

import type { Task, UpdateTaskPayload } from '@/types';
import { taskToUITask } from '@/features/tasks/data/adapters';
import { EditTaskModal } from '@/features/tasks/components/shared/EditTaskModal';
import { useStats } from '../hooks/useStats';
import { useStatsHeatmap } from '../hooks/useStatsHeatmap';
import { useTasks } from '../hooks/useTasks';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type { PendingTask } from '../hooks/useStats';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHours(min: number): string {
  if (min <= 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function toDayAbbr(mmdd: string): string {
  const [month, day] = mmdd.split('-').map(Number);
  const year = new Date().getFullYear();
  const d = new Date(year, (month ?? 1) - 1, day ?? 1);
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE_OUT }}
      className={kpiCard}
    >
      <div className={kpiLabel}>{label}</div>
      <div className={kpiVal} style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className={kpiSub}>{sub}</div>}
    </motion.div>
  );
}

// ── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({
  children,
  className,
  right,
}: {
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className={cn('flex items-center justify-between mb-2', className)}>
      <div className={sectionTitleCls}>{children}</div>
      {right}
    </div>
  );
}

// ── Trend Badge ───────────────────────────────────────────────────────────────

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[11px] text-[var(--text-lo)] font-bold">—</span>;
  const isUp = pct > 0;
  const isFlat = pct === 0;
  const color = isFlat ? 'var(--text-lo)' : isUp ? 'var(--mint)' : 'var(--rose)';
  const arrow = isFlat ? '→' : isUp ? '↑' : '↓';
  return (
    <span className="text-[16px] font-bold font-[var(--font-title)]" style={{ color }}>
      {arrow} {Math.abs(pct)}%
    </span>
  );
}

// ── Custom Tooltip for recharts ───────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--panel3)] border border-[var(--border-hi)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-[9px] shadow-lg">
      <div className="text-[var(--text-lo)] mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <div
            className="w-[6px] h-[6px] rounded-full"
            style={{
              background:
                p.dataKey === 'thisWeek' ? 'oklch(0.76 0.14 162)' : 'oklch(0.68 0.22 295 / 0.6)',
            }}
          />
          <span className="text-[var(--text-mid)]">
            {p.dataKey === 'thisWeek' ? 'This week' : 'Last week'}:
          </span>
          <span className="font-bold text-[var(--text-hi)]">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── XP Progress Bar ───────────────────────────────────────────────────────────

function XpBar({ xp, xpNext }: { xp: number; xpNext: number }) {
  const pct = Math.min(Math.round((xp / Math.max(xpNext, 1)) * 100), 100);
  return (
    <div className="h-[5px] bg-[var(--panel3)] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay: 0.3, ease: EASE_OUT }}
        className="h-full rounded-full"
        style={{ background: 'linear-gradient(90deg, var(--gold), var(--violet))' }}
      />
    </div>
  );
}

// ── Overdue Task Row ──────────────────────────────────────────────────────────

function OverdueRow({ task, delay = 0 }: { task: PendingTask; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: EASE_OUT }}
      className={overdueRow}
    >
      <span className="text-[13px] shrink-0 leading-none">{task.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-[var(--text-hi)] truncate">{task.name}</div>
        <div className="flex items-center gap-2 mt-[2px]">
          <span className="text-[9px] text-[var(--rose)] font-bold">
            {task.daysOverdue ? `${task.daysOverdue}d overdue` : 'Overdue'}
          </span>
          {task.startDate && (
            <span className="text-[8px] text-[var(--text-lo)]">{task.startDate}</span>
          )}
        </div>
      </div>
      <div
        className="text-[7px] font-bold font-[var(--font-title)] uppercase tracking-wider px-1.5 py-[2px] rounded"
        style={{
          background: 'oklch(0.72 0.18 5 / 0.1)',
          border: '1px solid oklch(0.72 0.18 5 / 0.25)',
          color: 'var(--rose)',
        }}
      >
        LATE
      </div>
    </motion.div>
  );
}

// ── Unscheduled Task Row ──────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  todo: '○ To Do',
  in_progress: '◈ In Progress',
  pending: '⏳ Pending',
  waiting: '◷ Waiting',
};

function UnscheduledRow({
  task,
  delay = 0,
  onEdit,
}: {
  task: Task;
  delay?: number;
  onEdit: (t: Task) => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: EASE_OUT }}
      onClick={() => onEdit(task)}
      className="w-full flex items-center gap-2.5 px-3 py-2 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] hover:border-[oklch(0.74_0.17_85_/_0.35)] hover:bg-[oklch(0.74_0.17_85_/_0.04)] transition-colors text-left group"
    >
      <span className="text-[13px] shrink-0 leading-none">{task.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-[var(--text-hi)] truncate">{task.name}</div>
        <div className="text-[9px] text-[var(--text-lo)] mt-[1px]">
          {STATUS_LABEL[task.status] ?? task.status}
        </div>
      </div>
      <span className="text-[8px] font-bold font-[var(--font-title)] tracking-[0.08em] text-[var(--text-lo)] group-hover:text-[var(--gold)] transition-colors shrink-0">
        SCHEDULE →
      </span>
    </motion.button>
  );
}

// ── Calendar Heatmap ──────────────────────────────────────────────────────────

function CalendarHeatmap({ activityMap }: { activityMap: Record<string, number> }) {
  const { cols, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start 364 days ago, aligned to Monday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    const startDow = startDate.getDay();
    const offset = startDow === 0 ? 6 : startDow - 1;
    startDate.setDate(startDate.getDate() - offset);

    const cols: Array<Array<{ date: string; future: boolean }>> = [];
    const d = new Date(startDate);

    while (d <= today) {
      const week: Array<{ date: string; future: boolean }> = [];
      for (let i = 0; i < 7; i++) {
        week.push({ date: d.toISOString().slice(0, 10), future: d > today });
        d.setDate(d.getDate() + 1);
      }
      cols.push(week);
    }

    // Month label per first week of a new month
    const monthLabels: { colIdx: number; label: string }[] = [];
    let lastMonth = -1;
    cols.forEach((week, wi) => {
      const firstDate = week[0]?.date;
      if (!firstDate) return;
      const dd = new Date(firstDate);
      if (dd.getMonth() !== lastMonth) {
        monthLabels.push({
          colIdx: wi,
          label: dd.toLocaleDateString('en-US', { month: 'short' }),
        });
        lastMonth = dd.getMonth();
      }
    });

    return { cols, monthLabels };
  }, []);

  function levelColor(count: number): string {
    if (count === 0) return 'var(--panel3)';
    if (count <= 1) return 'oklch(0.68 0.22 295 / 0.28)';
    if (count <= 3) return 'oklch(0.68 0.22 295 / 0.56)';
    if (count <= 6) return 'oklch(0.68 0.22 295 / 0.82)';
    return 'var(--mint)';
  }

  const DOW_LABELS = ['M', '', 'W', '', 'F', '', 'S'];

  return (
    <div className="overflow-x-auto pb-0.5">
      <div className="flex gap-0 min-w-max">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-[2px] mr-1.5 pt-[18px] shrink-0">
          {DOW_LABELS.map((lbl, i) => (
            <div key={i} className="h-[10px] w-[6px] flex items-center justify-end">
              <span className="text-[6px] text-[var(--text-lo)] leading-none">{lbl}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-col">
          {/* Month labels */}
          <div className="flex mb-[3px]" style={{ height: 14 }}>
            {cols.map((_, wi) => {
              const ml = monthLabels.find((m) => m.colIdx === wi);
              return (
                <div key={wi} className="w-[10px] mr-[2px] shrink-0 overflow-visible">
                  {ml && (
                    <span className="text-[7px] text-[var(--text-lo)] whitespace-nowrap block leading-none">
                      {ml.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cells */}
          <div className="flex gap-[2px]">
            {cols.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((cell, di) => {
                  if (cell.future) {
                    return (
                      <div
                        key={di}
                        className="w-[10px] h-[10px] rounded-[2px]"
                        style={{ background: 'transparent' }}
                      />
                    );
                  }
                  const count = activityMap[cell.date] ?? 0;
                  return (
                    <motion.div
                      key={di}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: Math.min(wi * 0.008 + di * 0.001, 0.6),
                        ease: EASE_OUT,
                      }}
                      className="w-[10px] h-[10px] rounded-[2px] cursor-default"
                      style={{ background: levelColor(count) }}
                      title={`${cell.date}: ${count} activities`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[7px] text-[var(--text-lo)]">Less</span>
        {([0, 1, 3, 5, 8] as const).map((n, i) => (
          <div
            key={i}
            className="w-[10px] h-[10px] rounded-[2px]"
            style={{ background: levelColor(n) }}
          />
        ))}
        <span className="text-[7px] text-[var(--text-lo)]">More</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AnalyticsPanel() {
  const { data, isLoading } = useStats();
  const { data: heatmapData } = useStatsHeatmap();
  const { data: allTasks = [] } = useTasks();
  const { mutate: updateTask, isPending: updatingTask } = useUpdateTask();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const STATUS_ORDER: Record<string, number> = { in_progress: 0, todo: 1, pending: 2, waiting: 3 };
  const unscheduledTasks = useMemo(
    () =>
      allTasks
        .filter((t) => !t.startDate && t.status !== 'done' && t.active !== false)
        .sort(
          (a, b) =>
            (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4) ||
            a.name.localeCompare(b.name),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTasks],
  );

  if (isLoading || !data) {
    return (
      <div className={outer}>
        <div className="flex-1 flex flex-col gap-3 p-3">
          {[80, 120, 100, 80].map((h, i) => (
            <div
              key={i}
              className="rounded-[var(--r-sm)] animate-pulse"
              style={{ height: h, background: 'var(--panel2)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  const {
    tasks,
    habits,
    weekly,
    pendingTasks,
    schedule,
    dailyAverage,
    trendVsLastWeek,
    character,
  } = data;

  const overdueTasks = [...pendingTasks]
    .filter((t) => t.overdue)
    .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0));

  const dayLabels = (weekly.dates ?? []).map(toDayAbbr);

  const chartData = (weekly.dates ?? []).map((_, i) => ({
    day: dayLabels[i] ?? '',
    thisWeek: weekly.tasksDone[i] ?? 0,
    lastWeek: (weekly.lastWeekTasksDone ?? [])[i] ?? 0,
  }));

  const habitChartData = (weekly.dates ?? []).map((_, i) => ({
    day: dayLabels[i] ?? '',
    done: weekly.habitsDone[i] ?? 0,
  }));

  const xpPct = Math.round((character.xp / Math.max(character.xpNext, 1)) * 100);
  const focusHours = schedule ? fmtHours(schedule.completedMinutes) : '—';
  const plannedHours = schedule ? fmtHours(schedule.plannedMinutes) : '—';

  function handleSaveTask(id: string, payload: UpdateTaskPayload, onSuccess: () => void) {
    updateTask(
      { id, ...payload },
      {
        onSuccess: () => {
          setEditingTask(null);
          onSuccess();
        },
      },
    );
  }

  return (
    <>
      <div className={outer}>
        <div className={wrap}>
          {/* ── KPI Row ──────────────────────────────────────────────────────── */}
          <section>
            <SectionTitle>Overview</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <KpiCard
                label="Completion"
                value={`${tasks.completionRate}%`}
                sub={`${tasks.done} / ${tasks.total} tasks done`}
                accent="var(--mint)"
                delay={0}
              />
              <KpiCard
                label="Daily Average"
                value={`${dailyAverage ?? 0}`}
                sub="tasks per day · 7d"
                accent="var(--cyan)"
                delay={0.05}
              />
              <KpiCard
                label="Focus Time · 7d"
                value={focusHours}
                sub={`of ${plannedHours} planned`}
                accent="var(--violet)"
                delay={0.1}
              />
              <KpiCard
                label="Weekly Trend"
                value={<TrendBadge pct={trendVsLastWeek} />}
                sub="vs last week"
                delay={0.15}
              />
            </div>
          </section>

          {/* ── Task Completion Trend ─────────────────────────────────────────── */}
          <section>
            <SectionTitle
              right={
                <div className="flex items-center gap-3 text-[7px] text-[var(--text-lo)]">
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded-[2px]"
                      style={{ background: 'oklch(0.68 0.22 295 / 0.55)' }}
                    />
                    Last wk
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded-[2px]"
                      style={{ background: 'oklch(0.76 0.14 162)' }}
                    />
                    This wk
                  </span>
                </div>
              }
            >
              Task Completion · 7d
            </SectionTitle>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={chartCard}
            >
              <ResponsiveContainer width="100%" height={90}>
                <BarChart
                  data={chartData}
                  barGap={2}
                  barCategoryGap="25%"
                  margin={{ top: 4, right: 2, bottom: 0, left: -28 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 7, fill: 'var(--text-lo)', fontFamily: 'var(--f-body)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 7, fill: 'var(--text-lo)', fontFamily: 'var(--f-body)' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'oklch(1 0 0 / 0.03)' }} />
                  <Bar
                    dataKey="lastWeek"
                    fill="oklch(0.68 0.22 295)"
                    fillOpacity={0.45}
                    radius={[2, 2, 0, 0]}
                    isAnimationActive
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="thisWeek"
                    fill="oklch(0.76 0.14 162)"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive
                    animationDuration={700}
                    animationEasing="ease-out"
                    animationBegin={100}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </section>

          {/* ── Self Improvement ──────────────────────────────────────────────── */}
          <section>
            <SectionTitle>Self Improvement</SectionTitle>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className={selfCard}
            >
              {/* Level + Rank row */}
              <div className="flex items-center gap-3 mb-2.5">
                <div className={rankBadge}>
                  <span className="text-[var(--gold)] text-[11px] font-bold font-[var(--font-title)] leading-none">
                    {character.rank}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[20px] font-bold text-[var(--text-hi)] font-[var(--font-title)] leading-none">
                      Lv.{character.level}
                    </span>
                    <span className="text-[9px] text-[var(--text-lo)]">
                      {character.xp.toLocaleString()} / {character.xpNext.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <XpBar xp={character.xp} xpNext={character.xpNext} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] text-[var(--text-lo)]">Progress</div>
                  <div className="text-[14px] font-bold text-[var(--gold)] font-[var(--font-title)] leading-none mt-0.5">
                    {xpPct}%
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-0 pt-2 border-t border-[var(--border)]">
                <div className={selfStat}>
                  <span className="text-[14px] leading-none">🔥</span>
                  <div>
                    <div className="text-[12px] font-bold text-[var(--gold)] leading-none">
                      {character.streak}
                    </div>
                    <div className="text-[7px] text-[var(--text-lo)] mt-[1px]">day streak</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-[var(--border)] mx-1" />
                <div className={selfStat}>
                  <span className="text-[14px] leading-none">💰</span>
                  <div>
                    <div className="text-[12px] font-bold text-[var(--text-hi)] leading-none">
                      {character.coins.toLocaleString()}
                    </div>
                    <div className="text-[7px] text-[var(--text-lo)] mt-[1px]">coins</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-[var(--border)] mx-1" />
                <div className={selfStat}>
                  <span className="text-[14px] leading-none">💎</span>
                  <div>
                    <div className="text-[12px] font-bold text-[var(--text-hi)] leading-none">
                      {character.gems}
                    </div>
                    <div className="text-[7px] text-[var(--text-lo)] mt-[1px]">gems</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ── Habit Streak Chart ────────────────────────────────────────────── */}
          <section>
            <SectionTitle
              right={
                <span className="text-[9px] text-[var(--text-lo)]">
                  {habits.doneToday}/{habits.totalToday} today
                </span>
              }
            >
              Habit Streak · 7d
            </SectionTitle>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className={chartCard}
            >
              <ResponsiveContainer width="100%" height={80}>
                <BarChart
                  data={habitChartData}
                  barCategoryGap="35%"
                  margin={{ top: 4, right: 2, bottom: 0, left: -28 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 7, fill: 'var(--text-lo)', fontFamily: 'var(--f-body)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 7, fill: 'var(--text-lo)', fontFamily: 'var(--f-body)' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-[var(--panel3)] border border-[var(--border-hi)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-[9px] shadow-lg">
                          <div className="text-[var(--text-lo)] mb-0.5">{label}</div>
                          <span className="font-bold text-[var(--violet)]">
                            {payload[0]?.value} habits
                          </span>
                        </div>
                      );
                    }}
                    cursor={{ fill: 'oklch(1 0 0 / 0.03)' }}
                  />
                  <Bar
                    dataKey="done"
                    fill="oklch(0.68 0.22 295)"
                    radius={[3, 3, 0, 0]}
                    isAnimationActive
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </section>

          {/* ── Overdue Tasks ─────────────────────────────────────────────────── */}
          {overdueTasks.length > 0 && (
            <section>
              <SectionTitle
                right={
                  <span className="text-[9px] font-bold text-[var(--rose)]">
                    {overdueTasks.length} overdue
                  </span>
                }
              >
                Needs Attention
              </SectionTitle>
              <div className="flex flex-col gap-1.5">
                {overdueTasks.map((t, i) => (
                  <OverdueRow key={t.id} task={t} delay={i * 0.05} />
                ))}
              </div>
            </section>
          )}

          {overdueTasks.length === 0 && tasks.total > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={allClearBanner}
            >
              <span className="text-[18px]">✦</span>
              <span className="text-[11px] font-semibold text-[var(--mint)]">No overdue tasks</span>
            </motion.div>
          )}

          {/* ── Unscheduled Tasks ─────────────────────────────────────────────── */}
          {unscheduledTasks.length > 0 && (
            <section>
              <SectionTitle
                right={
                  <span className="text-[9px] font-bold text-[var(--gold)]">
                    {unscheduledTasks.length} unscheduled
                  </span>
                }
              >
                Unscheduled
              </SectionTitle>
              <div className="flex flex-col gap-1.5">
                {unscheduledTasks.slice(0, 15).map((t, i) => (
                  <UnscheduledRow key={t.id} task={t} delay={i * 0.03} onEdit={setEditingTask} />
                ))}
                {unscheduledTasks.length > 15 && (
                  <div className="text-[9px] text-[var(--text-lo)] text-center py-1">
                    +{unscheduledTasks.length - 15} more tasks without a date
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Calendar Heatmap ──────────────────────────────────────────────── */}
          <section>
            <SectionTitle>Activity · Last Year</SectionTitle>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className={chartCard}
            >
              <CalendarHeatmap activityMap={heatmapData?.activityMap ?? {}} />
            </motion.div>
          </section>
        </div>
      </div>

      <EditTaskModal
        task={editingTask ? taskToUITask(editingTask) : null}
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
        saving={updatingTask}
      />
    </>
  );
}

// ── Style constants ────────────────────────────────────────────────────────────

const outer = 'flex-1 overflow-hidden min-h-0 flex flex-col';
const wrap = 'flex-1 overflow-y-auto p-3 flex flex-col gap-4 min-h-0';

const kpiCard =
  'bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2.5 flex flex-col';
const kpiLabel =
  'text-[8px] uppercase tracking-[0.1em] text-[var(--text-lo)] font-[var(--font-title)] mb-1';
const kpiVal =
  'text-[18px] font-bold text-[var(--text-hi)] leading-none font-[var(--font-title)] tabular-nums';
const kpiSub = 'text-[9px] text-[var(--text-mid)] mt-1';

const sectionTitleCls =
  'text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] font-[var(--font-title)]';

const chartCard =
  'bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2.5';

const selfCard =
  'bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2.5';

const rankBadge =
  'w-[36px] h-[36px] rounded-[var(--r-sm)] shrink-0 flex items-center justify-center ' +
  'bg-[oklch(0.74_0.17_85_/_0.1)] border border-[oklch(0.74_0.17_85_/_0.3)]';

const selfStat = 'flex items-center gap-2 flex-1 px-2';

const overdueRow =
  'flex items-center gap-2.5 px-3 py-2 bg-[var(--panel2)] ' +
  'border border-[oklch(0.72_0.18_5_/_0.18)] rounded-[var(--r-sm)] ' +
  'hover:border-[oklch(0.72_0.18_5_/_0.4)] transition-colors duration-200';

const allClearBanner = 'flex items-center justify-center gap-2 py-3 text-[var(--text-lo)]';
