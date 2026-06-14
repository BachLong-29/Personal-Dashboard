'use client';

import { cn } from '@/libs/utils';
import { CATEGORIES, MOTIV_LINES } from '../types';
import type { Goal, Trophy, AmbitionsStats } from '../types';
import { ProgressRing } from './ProgressRing';

interface OverviewViewProps {
  allGoals: Goal[];
  stats: AmbitionsStats;
  trophies: Trophy[];
  streak: number;
}

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_BAR_STYLE: Record<string, string> = {
  'not-started': 'bg-[var(--panel2)]',
  'in-progress': 'bg-[var(--cyan)]',
  'completed':   'bg-[var(--mint)]',
  'archived':    'bg-[oklch(0.5_0.06_295)]',
};

const CAT_BAR_STYLE: Record<string, string> = {
  career:   'bg-[var(--gold)]',
  health:   'bg-[var(--mint)]',
  learning: 'bg-[var(--cyan)]',
  finance:  'bg-[var(--violet)]',
  personal: 'bg-[var(--rose)]',
};

export function OverviewView({ allGoals, stats, trophies: _trophies, streak }: OverviewViewProps) {
  const motiv = MOTIV_LINES[0]!;

  const statusOrder = ['not-started', 'in-progress', 'completed', 'archived'] as const;
  const statusCounts = statusOrder.map((s) => ({ s, n: allGoals.filter((g) => g.status === s).length }));
  const totalForBar = statusCounts.reduce((a, c) => a + c.n, 0) || 1;

  const upcoming = [...allGoals]
    .filter((g) => g.status === 'in-progress' || g.status === 'not-started')
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  const byMonth: Record<string, Goal[]> = {};
  allGoals
    .filter((g) => g.status !== 'archived')
    .forEach((g) => {
      const m = (g.completedDate ?? g.targetLabel).split(' ')[0]!;
      (byMonth[m] = byMonth[m] ?? []).push(g);
    });
  const months = MONTH_ORDER.filter((m) => byMonth[m]);

  const catDist = CATEGORIES.map((c) => ({
    ...c,
    n: allGoals.filter((g) => g.cat === c.id).length,
  }));
  const maxCat = Math.max(...catDist.map((c) => c.n), 1);

  // Simple week dots (last streak days = lit)
  const todayIdx = new Date().getDay();
  const weekDots = [1, 2, 3, 4, 5, 6, 0].map((d, i) => ({
    d: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]!,
    lit: streak > 0 && i >= Math.max(0, 7 - streak),
    today: d === todayIdx,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Motivation banner */}
      <div className="flex items-center gap-4 px-5 py-4 bg-[linear-gradient(135deg,oklch(0.22_0.06_82_/_0.5),oklch(0.18_0.05_270_/_0.5))] border border-[oklch(0.74_0.17_85_/_0.2)] rounded-[var(--r)]">
        <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-[oklch(0.74_0.17_85_/_0.15)] border border-[oklch(0.74_0.17_85_/_0.3)] text-[var(--gold)] text-[16px]">
          ✦
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[var(--text-hi)] italic leading-[1.5]">&ldquo;{motiv.quote}&rdquo;</p>
          <p
            className="text-[10px] text-[var(--text-mid)] mt-1"
            dangerouslySetInnerHTML={{ __html: motiv.sub }}
          />
        </div>
      </div>

      {/* Row 1: Status breakdown + Completion ring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className={panel}>
          <PanelHead eyebrow="◆ Distribution" title="Status Breakdown" aux={`${totalForBar} ambitions`} />
          <div className="px-4 py-3 flex flex-col gap-4">
            <div className="flex h-6 rounded-[var(--r-sm)] overflow-hidden gap-0.5">
              {statusCounts.map(({ s, n }) =>
                n > 0 ? (
                  <div
                    key={s}
                    className={cn('flex items-center justify-center text-[8px] font-bold text-[var(--panel)] rounded-[3px] transition-[flex] duration-500', STATUS_BAR_STYLE[s])}
                    style={{ flex: n }}
                  >
                    {n}
                  </div>
                ) : null,
              )}
            </div>
            <div className="flex flex-col gap-2">
              {statusCounts.map(({ s, n }) => (
                <div key={s} className="flex items-center gap-2.5">
                  <div className={cn('w-2.5 h-2.5 rounded-[3px] shrink-0', STATUS_BAR_STYLE[s])} />
                  <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-[var(--text-hi)] capitalize">
                      {s === 'not-started' ? 'Not Started' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                    <span className="text-[9px] text-[var(--text-lo)]">({n})</span>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-mid)]">
                    {Math.round((n / totalForBar) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Completion ring */}
        <div className={cn(panel, 'border-[oklch(0.74_0.17_85_/_0.3)]')}>
          <PanelHead eyebrow="◆ Momentum" title="Completion & Streak" />
          <div className="px-4 py-3 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative text-[var(--gold)] shrink-0">
              <ProgressRing value={stats.completionRate / 100} size={110} stroke={10} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-[var(--font-title)] text-[20px] font-black text-[var(--gold)] leading-none">
                  {stats.completionRate}%
                </span>
                <span className="text-[8px] text-[var(--text-lo)] tracking-[0.08em] uppercase mt-0.5">Complete</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full sm:flex-1">
              {[
                { dot: 'var(--mint)',   label: 'Conquered',    val: stats.completed },
                { dot: 'var(--cyan)',   label: 'In Progress',  val: stats.active },
                { dot: 'var(--gold)',   label: 'Avg Progress', val: `${stats.avgProgress}%` },
              ].map(({ dot, label, val }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                  <span className="text-[10px] text-[var(--text-mid)] flex-1">{label}</span>
                  <span className="text-[10px] font-bold text-[var(--text-hi)] font-[var(--font-title)]">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Streak + Milestones + Category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak */}
        <div className={panel}>
          <div className="px-4 py-3 flex flex-col gap-3">
            <div className="text-[28px] leading-none">🔥</div>
            <div>
              <span className="font-[var(--font-title)] text-[28px] font-black text-[var(--gold)] leading-none">{streak}</span>
              <span className="text-[13px] text-[var(--text-lo)] ml-1.5">days</span>
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-hi)] font-[var(--font-title)]">Current Streak</div>
              <div className="text-[9px] text-[var(--text-lo)] mt-0.5">Keep the flame alive</div>
            </div>
            {/* Week dots */}
            <div className="flex gap-1 pt-1">
              {weekDots.map(({ d, lit, today }, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                  <span className={cn('text-[11px]', lit ? 'text-[var(--gold)]' : today ? 'text-[var(--text-mid)]' : 'text-[var(--text-lo)]')}>
                    {lit ? '✦' : today ? '◌' : '·'}
                  </span>
                  <span className={cn('text-[8px] font-[var(--font-title)] font-bold', today ? 'text-[var(--gold)]' : 'text-[var(--text-lo)]')}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className={panel}>
          <div className="px-4 py-3 flex flex-col gap-3">
            <div className="text-[var(--violet)] text-[24px] leading-none">✧</div>
            <div>
              <span className="font-[var(--font-title)] text-[28px] font-black text-[var(--violet)] leading-none">{stats.milestonesDone}</span>
              <span className="text-[13px] text-[var(--text-lo)] ml-0.5">/{stats.milestonesTotal}</span>
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-hi)] font-[var(--font-title)]">Milestones Cleared</div>
              <div className="text-[9px] text-[var(--text-lo)] mt-0.5">
                {Math.round((stats.milestonesDone / (stats.milestonesTotal || 1)) * 100)}% of all steps complete
              </div>
            </div>
            <div className="h-[5px] bg-[var(--panel2)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700 bg-[linear-gradient(90deg,oklch(0.5_0.15_295),var(--violet))]"
                style={{ width: `${(stats.milestonesDone / (stats.milestonesTotal || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category distribution */}
        <div className={panel}>
          <PanelHead eyebrow="◆ Realms" title="By Category" />
          <div className="px-4 py-3 flex flex-col gap-2.5">
            {catDist.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <span className={cn('text-[10px] w-4 text-center', c.textClass)}>{c.ci}</span>
                <span className="text-[9px] text-[var(--text-mid)] w-[52px] shrink-0 font-[var(--font-title)] tracking-[0.04em]">{c.label}</span>
                <div className="flex-1 h-[4px] bg-[var(--panel2)] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-[width] duration-700', CAT_BAR_STYLE[c.id])}
                    style={{ width: `${(c.n / maxCat) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-[var(--text-hi)] w-4 text-right font-[var(--font-title)]">{c.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Timeline + Upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timeline */}
        <div className={panel}>
          <PanelHead eyebrow="◆ Roadmap" title="Ambition Timeline" aux="2026 · by target month" />
          <div className="px-4 py-3 flex flex-col gap-4 overflow-y-auto max-h-[280px]">
            {months.length === 0 ? (
              <p className="text-[10px] text-[var(--text-lo)] py-4 text-center">No goals to display</p>
            ) : months.map((m) => (
              <div key={m}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.06em]">{m}</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-[9px] text-[var(--text-lo)]">{byMonth[m]!.length} goal{byMonth[m]!.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {byMonth[m]!.map((g) => (
                    <div key={g.id} className="flex items-center gap-2 px-2 py-1.5 bg-[var(--panel2)] rounded-[var(--r-sm)]">
                      <span className="text-[9px] text-[var(--text-lo)] shrink-0 font-[var(--font-title)]">
                        {g.completedDate ?? g.targetLabel}
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--text-hi)] flex-1 truncate">{g.title}</span>
                      <div className="w-[40px] h-[3px] bg-[var(--panel)] rounded-full overflow-hidden shrink-0">
                        <div className="h-full rounded-full bg-[var(--gold)] transition-[width] duration-500" style={{ width: `${g.progress * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-[var(--text-lo)] shrink-0">
                        {g.status === 'completed' ? '✓' : `${Math.round(g.progress * 100)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className={panel}>
          <PanelHead eyebrow="◆ Imminent" title="Upcoming Deadlines" />
          <div className="px-4 py-3 flex flex-col gap-2">
            {upcoming.length === 0 ? (
              <p className="text-[10px] text-[var(--text-lo)] py-6 text-center">No upcoming deadlines</p>
            ) : upcoming.map((g) => {
              const catAccent = CATEGORIES.find((c) => c.id === g.cat)?.accent ?? 'var(--gold)';
              return (
                <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 bg-[var(--panel2)] rounded-[var(--r-sm)]">
                  <div className="flex flex-col items-center shrink-0 w-10 text-center">
                    <span className="font-[var(--font-title)] text-[18px] font-black leading-none" style={{ color: catAccent }}>
                      {g.daysLeft}
                    </span>
                    <span className="text-[8px] text-[var(--text-lo)] uppercase tracking-[0.06em]">days</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-[var(--text-hi)] truncate">{g.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-[var(--text-lo)]">{g.targetLabel}</span>
                      <div className="flex-1 h-[3px] bg-[var(--panel)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${g.progress * 100}%`, background: catAccent }} />
                      </div>
                      <span className="text-[9px] text-[var(--text-lo)]">{Math.round(g.progress * 100)}%</span>
                    </div>
                  </div>
                  {g.daysLeft <= 35 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--rose)] shrink-0 shadow-[0_0_6px_var(--rose)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelHead({ eyebrow, title, aux }: { eyebrow: string; title: string; aux?: string }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3 pb-2.5 border-b border-[var(--border)]">
      <div className="flex flex-col gap-0.5 flex-1">
        <span className="text-[8px] text-[var(--gold)] tracking-[0.12em] uppercase font-[var(--font-title)]">{eyebrow}</span>
        <span className="text-[11px] font-bold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.04em]">{title}</span>
      </div>
      {aux && <span className="text-[9px] text-[var(--text-lo)] shrink-0">{aux}</span>}
    </div>
  );
}

const panel =
  "bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] overflow-hidden";
