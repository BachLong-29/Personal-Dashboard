'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/libs/utils';

import { SLOTS, type TaskSlot, type UITask } from '../../data/mock';

// ─── Types / helpers ──────────────────────────────────────────────────────────

interface ActiveBlockProps {
  tasks: UITask[];
}

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

/** Which slot the current hour belongs to, or null if outside all slots */
function getCurrentSlot(now: Date): TaskSlot | null {
  const h = now.getHours();
  if (h >= 6  && h < 10) return 'morning';
  if (h >= 10 && h < 13) return 'deep';
  if (h >= 13 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return null;
}

/** Minutes until the end of the given slot from `now` */
function minsUntilSlotEnd(slot: TaskSlot, now: Date): number {
  const endHour: Record<TaskSlot, number> = {
    morning: 10, deep: 13, afternoon: 17, evening: 22,
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
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActiveBlock({ tasks }: ActiveBlockProps) {
  // Update clock every 30 s so "remaining" stays current
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const currentSlot = getCurrentSlot(now);
  const slotMeta    = currentSlot ? SLOTS.find((s) => s.id === currentSlot) : null;

  // Highest-priority undone task in the current time slot
  const activeTask = currentSlot
    ? [...tasks.filter((t) => t.day === 0 && t.slot === currentSlot && !t.done)]
        .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))[0]
      ?? null
    : null;

  return (
    <>
      {/* Scoped keyframe — no global CSS needed */}
      <style>{`
        @keyframes active-sweep {
          from { left: -70%; }
          to   { left: 130%; }
        }
      `}</style>

      {activeTask && slotMeta
        ? <ActiveState task={activeTask} slot={currentSlot!} slotMeta={slotMeta} now={now} />
        : <IdleState now={now} />
      }
    </>
  );
}

// ─── Active state ─────────────────────────────────────────────────────────────

interface ActiveStateProps {
  task: UITask;
  slot: TaskSlot;
  slotMeta: typeof SLOTS[number];
  now: Date;
}

function ActiveState({ task, slot, slotMeta, now }: ActiveStateProps) {
  const progress = task.progress || 0;

  // Remaining = task estimate × (1 – progress); fall back to slot end time
  const estRemaining = task.est > 0
    ? Math.max(0, Math.round(task.est * (1 - progress)))
    : minsUntilSlotEnd(slot, now);

  const r             = 26;
  const circumference = 2 * Math.PI * r;
  const dashOffset    = circumference * (1 - progress);

  return (
    <div
      className={activeWrap}
      style={{
        background:  'linear-gradient(135deg, oklch(0.32 0.18 295 / 0.25), oklch(0.32 0.18 82 / 0.18))',
        border:      '1px solid oklch(0.68 0.22 295 / 0.45)',
        boxShadow:   '0 0 26px var(--violet-glow), inset 0 0 18px oklch(0.68 0.22 295 / 0.06)',
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
        <div className="text-[9px] text-[var(--text-lo)]">
          slot ends&nbsp;
          <span className="font-semibold text-[var(--text-mid)]">{slotMeta.time.split('–')[1]}:00</span>
        </div>
        <div className={cn('text-[9px] font-semibold', estRemaining <= 15 ? 'text-[var(--rose)]' : 'text-[var(--text-mid)]')}>
          {fmtMins(estRemaining)}
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
          {task.streak > 0 && <span className="text-[var(--gold)]">✦ Streak {task.streak}d &nbsp;</span>}
          {task.combo  > 0 && <span className="text-[var(--violet)]">×{task.combo} combo &nbsp;</span>}
          <span>+{task.xp} XP on completion</span>
        </div>
      </div>

      {/* Right: progress ring */}
      <div className="relative shrink-0 w-[56px] h-[56px]">
        <svg width="56" height="56" viewBox="0 0 64 64" className="rotate-[-90deg]">
          <circle
            cx="32" cy="32" r={r}
            stroke="oklch(0.68 0.22 295 / 0.18)"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="32" cy="32" r={r}
            stroke="url(#abGrad)"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="abGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={slotMeta.color} />
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
  return (
    <div className={idleWrap}>
      {/* Idle pulse */}
      <div className={idlePulse} />

      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-black tracking-[0.14em] font-[var(--font-title)] text-[var(--text-lo)] uppercase mb-[3px]">
          No Active Quest · {fmtClock(now)}
        </div>
        <div className="text-[12px] font-semibold text-[var(--text-mid)]">
          All quiet in this realm
        </div>
        <div className="text-[9px] text-[var(--text-lo)] mt-[2px]">
          Drag a quest into a slot to begin, or forge a new one
        </div>
      </div>

      <div className="text-[28px] opacity-15 shrink-0 font-[var(--font-title)]">◈</div>
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

// background / border / box-shadow are set as inline styles in ActiveState JSX
const activeWrap =
  'relative flex items-center gap-3 overflow-hidden mx-3 my-2 px-4 py-3 shrink-0 rounded-[var(--r-sm)]';

const pulse =
  'w-2 h-2 rounded-full bg-[var(--violet)] shadow-[0_0_8px_var(--violet-glow)] animate-pulse shrink-0';

const idleWrap =
  'flex items-center gap-3 mx-3 my-2 px-4 py-3 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] shrink-0 opacity-60';

const idlePulse =
  'w-2 h-2 rounded-full border border-[var(--border)] shrink-0 opacity-50';
