'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

import { ProjectBadge } from '@/components/common/ProjectBadge';

import { catOf, fmtEst, priOf, COLOR_VAR, type UITask } from '../../data/mock';
import { diffColors, urgencyColors } from '../shared/styles';

// ─── Column key type ──────────────────────────────────────────────────────────

export type ColKey =
  | 'status'
  | 'category'
  | 'priority'
  | 'deadline'
  | 'progress'
  | 'xp'
  | 'est'
  | 'streak'
  | 'subtasks';

// ─── Status display ───────────────────────────────────────────────────────────

export const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  todo: { label: 'To Do', color: 'var(--text-lo)', bg: 'oklch(1 0 0 / 0.04)' },
  in_progress: { label: 'In Progress', color: 'var(--cyan)', bg: 'oklch(0.76 0.16 205 / 0.12)' },
  pending: { label: 'Pending', color: 'var(--gold)', bg: 'oklch(0.74 0.17 85 / 0.12)' },
  waiting: { label: 'Waiting', color: 'var(--amber)', bg: 'oklch(0.76 0.16 55 / 0.12)' },
  done: { label: 'Done', color: 'var(--mint)', bg: 'oklch(0.76 0.14 162 / 0.12)' },
};

function StatusBadge({ status }: { status?: string }) {
  const t = useTranslations('tasks');
  if (!status) return <span className="w-20 shrink-0" />;
  const labels: Record<string, string> = {
    todo: t('taskAllView.status.todo'),
    in_progress: t('taskAllView.status.inProgress'),
    pending: t('taskAllView.status.pending'),
    waiting: t('taskAllView.status.waiting'),
    done: t('taskAllView.status.done'),
  };
  const meta = STATUS_META[status]
    ? { ...STATUS_META[status], label: labels[status] ?? status }
    : { label: status, color: 'var(--text-lo)', bg: 'transparent' };
  return (
    <span
      className="text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-[0.06em] font-[var(--font-title)] shrink-0 w-20 overflow-hidden whitespace-nowrap text-ellipsis"
      style={{ color: meta.color, borderColor: `${meta.color}55`, background: meta.bg }}
    >
      {meta.label}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskAllRowProps {
  task: UITask;
  onExpand: () => void;
  isExpanded: boolean;
  onEdit?: (task: UITask) => void;
  onDelete?: (task: UITask) => void;
  visibleCols: Set<ColKey>;
  catLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskAllRow({
  task,
  onExpand,
  isExpanded,
  onEdit,
  onDelete,
  visibleCols,
  catLabel,
}: TaskAllRowProps) {
  const t = useTranslations('tasks');
  const c = catOf(task.cat);
  const p = priOf(task.priority);
  const catColor = COLOR_VAR[task.color ?? c.color] ?? 'var(--text-lo)';
  const statusLabels: Record<string, string> = {
    todo: t('taskAllView.status.todo'),
    in_progress: t('taskAllView.status.inProgress'),
    pending: t('taskAllView.status.pending'),
    waiting: t('taskAllView.status.waiting'),
    done: t('taskAllView.status.done'),
  };
  const statusMeta = task.status
    ? {
        ...(STATUS_META[task.status] ?? {
          label: task.status,
          color: 'var(--text-lo)',
          bg: 'transparent',
        }),
        label: statusLabels[task.status] ?? task.status,
      }
    : undefined;

  return (
    <>
      <div
        className={cn(rowBase, isExpanded && rowExpanded)}
        style={{ borderLeftColor: catColor, borderLeftWidth: 2 }}
        onClick={onExpand}
      >
        {/* Diff */}
        <span className={cn(diffBadge, diffColors[task.diff])}>{task.diff}</span>

        {/* Title — flex-1 on mobile, fixed 140px on sm, flex-1 on md+ */}
        <div className={titleWrapper}>
          <span className={titleText}>{task.title}</span>
          {/* Mobile subtitle: status · deadline */}
          <div className="flex items-center gap-1.5 mt-0.5 sm:hidden">
            {statusMeta && (
              <span
                className="text-[7px] font-bold font-[var(--font-title)]"
                style={{ color: statusMeta.color }}
              >
                {statusMeta.label}
              </span>
            )}
            {task.deadline && task.deadline !== '–' && (
              <>
                <span className="text-[var(--text-lo)] text-[7px]">·</span>
                <span className={cn('text-[7px] font-medium', urgencyColors[task.deadlineUrgency])}>
                  {task.deadline}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Project badge — desktop only */}
        {task.projectName && (
          <span className="hidden sm:block">
            <ProjectBadge
              name={task.projectName}
              icon={task.projectIcon}
              color={task.projectColor}
            />
          </span>
        )}

        {/* Desktop-only columns */}
        {visibleCols.has('status') && (
          <span className="hidden sm:block">
            <StatusBadge status={task.status} />
          </span>
        )}

        {visibleCols.has('category') && (
          <span
            className={cn(catPill, 'hidden sm:block')}
            style={{ color: catColor, borderColor: `${catColor}44`, background: `${catColor}0E` }}
          >
            {c.icon} {catLabel ?? c.label}
          </span>
        )}

        {visibleCols.has('priority') && (
          <span
            className="hidden sm:block text-[9px] font-bold w-10 text-center shrink-0"
            style={{ color: COLOR_VAR[p.color] ?? 'var(--text-lo)' }}
            title={p.label}
          >
            {p.token}
          </span>
        )}

        {visibleCols.has('deadline') && (
          <span className={cn(deadlineCol, urgencyColors[task.deadlineUrgency], 'hidden sm:block')}>
            {task.deadline}
          </span>
        )}

        {visibleCols.has('progress') && (
          <div className="hidden sm:flex w-[60px] shrink-0 items-center gap-1.5">
            <div className="flex-1 h-[3px] bg-[var(--panel2)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(task.progress || 0) * 100}%`, background: catColor }}
              />
            </div>
            <span className="text-[8px] text-[var(--text-lo)] shrink-0 w-6 text-right">
              {Math.round((task.progress || 0) * 100)}%
            </span>
          </div>
        )}

        {visibleCols.has('xp') && (
          <span className="hidden sm:block text-[9px] font-bold text-[var(--violet)] w-12 text-right shrink-0">
            +{task.xp}
            <span className="text-[7px] opacity-60 ml-0.5">XP</span>
          </span>
        )}

        {visibleCols.has('est') && (
          <span className="hidden sm:block text-[9px] text-[var(--text-lo)] w-10 text-right shrink-0">
            {fmtEst(task.est)}
          </span>
        )}

        {visibleCols.has('streak') &&
          (task.streak > 0 ? (
            <span className="hidden sm:block text-[8px] font-bold text-[var(--gold)] w-10 text-right shrink-0">
              ✦{task.streak}d
            </span>
          ) : (
            <span className="hidden sm:block w-10 shrink-0" />
          ))}

        {visibleCols.has('subtasks') &&
          (task.subtasks > 0 ? (
            <span className="hidden sm:block text-[8px] text-[var(--text-lo)] w-8 text-right shrink-0">
              {task.subtasksDone}/{task.subtasks}
            </span>
          ) : (
            <span className="hidden sm:block w-8 shrink-0" />
          ))}

        {/* Expand caret */}
        <span
          className="text-[8px] text-[var(--text-lo)] ml-auto sm:ml-1 shrink-0 transition-transform duration-150"
          style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}
        >
          ▶
        </span>
      </div>

      {isExpanded && (
        <RowDetail
          task={task}
          catColor={catColor}
          catLabel={catLabel}
          statusMeta={statusMeta}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

// ─── Inline expanded row ──────────────────────────────────────────────────────

function RowDetail({
  task,
  catColor,
  catLabel,
  statusMeta,
  onEdit,
  onDelete,
}: {
  task: UITask;
  catColor: string;
  catLabel?: string;
  statusMeta?: { label: string; color: string; bg: string };
  onEdit?: (task: UITask) => void;
  onDelete?: (task: UITask) => void;
}) {
  const c = catOf(task.cat);
  const t = useTranslations('tasks');
  return (
    <div
      className="flex flex-col gap-2 px-3 sm:px-4 py-3 bg-[oklch(0.66_0.22_295_/_0.04)] border-b border-[var(--border)] border-l-2"
      style={{ borderLeftColor: catColor }}
    >
      {/* Mobile-only column data (hidden on sm+) */}
      <div className="sm:hidden flex flex-wrap gap-x-3 gap-y-1.5">
        {statusMeta && (
          <span
            className="text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-[0.06em] font-[var(--font-title)]"
            style={{
              color: statusMeta.color,
              borderColor: `${statusMeta.color}55`,
              background: statusMeta.bg,
            }}
          >
            {statusMeta.label}
          </span>
        )}
        {(catLabel ?? c.label) && (
          <span
            className="text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-[0.06em] font-[var(--font-title)]"
            style={{
              color: catColor,
              borderColor: `${catColor}44`,
              background: `${catColor}0E`,
            }}
          >
            {c.icon} {catLabel ?? c.label}
          </span>
        )}
        <span className="text-[8px] font-bold text-[var(--violet)]">+{task.xp} XP</span>
        <span className="text-[8px] text-[var(--text-lo)]">⏱ {fmtEst(task.est)}</span>
        {(task.progress || 0) > 0 && (
          <span className="text-[8px] text-[var(--text-lo)]">
            {t('taskAllView.table.progressDone', {
              percent: Math.round((task.progress || 0) * 100),
            })}
          </span>
        )}
      </div>

      {/* Description + action buttons */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[var(--text-mid)] leading-[1.5] mb-2">{task.desc}</p>
          {task.expandedNote && (
            <div className="p-2 bg-[oklch(0.66_0.22_295_/_0.06)] border border-[oklch(0.66_0.22_295_/_0.2)] rounded-[var(--r-sm)]">
              <div className="text-[7px] tracking-[0.12em] text-[var(--violet)] font-bold mb-1">
                {t('taskAllView.table.note')}
              </div>
              <div className="text-[9px] text-[var(--text-mid)] leading-[1.5]">
                {task.expandedNote}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 items-start shrink-0">
          {onEdit && (
            <button
              type="button"
              className={actionBtnPrimary}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              ✎ {t('taskAllView.table.edit')}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={actionBtnDanger}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
            >
              ✕ {t('taskAllView.table.delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

// Mobile: no min-w-max (fits viewport). sm+: min-w-max (enables horizontal scroll).
const rowBase =
  'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 border-b border-[var(--border)] cursor-pointer transition-colors hover:bg-[oklch(0.74_0.17_85_/_0.03)] select-none sm:min-w-max';
const rowExpanded = 'bg-[oklch(0.66_0.22_295_/_0.04)]';

const diffBadge =
  'w-[16px] h-[16px] rounded-sm flex items-center justify-center text-[8px] font-black font-[var(--font-title)] shrink-0';

// Mobile: flex-1 fills remaining space. sm: fixed 140px. md+: flex-1 again.
const titleWrapper =
  'flex-1 min-w-0 sm:w-[140px] sm:shrink-0 sm:flex-none md:flex-1 md:w-auto md:min-w-0';
const titleText = 'block text-[11px] font-semibold text-[var(--text-hi)] truncate';

const catPill =
  'text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-[0.06em] font-[var(--font-title)] shrink-0 w-20 overflow-hidden whitespace-nowrap text-ellipsis';

const deadlineCol = 'text-[9px] font-semibold w-24 shrink-0';

const actionBtnBase =
  'text-[8px] font-bold px-2 py-[3px] rounded border font-[var(--font-title)] tracking-[0.06em] transition-all cursor-pointer';
const actionBtnPrimary = `${actionBtnBase} bg-[oklch(0.66_0.22_295_/_0.1)] border-[oklch(0.66_0.22_295_/_0.35)] text-[var(--violet)] hover:bg-[oklch(0.66_0.22_295_/_0.2)]`;
const actionBtnDanger = `${actionBtnBase} border-[oklch(0.72_0.18_5_/_0.3)] text-[var(--rose)] hover:bg-[oklch(0.72_0.18_5_/_0.1)] hover:border-[oklch(0.72_0.18_5_/_0.5)]`;
