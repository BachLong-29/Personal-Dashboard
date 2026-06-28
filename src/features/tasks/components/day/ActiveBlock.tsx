'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

import { SLOTS, type SlotMeta, type TaskSlot, type UITask } from '../../data/mock';

const EVENING_SLOT = SLOTS.find((s) => s.id === 'evening') as SlotMeta;

// ─── Types / helpers ──────────────────────────────────────────────────────────

interface ActiveBlockProps {
  tasks: UITask[];
}

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function getCurrentSlot(now: Date): TaskSlot | null {
  const h = now.getHours();
  if (h >= 6 && h < 10) return 'morning';
  if (h >= 10 && h < 13) return 'deep';
  if (h >= 13 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return null;
}

function minsUntilSlotEnd(slot: TaskSlot, now: Date): number {
  const endHour: Record<TaskSlot, number> = {
    morning: 10,
    deep: 13,
    afternoon: 17,
    evening: 22,
  };
  const end = new Date(now);
  end.setHours(endHour[slot], 0, 0, 0);
  return Math.max(0, Math.round((end.getTime() - now.getTime()) / 60_000));
}

function fmtMins(mins: number): string {
  if (mins <= 0) return 'ending soon';
  if (mins < 60) return `${mins}m remaining`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m remaining` : `${h}h remaining`;
}

function fmtClock(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// ─── Task time-window helpers ─────────────────────────────────────────────────

/**
 * Returns the absolute { startMs, endMs } for a task's scheduled window.
 * endMs = startMs + duration (or 60 min default if no est).
 * Returns null when task has no startTime.
 */
function getTaskWindow(task: UITask, now: Date): { startMs: number; endMs: number } | null {
  if (!task.startTime) return null;
  const [hStr, mStr] = task.startTime.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  const durationMs = (task.est > 0 ? task.est : 60) * 60_000;
  return { startMs: start.getTime(), endMs: start.getTime() + durationMs };
}

// ─── Active task resolution ───────────────────────────────────────────────────

interface ActiveResult {
  task: UITask | null;
  /** Milliseconds until this task's window ends (used for countdown + timeout) */
  windowEndsMs: number;
  /** true = timed via startTime; false = slot-based fallback */
  isTimed: boolean;
}

/**
 * Resolves which task is "active" right now.
 *
 * Priority:
 *   1. Task with startTime where now ∈ [startTime, startTime + duration)
 *   2. Highest-priority task without startTime in the current slot (fallback)
 */
function resolveActiveTask(tasks: UITask[], now: Date): ActiveResult {
  const nowMs = now.getTime();
  const todayUndone = tasks.filter((t) => t.day === 0 && !t.done);

  // ── 1. Timed tasks currently in their window ─────────────────────────────────
  const inWindow = todayUndone
    .flatMap((t) => {
      const win = getTaskWindow(t, now);
      if (!win || nowMs < win.startMs || nowMs >= win.endMs) return [];
      return [{ task: t, windowEndsMs: win.endMs - nowMs }];
    })
    .sort(
      (a, b) => (PRIORITY_ORDER[a.task.priority] ?? 9) - (PRIORITY_ORDER[b.task.priority] ?? 9),
    );

  if (inWindow.length > 0) {
    const first = inWindow[0];
    if (first) return { task: first.task, windowEndsMs: first.windowEndsMs, isTimed: true };
  }

  // ── 2. Slot-based fallback (tasks without explicit startTime) ─────────────────
  const currentSlot = getCurrentSlot(now);
  if (!currentSlot) return { task: null, windowEndsMs: 0, isTimed: false };

  const slotTask =
    todayUndone
      .filter((t) => !t.startTime && t.slot === currentSlot)
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))[0] ??
    null;

  const minsLeft = slotTask
    ? slotTask.est > 0
      ? Math.max(0, Math.round(slotTask.est * (1 - (slotTask.progress || 0))))
      : minsUntilSlotEnd(currentSlot, now)
    : 0;

  return { task: slotTask, windowEndsMs: minsLeft * 60_000, isTimed: false };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActiveBlock({ tasks }: ActiveBlockProps) {
  const [now, setNow] = useState(() => new Date());

  // Tick every 30s to keep clock + remaining time display fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { task: activeTask, windowEndsMs, isTimed } = resolveActiveTask(tasks, now);

  // When the current task's window ends, immediately re-resolve to find the next task.
  // The timeout is reset whenever the active task or its remaining time changes.
  useEffect(() => {
    if (!activeTask || windowEndsMs <= 0) return;
    const id = setTimeout(() => setNow(new Date()), windowEndsMs + 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTask?.id, windowEndsMs]);

  const currentSlot = getCurrentSlot(now);

  // Slot meta for display — prefer task's own slot so timed tasks outside
  // named-slot hours (e.g. 23:30) still get the correct color palette.
  const displaySlotId = activeTask?.slot ?? currentSlot ?? 'evening';
  const displaySlot = SLOTS.find((s) => s.id === displaySlotId) ?? EVENING_SLOT;

  return (
    <>
      <style>{`
        @keyframes active-sweep {
          from { left: -70%; }
          to   { left: 130%; }
        }
      `}</style>

      {activeTask ? (
        <ActiveState
          task={activeTask}
          slotMeta={displaySlot}
          remainingMs={windowEndsMs}
          isTimed={isTimed}
          now={now}
        />
      ) : (
        <IdleState now={now} />
      )}
    </>
  );
}

// ─── Active state ─────────────────────────────────────────────────────────────

interface ActiveStateProps {
  task: UITask;
  slotMeta: (typeof SLOTS)[number];
  /** Milliseconds until task window ends */
  remainingMs: number;
  isTimed: boolean;
  now: Date;
}

function ActiveState({ task, slotMeta, remainingMs, isTimed, now }: ActiveStateProps) {
  const progress = task.progress || 0;

  /**
   * Minutes to display in the countdown:
   *  - Timed task → real wall-clock remaining (endTime − now)
   *  - Slot task  → estimated remaining (est × (1 – progress)) or slot end
   */
  const minsRemaining = isTimed
    ? Math.ceil(remainingMs / 60_000)
    : task.est > 0
      ? Math.max(0, Math.round(task.est * (1 - progress)))
      : Math.ceil(remainingMs / 60_000);

  const r = 26;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className={activeWrap}
      style={{
        background:
          'linear-gradient(135deg, oklch(0.32 0.18 295 / 0.25), oklch(0.32 0.18 82 / 0.18))',
        border: '1px solid oklch(0.68 0.22 295 / 0.45)',
        boxShadow: '0 0 26px var(--violet-glow), inset 0 0 18px oklch(0.68 0.22 295 / 0.06)',
      }}
    >
      {/* Animated sweep line */}
      <div
        className="absolute top-0 h-full w-[60%] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.07), transparent)',
          animation: 'active-sweep 3.5s linear infinite',
        }}
      />

      {/* Pulse dot */}
      <div className={pulse} />

      {/* Left: time info */}
      <div className="flex flex-col gap-[3px] shrink-0">
        <div
          className="text-[9px] font-black tracking-[0.12em] font-[var(--font-title)]"
          style={{ color: slotMeta.color }}
        >
          {slotMeta.glyph} {slotMeta.label.toUpperCase()} · {fmtClock(now)}
        </div>

        {/* Show exact scheduled window for timed tasks */}
        {isTimed && task.startTime ? (
          <div className="text-[9px] text-[var(--text-lo)]">
            started&nbsp;
            <span className="font-semibold text-[var(--text-mid)]">{task.startTime}</span>
          </div>
        ) : (
          <div className="text-[9px] text-[var(--text-lo)]">
            slot ends&nbsp;
            <span className="font-semibold text-[var(--text-mid)]">
              {slotMeta.time.split('–')[1]}:00
            </span>
          </div>
        )}

        <div
          className={cn(
            'text-[9px] font-semibold',
            minsRemaining <= 15 ? 'text-[var(--rose)]' : 'text-[var(--text-mid)]',
          )}
        >
          {fmtMins(minsRemaining)}
        </div>
      </div>

      {/* Center: quest info */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[8px] font-black tracking-[0.12em] font-[var(--font-title)] mb-[3px] uppercase"
          style={{ color: slotMeta.color }}
        >
          ▶ ACTIVE QUEST
        </div>
        <div className="text-[12px] font-semibold text-[var(--text-hi)] truncate leading-[1.2]">
          {task.title}
        </div>
        <div className="text-[9px] text-[var(--text-mid)] mt-[3px]">
          {task.streak > 0 && (
            <span className="text-[var(--gold)]">✦ Streak {task.streak}d &nbsp;</span>
          )}
          {task.combo > 0 && (
            <span className="text-[var(--violet)]">×{task.combo} combo &nbsp;</span>
          )}
          <span>+{task.xp} XP on completion</span>
        </div>
      </div>

      {/* Right: progress ring */}
      <div className="relative shrink-0 w-[56px] h-[56px]">
        <svg width="56" height="56" viewBox="0 0 64 64" className="rotate-[-90deg]">
          <circle
            cx="32"
            cy="32"
            r={r}
            stroke="oklch(0.68 0.22 295 / 0.18)"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r={r}
            stroke="url(#abGrad)"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="abGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={slotMeta.color} />
              <stop offset="100%" stopColor="oklch(0.78 0.16 82)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--text-hi)]">
          {Math.round(progress * 100)}%
        </div>
      </div>
    </div>
  );
}

// ─── Idle state ───────────────────────────────────────────────────────────────

function IdleState({ now }: { now: Date }) {
  const t = useTranslations('tasks');

  return (
    <div className={idleWrap}>
      <div className={idlePulse} />

      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-black tracking-[0.14em] font-[var(--font-title)] text-[var(--text-lo)] uppercase mb-[3px]">
          {t('activeBlock.idleTitle', { time: fmtClock(now) })}
        </div>
        <div className="text-[12px] font-semibold text-[var(--text-mid)]">
          {t('activeBlock.idleSubtitle')}
        </div>
        <div className="text-[9px] text-[var(--text-lo)] mt-[2px]">
          {t('activeBlock.idleDescription')}
        </div>
      </div>

      <div className="text-[28px] opacity-15 shrink-0 font-[var(--font-title)]">◈</div>
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const activeWrap =
  'relative flex items-center gap-3 overflow-hidden mx-3 my-2 px-4 py-3 shrink-0 rounded-[var(--r-sm)]';

const pulse =
  'w-2 h-2 rounded-full bg-[var(--violet)] shadow-[0_0_8px_var(--violet-glow)] animate-pulse shrink-0';

const idleWrap =
  'flex items-center gap-3 mx-3 my-2 px-4 py-3 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] shrink-0 opacity-60';

const idlePulse = 'w-2 h-2 rounded-full border border-[var(--border)] shrink-0 opacity-50';
