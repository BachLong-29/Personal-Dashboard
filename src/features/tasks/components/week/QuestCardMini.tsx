'use client';

import { cn } from '@/libs/utils';

import { catOf, fmtEst, priOf, COLOR_VAR, type UITask } from '../../data/mock';
import { qcxBtnPrimary, qcxBtnGhost } from '../shared/styles';

interface QuestCardMiniProps {
  task: UITask;
  expanded: boolean;
  onExpand: () => void;
  onToggleDone: (id: string) => void;
}

export function QuestCardMini(props: QuestCardMiniProps) {
  const isHabit = props.task.source === 'habit' || props.task.cat === 'habit';
  return isHabit ? <HabitRow {...props} /> : <TaskRow {...props} />;
}

// ─── Habit row ────────────────────────────────────────────────────────────────

function HabitRow({ task, expanded, onExpand, onToggleDone }: QuestCardMiniProps) {
  const c = catOf(task.cat);
  const catColor = COLOR_VAR[c.color] ?? 'var(--text-lo)';
  const icon = task.icon ?? c.icon;

  return (
    <article
      className={cn(
        cardBase,
        task.done && 'opacity-40',
        expanded && 'border-[oklch(0.66_0.22_295_/_0.4)]',
      )}
      style={{ borderLeftColor: catColor, borderLeftWidth: 2 }}
    >
      {/* Row 1: icon · title · streak · toggle */}
      <div className="flex items-center gap-1.5">
        <span
          className="text-[12px] w-4 shrink-0 text-center leading-none"
          style={{ color: catColor }}
        >
          {icon}
        </span>

        <span
          className={cn(
            'flex-1 min-w-0 text-[10px] font-semibold text-[var(--text-hi)] leading-tight truncate cursor-pointer',
            task.done && 'line-through text-[var(--text-lo)]',
          )}
          onClick={onExpand}
        >
          {task.title}
        </span>

        {task.streak > 0 && (
          <span className="text-[8px] font-bold text-[var(--gold)] shrink-0 tabular-nums">
            🔥{task.streak}
          </span>
        )}

        <button
          type="button"
          className={cn(
            'w-4 h-4 rounded-full border border-[var(--border)] flex items-center justify-center text-[7px] font-bold transition-all shrink-0',
            task.done && 'bg-[var(--mint)] border-[var(--mint)] text-[oklch(0.1_0_0)]',
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(task.id);
          }}
          aria-label={task.done ? 'Mark undone' : 'Mark done'}
        >
          {task.done ? '✓' : ''}
        </button>
      </div>

      {/* Row 2: time · xp */}
      <div className="flex items-center gap-1.5 mt-0.5 pl-5">
        {task.startTime && (
          <span className="text-[7px] text-[var(--text-lo)]">{task.startTime}</span>
        )}
        <span className="text-[7px] font-bold text-[var(--violet)]">
          +{task.xp}
          <small className="font-normal opacity-60 ml-0.5">xp</small>
        </span>
        {task.combo > 0 && (
          <span className="text-[7px] font-bold text-[var(--cyan)]">×{task.combo}</span>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-1.5 pt-1.5 border-t border-[var(--border)]">
          <p className="text-[9px] text-[var(--text-mid)] leading-[1.4] mb-1.5">{task.desc}</p>
          <button type="button" className={qcxBtnPrimary}>
            ▶ Start
          </button>
        </div>
      )}
    </article>
  );
}

// ─── Regular task row (compact) ───────────────────────────────────────────────

function TaskRow({ task, expanded, onExpand, onToggleDone }: QuestCardMiniProps) {
  const c = catOf(task.cat);
  const p = priOf(task.priority);
  const catColor = COLOR_VAR[c.color] ?? 'var(--text-lo)';
  const priColor = COLOR_VAR[p.color] ?? 'var(--text-lo)';

  return (
    <article
      className={cn(
        cardBase,
        task.done && 'opacity-40',
        task.saga && 'border-[oklch(0.74_0.17_85_/_0.4)]',
        expanded && 'border-[oklch(0.66_0.22_295_/_0.4)]',
      )}
      style={{ borderLeftColor: catColor, borderLeftWidth: 2 }}
    >
      {/* Row 1: check · diff · title · priority */}
      <div className="flex items-start gap-1">
        <button
          type="button"
          className={cn(
            'mt-[1px] w-3.5 h-3.5 rounded-full border border-[var(--border)] flex items-center justify-center text-[7px] font-bold transition-all shrink-0',
            task.done && 'bg-[var(--mint)] border-[var(--mint)] text-[oklch(0.1_0_0)]',
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(task.id);
          }}
          aria-label={task.done ? 'Mark undone' : 'Mark done'}
        >
          {task.done ? '✓' : ''}
        </button>

        <span
          className="mt-[1px] text-[7px] font-black w-3.5 h-3.5 rounded-sm flex items-center justify-center shrink-0"
          style={{ background: `${catColor}22`, color: catColor }}
        >
          {task.diff}
        </span>

        <span
          className={cn(
            'flex-1 min-w-0 text-[10px] font-semibold text-[var(--text-hi)] leading-tight cursor-pointer',
            task.done && 'line-through text-[var(--text-lo)]',
          )}
          onClick={onExpand}
        >
          {task.title}
        </span>

        <span
          className="mt-[1px] text-[7px] font-bold shrink-0"
          style={{ color: priColor }}
          title={p.label}
        >
          {p.token}
        </span>
      </div>

      {/* Row 2: cat icon · est · spacer · xp */}
      <div className="flex items-center gap-1 mt-1">
        <span
          className="text-[7px] font-bold px-1 py-0.5 rounded border"
          style={{ color: catColor, borderColor: `${catColor}44`, background: `${catColor}0E` }}
          title={c.label}
        >
          {c.icon}
        </span>
        <span className="text-[7px] text-[var(--text-lo)]">{fmtEst(task.est)}</span>
        <div className="flex-1" />
        <span className="text-[7px] font-bold text-[var(--violet)]">
          +{task.xp}
          <small className="font-normal opacity-60 ml-0.5">xp</small>
        </span>
      </div>

      {/* Row 3: subtask progress (only when present) */}
      {task.subtasks > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <div className="flex-1 h-[2px] bg-[var(--panel2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--violet)] rounded-full transition-all"
              style={{ width: `${(task.subtasksDone / task.subtasks) * 100}%` }}
            />
          </div>
          <span className="text-[7px] text-[var(--text-lo)] shrink-0 tabular-nums">
            {task.subtasksDone}/{task.subtasks}
          </span>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <p className="text-[9px] text-[var(--text-mid)] leading-[1.4] mb-2">{task.desc}</p>
          <div className="flex gap-1.5">
            <button type="button" className={qcxBtnPrimary}>
              ▶ Start
            </button>
            <button type="button" className={qcxBtnGhost}>
              ✎
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const cardBase =
  'bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] p-2 mb-1.5 cursor-grab hover:border-[oklch(0.74_0.17_85_/_0.25)] transition-all duration-150 active:cursor-grabbing';
