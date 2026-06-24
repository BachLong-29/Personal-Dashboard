'use client';

import { cn } from '@/libs/utils';

import { ProjectBadge } from '@/components/common/ProjectBadge';

import { catOf, fmtEst, COLOR_VAR, type UITask } from '../../data/mock';
import { diffColors, qcxBtnGhost, qcxBtnPrimary } from './styles';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface QuestCardProps {
  task: UITask;
  expanded?: boolean;
  onExpand?: () => void;
  onToggleDone?: (id: string) => void;
  onReschedule?: (task: UITask) => void;
  onCompleteTask?: (id: string) => void;
  onEdit?: (task: UITask) => void;
  onClone?: (task: UITask) => void;
  onMoveToNextDay?: (task: UITask) => void;
  isOverlay?: boolean;
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuestCard({
  task,
  expanded,
  onExpand,
  onToggleDone,
  onReschedule,
  onCompleteTask,
  onEdit,
  onClone,
  onMoveToNextDay,
  isOverlay,
  compact,
}: QuestCardProps) {
  const c = catOf(task.cat);
  const catColor = COLOR_VAR[c.color] ?? 'var(--text-lo)';

  // For habits the title is "${icon} ${name}" — show icon in its own column
  // and strip it from the label to avoid duplication.
  const titleDisplay =
    task.icon && task.title.startsWith(task.icon)
      ? task.title.slice(task.icon.length).trim()
      : task.title;

  return (
    <article
      className={cn(
        cardBase,
        task.done && cardDone,
        task.saga && cardSaga,
        task.cancelled && cardCancelled,
        isOverlay && 'shadow-[0_8px_32px_oklch(0_0_0_/_0.5)] scale-[1.02] cursor-grabbing',
        'group',
      )}
      style={{ borderLeftColor: catColor, borderLeftWidth: 3 }}
    >
      {/* ── Collapsed main row ────────────────────────────────────────────────── */}
      <div
        className="flex items-start gap-1.5 w-full cursor-pointer"
        onClick={!isOverlay ? onExpand : undefined}
      >
        {/* Content: 2 rows */}
        <div className="flex-1 min-w-0">
          {/* Row 1: checkbox + icon + title + status badges */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              className={cn(
                checkBtn,
                !task.isMultiDay && task.done && checkBtnDone,
                task.isMultiDay && task.loggedToday && checkBtnLogged,
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleDone?.(task.id);
              }}
              aria-label={task.isMultiDay ? 'Log today' : 'Toggle complete'}
            >
              {task.isMultiDay ? (task.loggedToday ? '✓' : '') : task.done ? '✓' : ''}
            </button>

            {task.icon && (
              <span className="text-[13px] leading-none shrink-0 select-none">{task.icon}</span>
            )}

            <span
              className={cn(
                titleText,
                task.done && !task.isMultiDay && 'line-through text-[var(--text-lo)]',
                task.cancelled && 'line-through text-[var(--text-lo)]',
              )}
            >
              {titleDisplay}
            </span>

            {/* Inline status badge */}
            {task.cancelled ? (
              <span
                className={cn(inlineBadge, 'border-[oklch(0.72_0.18_5_/_0.3)] text-[var(--rose)]')}
              >
                MOVED
              </span>
            ) : task.isMultiDay ? (
              <span
                className={cn(
                  inlineBadge,
                  'transition-colors',
                  task.loggedToday
                    ? 'border-[oklch(0.76_0.16_205_/_0.4)] text-[var(--cyan)]'
                    : 'border-[var(--border)] text-[var(--text-lo)]',
                )}
              >
                {task.loggedToday ? '✓' : `${task.totalDays}D`}
              </span>
            ) : null}
          </div>

          {/* Row 2: rank + overdue + note */}
          <div className="flex items-center gap-1.5 mt-[3px] pl-[26px] min-w-0">
            <span className="text-[7px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] font-[var(--font-title)] shrink-0">
              Rank
            </span>
            <div className={cn(diffBadge, diffColors[task.diff] ?? diffBadgeFallback)}>
              {task.diff || '–'}
            </div>

            {task.overdueLevel &&
              task.overdueLevel !== 'failed' &&
              !task.done &&
              !task.cancelled &&
              (task.overdueLevel === 'critical' ? (
                <span className="text-[7px] font-bold px-1 py-px rounded border tracking-[0.06em] font-[var(--font-title)] bg-[oklch(0.72_0.18_5_/_0.12)] border-[oklch(0.72_0.18_5_/_0.3)] text-[var(--rose)] animate-pulse">
                  !
                </span>
              ) : (
                <span className="text-[7px] font-bold px-1 py-px rounded border tracking-[0.06em] font-[var(--font-title)] bg-[oklch(0.74_0.17_85_/_0.1)] border-[oklch(0.74_0.17_85_/_0.3)] text-[var(--gold)]">
                  ⚠
                </span>
              ))}

            {task.desc && !task.done && !task.cancelled && (
              <span className="text-[9px] text-[var(--text-lo)] truncate">{task.desc}</span>
            )}
          </div>
        </div>

        {/* Right: hover actions + chevron */}
        {!isOverlay && (
          <div className="flex items-center gap-0.5 shrink-0 self-center ml-auto">
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {onMoveToNextDay && !task.done && !task.cancelled && task.source !== 'habit' && (
                <button
                  type="button"
                  title="Move to next day"
                  className={actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToNextDay(task);
                  }}
                >
                  →
                </button>
              )}
              {onClone && task.source === 'task' && (
                <button
                  type="button"
                  title="Clone task"
                  className={actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClone(task);
                  }}
                >
                  ⧉
                </button>
              )}
              {onEdit && (task.source === 'task' || task.source === 'habit') && (
                <button
                  type="button"
                  title={task.source === 'habit' ? 'Go to Habits' : 'Edit'}
                  className={actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  {task.source === 'habit' ? '↗' : '✎'}
                </button>
              )}
            </div>
            <span className={cn(chevron, expanded && chevronOpen)}>›</span>
          </div>
        )}
      </div>

      {/* ── Expanded detail panel ─────────────────────────────────────────────── */}
      {expanded && !compact && (
        <ExpandedPanel
          task={task}
          catColor={catColor}
          onToggleDone={onToggleDone}
          onReschedule={onReschedule}
          onCompleteTask={onCompleteTask}
          onEdit={onEdit}
          onClone={onClone}
          onMoveToNextDay={onMoveToNextDay}
        />
      )}
    </article>
  );
}

// ─── Expanded panel ───────────────────────────────────────────────────────────

function ExpandedPanel({
  task,
  catColor,
  onToggleDone,
  onReschedule,
  onCompleteTask,
  onEdit,
  onClone,
  onMoveToNextDay,
}: {
  task: UITask;
  catColor: string;
  onToggleDone?: (id: string) => void;
  onReschedule?: (task: UITask) => void;
  onCompleteTask?: (id: string) => void;
  onEdit?: (task: UITask) => void;
  onClone?: (task: UITask) => void;
  onMoveToNextDay?: (task: UITask) => void;
}) {
  return (
    <div className="w-full mt-2 pt-2.5 border-t border-[var(--border)] pl-[26px]">
      {/* Detail grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Rank', value: task.diff },
          { label: 'Est.', value: fmtEst(task.est) },
          task.isMultiDay
            ? { label: 'Duration', value: `${task.totalDays} days` }
            : { label: 'Deadline', value: task.deadline },
          { label: 'Reward', value: `${task.xp} XP · ${task.coins} ◎` },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-[2px]">
            <div className="text-[8px] text-[var(--text-lo)] tracking-[0.1em] uppercase">
              {label}
            </div>
            <div className="text-[10px] text-[var(--text-hi)] font-semibold">{value}</div>
          </div>
        ))}
      </div>

      {/* Project badge */}
      {task.projectName && (
        <div className="mb-2">
          <ProjectBadge name={task.projectName} icon={task.projectIcon} color={task.projectColor} />
        </div>
      )}

      {/* Sage's note */}
      {task.expandedNote && (
        <div className="mb-3 p-2 bg-[oklch(0.66_0.22_295_/_0.06)] border border-[oklch(0.66_0.22_295_/_0.2)] rounded-[var(--r-sm)]">
          <div className="text-[8px] tracking-[0.12em] text-[var(--violet)] font-bold mb-1">
            SAGE&apos;S NOTE
          </div>
          <div className="text-[10px] text-[var(--text-mid)] leading-[1.5]">
            {task.expandedNote}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-[var(--text-lo)]">Progress</span>
          <span className="text-[9px] text-[var(--text-mid)]">
            {Math.round((task.progress || 0) * 100)}%
          </span>
        </div>
        <div className="h-[4px] bg-[var(--panel2)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(task.progress || 0) * 100}%`,
              background: `linear-gradient(to right, ${catColor}, var(--violet))`,
            }}
          />
        </div>
      </div>

      {/* Sub-task progress */}
      {task.subtasks > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex-1 h-[3px] bg-[var(--panel2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--violet)] rounded-full"
              style={{ width: `${(task.subtasksDone / task.subtasks) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-[var(--text-lo)] shrink-0">
            {task.subtasksDone}/{task.subtasks} subtasks
          </span>
        </div>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[8px] text-[var(--text-lo)] bg-[var(--panel2)] border border-[var(--border)] px-1 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      {!task.cancelled && (
        <div className="flex gap-2 flex-wrap">
          {task.isMultiDay ? (
            <>
              <button
                type="button"
                className={task.loggedToday ? qcxBtnGhost : qcxBtnPrimary}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDone?.(task.id);
                }}
              >
                {task.loggedToday ? '✓ Today logged' : '◉ Log today'}
              </button>
              {task.status !== 'done' && onCompleteTask && (
                <button
                  type="button"
                  className={qcxBtnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompleteTask(task.id);
                  }}
                >
                  ✦ Mark Complete
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  className={qcxBtnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  ✎ Edit
                </button>
              )}
              {onClone && (
                <button
                  type="button"
                  className={qcxBtnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClone(task);
                  }}
                >
                  ⧉ Clone
                </button>
              )}
            </>
          ) : (
            <>
              {task.source === 'task' && onEdit && (
                <button
                  type="button"
                  className={qcxBtnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  ✎ Edit
                </button>
              )}
              {task.source === 'task' && onClone && (
                <button
                  type="button"
                  className={qcxBtnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClone(task);
                  }}
                >
                  ⧉ Clone
                </button>
              )}
              {task.source === 'habit' && onEdit && (
                <button
                  type="button"
                  className={qcxBtnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  ↗ Habits tab
                </button>
              )}
              {task.source === 'habit' && onReschedule && (
                <button
                  type="button"
                  className={qcxBtnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReschedule(task);
                  }}
                >
                  ⏱ Reschedule
                </button>
              )}
              {onMoveToNextDay && !task.done && task.source !== 'habit' && (
                <button
                  type="button"
                  className={qcxBtnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToNextDay(task);
                  }}
                >
                  → Next day
                </button>
              )}
            </>
          )}
        </div>
      )}

      {task.cancelled && (
        <p className="text-[8px] text-[var(--rose)] opacity-70 italic">
          Rescheduled — original slot cancelled
        </p>
      )}
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const cardBase =
  'flex flex-col gap-0 px-2.5 py-2 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] mb-1.5 cursor-grab hover:border-[oklch(0.74_0.17_85_/_0.3)] hover:bg-[oklch(0.74_0.17_85_/_0.03)] transition-all duration-150 active:cursor-grabbing';
const cardDone = 'opacity-50';
const cardSaga = 'border-[oklch(0.74_0.17_85_/_0.35)] bg-[oklch(0.74_0.17_85_/_0.04)]';
const cardCancelled =
  'opacity-40 border-dashed border-[oklch(0.72_0.18_5_/_0.35)] bg-[oklch(0.72_0.18_5_/_0.03)]';

const checkBtn =
  'w-[18px] h-[18px] rounded-full border border-[var(--border)] flex items-center justify-center text-[9px] font-bold transition-all hover:border-[var(--mint)] shrink-0';
const checkBtnDone = 'bg-[var(--mint)] border-[var(--mint)] text-[oklch(0.1_0_0)]';
const checkBtnLogged = 'bg-[var(--cyan)] border-[var(--cyan)] text-[oklch(0.1_0_0)]';

const diffBadge =
  'min-w-[17px] h-[17px] px-1 rounded-sm flex items-center justify-center text-[9px] font-black font-[var(--font-title)] border border-[var(--border)] shrink-0';
const diffBadgeFallback = 'bg-[var(--panel3)] text-[var(--text-mid)]';

const titleText = 'text-[11px] font-semibold text-[var(--text-hi)] leading-[1.3] truncate flex-1';

const inlineBadge =
  'text-[7px] font-bold shrink-0 px-1 py-px rounded border tracking-[0.08em] font-[var(--font-title)]';

const actionBtn =
  'w-[18px] h-[18px] flex items-center justify-center text-[11px] text-[var(--text-lo)] rounded hover:text-[var(--text-hi)] hover:bg-[var(--panel3)] transition-colors cursor-pointer';

const chevron =
  'text-[10px] text-[var(--text-lo)] transition-transform duration-150 leading-none select-none';
const chevronOpen = 'rotate-90';
