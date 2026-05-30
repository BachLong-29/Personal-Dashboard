'use client';

import { cn } from '@/libs/utils';

import { catOf, fmtEst, priOf, COLOR_VAR, type UITask } from '../../data/mock';
import { diffColors, urgencyColors, qcxBtnGhost, qcxBtnPrimary } from './styles';

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
  isOverlay,
  compact,
}: QuestCardProps) {
  const c = catOf(task.cat);
  const p = priOf(task.priority);
  const catColor = COLOR_VAR[c.color] ?? 'var(--text-lo)';

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
      {/* ── Main row ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 w-full cursor-pointer" onClick={!isOverlay ? onExpand : undefined}>
        {/* Left: check + diff */}
        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
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
            title={
              task.isMultiDay
                ? task.loggedToday
                  ? 'Un-log today'
                  : "Log today's session"
                : undefined
            }
          >
            {task.isMultiDay ? (task.loggedToday ? '✓' : '') : task.done ? '✓' : ''}
          </button>
          <div className={cn(diffBadge, diffColors[task.diff])}>{task.diff}</div>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Title + status badge */}
          <div className="flex items-start gap-1.5 mb-1">
            <div
              className={cn(
                titleText,
                task.done && !task.isMultiDay && 'line-through text-[var(--text-lo)]',
                task.cancelled && 'line-through text-[var(--text-lo)]',
              )}
            >
              {task.title}
            </div>

            {task.cancelled ? (
              <span
                className={
                  badge +
                  ' bg-[oklch(0.72_0.18_5_/_0.12)] border-[oklch(0.72_0.18_5_/_0.3)] text-[var(--rose)]'
                }
              >
                RESCHEDULED
              </span>
            ) : task.isMultiDay ? (
              <span
                className={cn(
                  badge + ' transition-colors',
                  task.loggedToday
                    ? 'bg-[oklch(0.76_0.16_205_/_0.15)] border-[oklch(0.76_0.16_205_/_0.4)] text-[var(--cyan)]'
                    : 'bg-[var(--panel)] border-[var(--border)] text-[var(--text-lo)]',
                )}
              >
                {task.loggedToday ? '✓ TODAY' : `${task.totalDays}D`}
              </span>
            ) : (
              <div
                className="text-[9px] font-bold shrink-0"
                style={{ color: COLOR_VAR[p.color] ?? 'var(--text-lo)' }}
              >
                {p.token}
              </div>
            )}
          </div>

          {/* Description */}
          {!compact && task.desc && (
            <div className="text-[9px] text-[var(--text-lo)] leading-[1.4] mb-1 truncate">
              {task.desc}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-[0.06em] font-[var(--font-title)]"
              style={{ color: catColor, borderColor: `${catColor}55`, background: `${catColor}0F` }}
            >
              <span className="mr-0.5">{c.icon}</span>
              {c.label}
            </span>
            <span className="text-[9px] text-[var(--text-lo)]">⏲ {fmtEst(task.est)}</span>
            <span className={cn('text-[9px] font-semibold', urgencyColors[task.deadlineUrgency])}>
              ◷ {task.deadline}
            </span>
            {task.streak > 0 && (
              <span className="text-[9px] text-[var(--gold)] font-bold">✦ {task.streak}d</span>
            )}
            {task.combo > 0 && (
              <span className="text-[9px] text-[var(--violet)] font-bold">×{task.combo}</span>
            )}
          </div>

          {/* Sub-task progress */}
          {task.subtasks > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-[3px] bg-[var(--panel2)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--violet)] rounded-full"
                  style={{ width: `${(task.subtasksDone / task.subtasks) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-[var(--text-lo)] shrink-0">
                {task.subtasksDone}/{task.subtasks}
              </span>
            </div>
          )}

          {/* Tags */}
          {!compact && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
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
        </div>

        {/* Right: rewards + action strip */}
        <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
          {/* Rewards */}
          <div className="text-[9px] font-bold text-[var(--violet)]">
            +{task.xp}
            <span className="text-[7px] ml-0.5 opacity-70">XP</span>
          </div>
          <div className="text-[9px] font-bold text-[var(--gold)]">
            +{task.coins}
            <span className="text-[7px] ml-0.5 opacity-70">◎</span>
          </div>

          {/* Action strip: edit + clone hover-only, chevron always visible */}
          {!isOverlay && (
            <div className="flex items-center gap-0.5 mt-auto">
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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
              {/* Expand chevron */}
              <span className={cn(chevron, expanded && chevronOpen)}>›</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded panel ────────────────────────────────────────────────────── */}
      {expanded && !compact && (
        <ExpandedPanel
          task={task}
          catColor={catColor}
          onToggleDone={onToggleDone}
          onReschedule={onReschedule}
          onCompleteTask={onCompleteTask}
          onEdit={onEdit}
          onClone={onClone}
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
}: {
  task: UITask;
  catColor: string;
  onToggleDone?: (id: string) => void;
  onReschedule?: (task: UITask) => void;
  onCompleteTask?: (id: string) => void;
  onEdit?: (task: UITask) => void;
  onClone?: (task: UITask) => void;
}) {
  const c = catOf(task.cat);
  const p = priOf(task.priority);

  return (
    <div className="w-full mt-2 pt-2.5 border-t border-[var(--border)] pl-[26px]">
      {/* Detail grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Realm', value: `${c.icon} ${c.label}` },
          { label: 'Rank', value: task.diff },
          { label: 'Priority', value: p.label },
          { label: 'Est.', value: fmtEst(task.est) },
          task.isMultiDay
            ? { label: 'Duration', value: `${task.totalDays} days` }
            : { label: 'Deadline', value: task.deadline },
          {
            label: 'Today',
            value: task.isMultiDay ? (task.loggedToday ? '✓ Logged' : '○ Not yet') : '—',
          },
          { label: 'Streak', value: task.streak > 0 ? `${task.streak}d` : '—' },
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
  'flex flex-col gap-0 p-2.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] mb-1.5 cursor-grab hover:border-[oklch(0.74_0.17_85_/_0.3)] hover:bg-[oklch(0.74_0.17_85_/_0.03)] transition-all duration-150 active:cursor-grabbing';
const cardDone = 'opacity-50';
const cardSaga = 'border-[oklch(0.74_0.17_85_/_0.35)] bg-[oklch(0.74_0.17_85_/_0.04)]';
const cardCancelled =
  'opacity-40 border-dashed border-[oklch(0.72_0.18_5_/_0.35)] bg-[oklch(0.72_0.18_5_/_0.03)]';

const checkBtn =
  'w-[18px] h-[18px] rounded-full border border-[var(--border)] flex items-center justify-center text-[9px] font-bold transition-all hover:border-[var(--mint)] shrink-0';
const checkBtnDone = 'bg-[var(--mint)] border-[var(--mint)] text-[oklch(0.1_0_0)]';
const checkBtnLogged = 'bg-[var(--cyan)] border-[var(--cyan)] text-[oklch(0.1_0_0)]';

const diffBadge =
  'w-[16px] h-[16px] rounded-sm flex items-center justify-center text-[8px] font-black font-[var(--font-title)]';

const titleText = 'text-[11px] font-semibold text-[var(--text-hi)] leading-[1.3] flex-1';

const badge =
  'text-[7px] font-bold shrink-0 px-1 py-0.5 rounded border tracking-[0.08em] font-[var(--font-title)] ';

const actionBtn =
  'w-[18px] h-[18px] flex items-center justify-center text-[11px] text-[var(--text-lo)] rounded hover:text-[var(--text-hi)] hover:bg-[var(--panel3)] transition-colors cursor-pointer';

const chevron =
  'text-[10px] text-[var(--text-lo)] transition-transform duration-150 leading-none select-none';
const chevronOpen = 'rotate-90';
