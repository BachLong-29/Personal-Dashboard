import { cn } from '@/libs/utils';

import { catOf, fmtEst, priOf, COLOR_VAR, type UITask } from '../../data/mock';
import { diffColors, urgencyColors } from '../shared/styles';

interface TaskAllRowProps {
  task: UITask;
  onToggleDone: (id: string) => void;
  onExpand: () => void;
  isExpanded: boolean;
}

export function TaskAllRow({ task, onToggleDone, onExpand, isExpanded }: TaskAllRowProps) {
  const c = catOf(task.cat);
  const p = priOf(task.priority);
  const catColor = COLOR_VAR[c.color] ?? 'var(--text-lo)';

  return (
    <>
      <div
        className={cn(
          rowBase,
          task.done && 'opacity-45',
          isExpanded && rowExpanded,
        )}
        style={{ borderLeftColor: catColor, borderLeftWidth: 2 }}
        onClick={onExpand}
      >
        {/* Check */}
        <button
          type="button"
          className={cn(checkBtn, task.done && checkBtnDone)}
          onClick={(e) => { e.stopPropagation(); onToggleDone(task.id); }}
          aria-label="Toggle complete"
        >
          {task.done ? '✓' : ''}
        </button>

        {/* Diff */}
        <span className={cn(diffBadge, diffColors[task.diff])}>{task.diff}</span>

        {/* Title */}
        <span className={cn(titleCol, task.done && 'line-through text-[var(--text-lo)]')}>
          {task.title}
        </span>

        {/* Category */}
        <span
          className={catPill}
          style={{ color: catColor, borderColor: `${catColor}44`, background: `${catColor}0E` }}
        >
          {c.icon} {c.label}
        </span>

        {/* Priority */}
        <span
          className="text-[9px] font-bold w-10 text-center shrink-0"
          style={{ color: COLOR_VAR[p.color] ?? 'var(--text-lo)' }}
          title={p.label}
        >
          {p.token}
        </span>

        {/* Deadline */}
        <span className={cn(deadlineCol, urgencyColors[task.deadlineUrgency])}>
          {task.deadline}
        </span>

        {/* Progress */}
        <div className="w-[60px] shrink-0 flex items-center gap-1.5">
          <div className="flex-1 h-[3px] bg-[var(--panel2)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(task.progress || 0) * 100}%`,
                background: catColor,
              }}
            />
          </div>
          <span className="text-[8px] text-[var(--text-lo)] shrink-0 w-6 text-right">
            {Math.round((task.progress || 0) * 100)}%
          </span>
        </div>

        {/* XP */}
        <span className="text-[9px] font-bold text-[var(--violet)] w-12 text-right shrink-0">
          +{task.xp}<span className="text-[7px] opacity-60 ml-0.5">XP</span>
        </span>

        {/* Est */}
        <span className="text-[9px] text-[var(--text-lo)] w-10 text-right shrink-0">
          {fmtEst(task.est)}
        </span>

        {/* Streak */}
        {task.streak > 0 ? (
          <span className="text-[8px] font-bold text-[var(--gold)] w-10 text-right shrink-0">
            ✦{task.streak}d
          </span>
        ) : (
          <span className="w-10 shrink-0" />
        )}

        {/* Subtasks */}
        {task.subtasks > 0 ? (
          <span className="text-[8px] text-[var(--text-lo)] w-8 text-right shrink-0">
            {task.subtasksDone}/{task.subtasks}
          </span>
        ) : (
          <span className="w-8 shrink-0" />
        )}

        {/* Expand caret */}
        <span className="text-[8px] text-[var(--text-lo)] ml-1 shrink-0 transition-transform duration-150" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
          ▶
        </span>
      </div>

      {/* Inline expanded detail */}
      {isExpanded && (
        <RowDetail task={task} catColor={catColor} />
      )}
    </>
  );
}

// ─── Inline expanded row ──────────────────────────────────────────────────────

function RowDetail({ task, catColor }: { task: UITask; catColor: string }) {
  return (
    <div
      className="flex gap-4 px-4 py-3 bg-[oklch(0.66_0.22_295_/_0.04)] border-b border-[var(--border)] border-l-2"
      style={{ borderLeftColor: catColor }}
    >
      {/* Description + note */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[var(--text-mid)] leading-[1.5] mb-2">{task.desc}</p>
        {task.expandedNote && (
          <div className="p-2 bg-[oklch(0.66_0.22_295_/_0.06)] border border-[oklch(0.66_0.22_295_/_0.2)] rounded-[var(--r-sm)]">
            <div className="text-[7px] tracking-[0.12em] text-[var(--violet)] font-bold mb-1">SAGE&apos;S NOTE</div>
            <div className="text-[9px] text-[var(--text-mid)] leading-[1.5]">{task.expandedNote}</div>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1 shrink-0">
        <div className="text-[7px] text-[var(--text-lo)] tracking-[0.1em] uppercase mb-0.5">Tags</div>
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span key={tag} className="text-[8px] text-[var(--text-lo)] bg-[var(--panel2)] border border-[var(--border)] px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 items-start shrink-0">
        <button type="button" className={actionBtnPrimary}>▶ Begin</button>
        <button type="button" className={actionBtnGhost}>✎ Edit</button>
        <button type="button" className={actionBtnGhost}>⤴ Move</button>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const rowBase =
  'flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] cursor-pointer transition-colors hover:bg-[oklch(0.74_0.17_85_/_0.03)] select-none';
const rowExpanded =
  'bg-[oklch(0.66_0.22_295_/_0.04)]';

const checkBtn =
  'w-[16px] h-[16px] rounded-full border border-[var(--border)] flex items-center justify-center text-[8px] font-bold transition-all hover:border-[var(--mint)] shrink-0';
const checkBtnDone =
  'bg-[var(--mint)] border-[var(--mint)] text-[oklch(0.1_0_0)]';

const diffBadge =
  'w-[16px] h-[16px] rounded-sm flex items-center justify-center text-[8px] font-black font-[var(--font-title)] shrink-0';

const titleCol = 'flex-1 min-w-0 text-[11px] font-semibold text-[var(--text-hi)] truncate';

const catPill =
  'text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-[0.06em] font-[var(--font-title)] shrink-0 w-20 overflow-hidden whitespace-nowrap text-ellipsis';

const deadlineCol = 'text-[9px] font-semibold w-24 shrink-0';

const actionBtnBase =
  'text-[8px] font-bold px-2 py-[3px] rounded border font-[var(--font-title)] tracking-[0.06em] transition-all';
const actionBtnPrimary = `${actionBtnBase} bg-[oklch(0.66_0.22_295_/_0.1)] border-[oklch(0.66_0.22_295_/_0.35)] text-[var(--violet)] hover:bg-[oklch(0.66_0.22_295_/_0.2)]`;
const actionBtnGhost = `${actionBtnBase} border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:border-[oklch(0.74_0.17_85_/_0.3)]`;
