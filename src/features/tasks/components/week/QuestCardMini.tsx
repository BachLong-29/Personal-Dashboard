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

export function QuestCardMini({ task, expanded, onExpand, onToggleDone }: QuestCardMiniProps) {
  const c = catOf(task.cat);
  const p = priOf(task.priority);
  const catColor = COLOR_VAR[c.color] ?? 'var(--text-lo)';

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
      {/* Top row: check + diff + priority */}
      <div className="flex items-center gap-1.5 mb-1">
        <button
          type="button"
          className={cn(
            'w-3.5 h-3.5 rounded-full border border-[var(--border)] flex items-center justify-center text-[7px] font-bold transition-all shrink-0',
            task.done && 'bg-[var(--mint)] border-[var(--mint)] text-[oklch(0.1_0_0)]',
          )}
          onClick={(e) => { e.stopPropagation(); onToggleDone(task.id); }}
        >
          {task.done ? '✓' : ''}
        </button>
        <span
          className="text-[7px] font-black w-3.5 h-3.5 rounded-sm flex items-center justify-center font-[var(--font-title)]"
          style={{ background: `${catColor}22`, color: catColor }}
        >
          {task.diff}
        </span>
        <span
          className="text-[8px] font-bold"
          style={{ color: COLOR_VAR[p.color] ?? 'var(--text-lo)' }}
          title={p.label}
        >
          {p.token}
        </span>
      </div>

      {/* Title */}
      <div
        className={cn(
          'text-[10px] font-semibold text-[var(--text-hi)] leading-[1.3] mb-1 cursor-pointer',
          task.done && 'line-through text-[var(--text-lo)]',
        )}
        onClick={onExpand}
      >
        {task.title}
      </div>

      {/* Rewards */}
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] font-bold text-[var(--violet)]">
          +{task.xp}<small className="font-normal opacity-60 ml-0.5">XP</small>
        </span>
        <span className="text-[8px] font-bold text-[var(--gold)]">
          +{task.coins}<small className="font-normal opacity-60 ml-0.5">◎</small>
        </span>
      </div>

      {/* Sub-task progress */}
      {task.subtasks > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <div className="flex-1 h-[2px] bg-[var(--panel2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--violet)] rounded-full"
              style={{ width: `${(task.subtasksDone / task.subtasks) * 100}%` }}
            />
          </div>
          <span className="text-[7px] text-[var(--text-lo)] shrink-0">
            {task.subtasksDone}/{task.subtasks}
          </span>
        </div>
      )}

      {/* Footer: category + est */}
      <div className="flex items-center gap-1 mt-1">
        <span
          className="text-[7px] font-bold px-1 py-0.5 rounded border tracking-[0.06em]"
          style={{ color: catColor, borderColor: `${catColor}44`, background: `${catColor}0E` }}
        >
          {c.icon} {c.label}
        </span>
        <span className="text-[7px] text-[var(--text-lo)]">{fmtEst(task.est)}</span>
      </div>

      {/* Expanded inline detail */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <p className="text-[9px] text-[var(--text-mid)] leading-[1.4] mb-2">{task.desc}</p>
          <div className="flex gap-1.5">
            <button type="button" className={qcxBtnPrimary}>▶ Start</button>
            <button type="button" className={qcxBtnGhost}>✎</button>
          </div>
        </div>
      )}
    </article>
  );
}

const cardBase =
  'bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] p-2 mb-1.5 cursor-grab hover:border-[oklch(0.74_0.17_85_/_0.25)] transition-all duration-150 active:cursor-grabbing';
