'use client';

import { cn } from '@/libs/utils';

import { ALL_HABIT_DAYS, HABIT_DAY_SHORT, HABIT_COLORS } from '../constants';
import type { Habit, HabitColor, HabitDay } from '../types';

interface HabitCardProps {
  habit: Habit;
  tagLabel?: string;
  todayDone?: boolean;
  isToday?: boolean;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

/** Build compact schedule text like "Mo·Tu·We·Fr 19:00 / Th 20:00" */
function buildScheduleText(habit: Habit): string {
  if (!habit.schedule?.length) return '–';
  return habit.schedule
    .map((e) => {
      const days = [...e.days]
        .sort((a, b) => ALL_HABIT_DAYS.indexOf(a as HabitDay) - ALL_HABIT_DAYS.indexOf(b as HabitDay))
        .map((d) => HABIT_DAY_SHORT[d as HabitDay] ?? d)
        .join('·');
      return `${days} ${e.time}`;
    })
    .join('  /  ');
}

export function HabitCard({ habit, tagLabel, todayDone, isToday, onEdit, onDelete }: HabitCardProps) {
  const colorVal = HABIT_COLORS[habit.color as HabitColor]?.value ?? HABIT_COLORS.gold.value;
  const displayTag = tagLabel ?? habit.tagId;
  const scheduleText = buildScheduleText(habit);

  return (
    <div
      className={cn(card, todayDone && cardDone)}
      style={{ borderLeftColor: colorVal }}
    >
      <div className={iconWrap} style={{ background: `${colorVal}20`, color: colorVal }}>
        {habit.icon}
      </div>

      <div className={info}>
        <div className={nameRow}>
          <span className={cn(nameText, todayDone && nameDone)}>{habit.name}</span>
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
          {habit.duration && (
            <span className={durationPill}>⏱ {habit.duration}m</span>
          )}
          {habit.note && <span className={noteText}>{habit.note}</span>}
        </div>
      </div>

      <div className={actions}>
        <button
          type="button"
          className={actionBtn}
          title="Edit"
          onClick={() => onEdit(habit)}
        >
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
      </div>
    </div>
  );
}

const card =
  'flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--r-sm)] bg-[var(--panel2)] border border-[var(--border)] border-l-[3px] transition-all duration-200 hover:border-[var(--border-hi)] group';
const cardDone = 'opacity-60';

const iconWrap =
  'w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center text-[16px] shrink-0';

const info = 'flex-1 min-w-0';
const nameRow = 'flex items-center gap-1.5';
const nameText = 'text-[12px] font-bold text-[var(--text-hi)] truncate font-[var(--font-body)]';
const nameDone = 'line-through text-[var(--text-lo)]';

const metaRow = 'flex items-center gap-1.5 mt-[3px] flex-wrap';
const tagPill =
  'text-[9px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] border rounded-[3px] px-[5px] py-[1px] shrink-0';
const scheduleDisplay = 'text-[9px] text-[var(--text-lo)] tracking-[0.04em] truncate max-w-[180px]';
const durationPill = 'text-[9px] text-[var(--text-lo)] shrink-0';
const noteText = 'text-[9px] text-[var(--text-lo)] truncate max-w-[100px]';

const statusDot = 'w-[6px] h-[6px] rounded-full shrink-0';
const statusDone = 'bg-[var(--mint)] shadow-[0_0_4px_var(--mint)]';
const statusPending = 'bg-[var(--text-lo)]';

const actions =
  'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0';
const actionBtn =
  'w-6 h-6 rounded-[var(--r-sm)] flex items-center justify-center text-[11px] text-[var(--text-mid)] bg-[var(--panel3)] border border-[var(--border)] cursor-pointer hover:text-[var(--text-hi)] hover:border-[var(--border-hi)] transition-all';
const deleteBtn = 'hover:text-[var(--rose)] hover:border-[var(--rose)]';
