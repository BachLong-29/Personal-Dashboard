'use client';

import { Icon } from '@/components/common/Icon';
import { cn } from '@/libs/utils';

import { ALL_HABIT_DAYS, HABIT_COLORS, HABIT_DAY_SHORT } from '../constants';
import type { Habit, HabitColor, HabitDay } from '../types';

interface HabitCardProps {
  habit: Habit;
  tagLabel?: string;
  todayDone?: boolean;
  isToday?: boolean;
  expanded?: boolean;
  activateLabel?: string;
  inactivateLabel?: string;
  onToggle?: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onToggleActive: (habit: Habit) => void;
}

function buildScheduleText(habit: Habit): string {
  if (!habit.schedule?.length) return '–';
  return habit.schedule
    .map((e) => {
      const days = [...e.days]
        .sort(
          (a, b) => ALL_HABIT_DAYS.indexOf(a as HabitDay) - ALL_HABIT_DAYS.indexOf(b as HabitDay),
        )
        .map((d) => HABIT_DAY_SHORT[d as HabitDay] ?? d)
        .join('·');
      return `${days} ${e.time}`;
    })
    .join(' / ');
}

export function HabitCard({
  habit,
  tagLabel,
  todayDone,
  isToday,
  expanded,
  activateLabel = 'Activate',
  inactivateLabel = 'Inactivate',
  onToggle,
  onEdit,
  onDelete,
  onToggleActive,
}: HabitCardProps) {
  const colorVal = HABIT_COLORS[habit.color as HabitColor]?.value ?? HABIT_COLORS.gold.value;
  const colorLabel = HABIT_COLORS[habit.color as HabitColor]?.label ?? habit.color;
  const displayTag = tagLabel ?? habit.tagId;
  const scheduleText = buildScheduleText(habit);

  return (
    <div className={cn(card, !habit.active && cardInactive)} style={{ borderLeftColor: colorVal }}>
      {/* ── Main row ── */}
      <div className={topRow}>
        <div className={iconWrap} style={{ background: `${colorVal}20`, color: colorVal }}>
          <Icon icon={habit.icon} />
        </div>

        <div className={info}>
          <div className={nameRow}>
            <span className={nameText}>{habit.name}</span>
            {isToday && (
              <span
                className={cn(statusDot, todayDone ? statusDone : statusPending)}
                title={todayDone ? 'Done today' : 'Pending today'}
              />
            )}
          </div>
          <div className={metaRow}>
            <span className={tagPill} style={{ color: colorVal, borderColor: `${colorVal}40` }}>
              {displayTag}
            </span>
            <span className={scheduleDisplay} title={scheduleText}>
              {scheduleText}
            </span>
            {habit.duration && <span className={durationPill}>⏱ {habit.duration}m</span>}
            {habit.note && <span className={noteText}>{habit.note}</span>}
          </div>
        </div>

        <div className={actions}>
          <button
            type="button"
            className={cn(actionBtn, habit.active ? inactivateBtn : activateBtn)}
            title={habit.active ? inactivateLabel : activateLabel}
            aria-label={habit.active ? inactivateLabel : activateLabel}
            onClick={() => onToggleActive(habit)}
          >
            {habit.active ? '⏸' : '▶'}
          </button>
          <button type="button" className={actionBtn} title="Edit" onClick={() => onEdit(habit)}>
            ✎
          </button>
          <button
            type="button"
            className={cn(actionBtn, deleteBtn)}
            title="Delete"
            onClick={() => onDelete(habit.id)}
          >
            ✕
          </button>
          <button
            type="button"
            className={cn(actionBtn, expanded && toggleBtnActive)}
            onClick={onToggle}
            title={expanded ? 'Collapse' : 'View details'}
          >
            <span className={cn(chevron, expanded && chevronOpen)}>›</span>
          </button>
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div className={detailPanel} style={{ borderTopColor: `${colorVal}28` }}>
          {/* Schedule entries */}
          <div className={detailBlock}>
            <span className={detailLbl}>Schedule</span>
            <div className="flex flex-col gap-[6px]">
              {habit.schedule.map((entry, i) => (
                <div key={i} className={schedRow}>
                  <div className={dayPillGroup}>
                    {ALL_HABIT_DAYS.map((d) => {
                      const on = entry.days.includes(d);
                      return (
                        <span
                          key={d}
                          className={cn(dayPill, on && dayPillOn)}
                          style={
                            on
                              ? {
                                  background: `${colorVal}20`,
                                  color: colorVal,
                                  borderColor: `${colorVal}50`,
                                }
                              : {}
                          }
                        >
                          {HABIT_DAY_SHORT[d]}
                        </span>
                      );
                    })}
                  </div>
                  <span className={timeChip}>⏰ {entry.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid of scalar fields */}
          <div className={detailGrid}>
            <div className={detailCell}>
              <span className={detailLbl}>Category</span>
              <span className={detailVal}>{displayTag}</span>
            </div>
            <div className={detailCell}>
              <span className={detailLbl}>Color</span>
              <span className={detailVal} style={{ color: colorVal }}>
                ⬤ {colorLabel}
              </span>
            </div>
            {habit.duration != null && (
              <div className={detailCell}>
                <span className={detailLbl}>Duration</span>
                <span className={detailVal}>{habit.duration} min</span>
              </div>
            )}
            <div className={detailCell}>
              <span className={detailLbl}>Status</span>
              <span className={cn(detailVal, habit.active ? activeYes : activeNo)}>
                {habit.active ? '● Active' : '○ Inactive'}
              </span>
            </div>
          </div>

          {habit.note && (
            <div className={noteBlock}>
              <span className={detailLbl}>Note</span>
              <p className={noteBody}>{habit.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Layout ── */
const card =
  'flex flex-col rounded-[var(--r-sm)] bg-[var(--panel2)] border border-[var(--border)] border-l-[3px] transition-all duration-200 hover:border-[var(--border-hi)] group';
const cardInactive = 'opacity-40 grayscale-[0.6]';
const topRow = 'flex items-center gap-2.5 px-3 py-2.5';

/* ── Icon ── */
const iconWrap =
  'w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center text-[16px] shrink-0';

/* ── Info ── */
const info = 'flex-1 min-w-0';
const nameRow = 'flex items-center gap-1.5';
const nameText = 'text-[12px] font-bold text-[var(--text-hi)] truncate font-[var(--font-body)]';

const metaRow = 'flex items-center gap-1.5 mt-[3px] flex-wrap';
const tagPill =
  'text-[9px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] border rounded-[3px] px-[5px] py-[1px] shrink-0';
const scheduleDisplay = 'text-[9px] text-[var(--text-lo)] tracking-[0.04em] truncate max-w-[180px]';
const durationPill = 'text-[9px] text-[var(--text-lo)] shrink-0';
const noteText = 'text-[9px] text-[var(--text-lo)] truncate max-w-[100px]';

/* ── Status dot ── */
const statusDot = 'w-[6px] h-[6px] rounded-full shrink-0';
const statusDone = 'bg-[var(--mint)] shadow-[0_0_4px_var(--mint)]';
const statusPending = 'bg-[var(--text-lo)]';

/* ── Toggle chevron ── */
const toggleBtnActive = 'text-[var(--violet)] bg-[var(--panel3)] border-[var(--border)]';
const chevron = 'inline-block transition-transform duration-200 leading-none select-none';
const chevronOpen = 'rotate-90';

/* ── Action buttons ── */
const actions = 'flex gap-1 shrink-0';
const actionBtn =
  'w-6 h-6 rounded-[var(--r-sm)] flex items-center justify-center text-[11px] text-[var(--text-mid)] bg-[var(--panel3)] border border-[var(--border)] cursor-pointer hover:text-[var(--text-hi)] hover:border-[var(--border-hi)] transition-all';
const deleteBtn = 'hover:text-[var(--rose)] hover:border-[var(--rose)]';
const inactivateBtn = 'hover:text-[var(--warning)] hover:border-[var(--warning)]';
const activateBtn =
  'text-[var(--mint)] border-[oklch(0.76_0.14_162_/_0.4)] hover:text-[var(--mint)] hover:border-[var(--mint)]';

/* ── Detail panel ── */
const detailPanel = 'border-t px-3 pt-2.5 pb-3 flex flex-col gap-2.5';

const detailBlock = 'flex flex-col gap-1.5';
const detailLbl =
  'text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--text-lo)] font-[var(--font-title)]';

const schedRow = 'flex items-center gap-2';
const dayPillGroup = 'flex gap-[3px]';
const dayPill =
  'text-[9px] font-bold px-[5px] py-[2px] rounded-[3px] border border-[var(--border)] text-[var(--text-lo)] bg-[var(--panel3)] font-[var(--font-title)] tracking-[0.04em]';
const dayPillOn = '';
const timeChip = 'text-[10px] text-[var(--text-mid)] font-[var(--font-title)] tracking-[0.04em]';

const detailGrid = 'grid grid-cols-2 gap-x-4 gap-y-1.5';
const detailCell = 'flex flex-col gap-[2px]';
const detailVal = 'text-[10px] text-[var(--text-hi)] font-bold';

const noteBlock = 'flex flex-col gap-1';
const noteBody = 'text-[10px] text-[var(--text-mid)] leading-[1.6] m-0';

const activeYes = 'text-[var(--mint)]';
const activeNo = 'text-[var(--text-lo)]';
