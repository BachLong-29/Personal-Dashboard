'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/libs/utils';

import { HABIT_COLORS } from '../constants';
import { useCategories } from '../hooks/useCategories';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useHabitLogs } from '../hooks/useHabitLogs';
import { useHabits } from '../hooks/useHabits';
import { useTasks } from '../hooks/useTasks';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type { CenterTab, Habit, HabitColor, Quest, Task, TaskColor, TaskStatus } from '../types';
import type { ScheduleDisplayOptions } from '../hooks/useScheduleState';
import { ScheduleTaskModal } from './ScheduleTaskModal';
import { TaskCard } from './TaskCard';

interface WeekViewProps {
  weekStart: string;
  display: ScheduleDisplayOptions;
  quests?: Quest[];
  onWeekChange: (weekStart: string) => void;
  onNavigateDay: (date: string) => void;
  onNavigateTab?: (tab: CenterTab) => void;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().substring(0, 10);
}

function getWeekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekView({
  weekStart,
  display,
  quests = [],
  onWeekChange,
  onNavigateDay,
  onNavigateTab,
}: WeekViewProps) {
  const weekEnd = addDays(weekStart, 6);
  const todayStr = new Date().toISOString().substring(0, 10);

  const { data: allTasks = [], isLoading } = useTasks(weekStart, weekEnd);
  const { data: categories = [] } = useCategories();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { data: habits = [] } = useHabits();
  const { data: todayHabitLogs = [] } = useHabitLogs(todayStr);

  const [editing, setEditing] = useState<Task | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [addDefaultDate, setAddDefaultDate] = useState<string | undefined>(undefined);
  const [deletingTask, setDeletingTask] = useState<Task | undefined>(undefined);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const doneMap = useMemo<Record<string, boolean>>(
    () => Object.fromEntries((allTasks as Task[]).map((t) => [t.id, t.status === 'done'])),
    [allTasks],
  );

  const habitLogMap = useMemo<Record<string, boolean>>(
    () => Object.fromEntries(todayHabitLogs.map((l) => [l.habitId, l.done])),
    [todayHabitLogs],
  );

  const weekDays = getWeekDays(weekStart);

  function getTasksForDay(dateStr: string): Task[] {
    return (allTasks as Task[]).filter(
      (t) => t.active && t.startDate <= dateStr && t.endDate >= dateStr,
    );
  }

  function getHabitsForDay(dateStr: string): Habit[] {
    const dow = new Date(dateStr).getDay();
    return (habits as Habit[]).filter(
      (h) => h.active && (h.days as number[]).includes(dow),
    );
  }

  function isBlocked(task: Task): boolean {
    if (task.status !== 'todo') return false;
    return task.dependencies.some((depId) => !doneMap[depId]);
  }

  function handleStatusChange(id: string, status: TaskStatus) {
    updateTask({ id, status });
  }

  function handleEdit(task: Task) {
    setEditing(task);
    setShowModal(true);
  }

  function handleAddForDay(dateStr: string) {
    setEditing(undefined);
    setAddDefaultDate(dateStr);
    setShowModal(true);
  }

  function handleDeleteConfirm() {
    if (!deletingTask) return;
    deleteTask(deletingTask.id);
    setDeletingTask(undefined);
  }

  // Quest day index (only show on today)
  const todayDayIdx = weekDays.findIndex((d) => d === todayStr);

  return (
    <div className={outerWrap}>
      {/* Week navigation */}
      <div className={navRow}>
        <button
          type="button"
          className={navBtn}
          onClick={() => onWeekChange(addDays(weekStart, -7))}
        >
          ‹
        </button>
        <span className={navLabel}>{formatWeekRange(weekStart)}</span>
        <button
          type="button"
          className={navBtn}
          onClick={() => onWeekChange(addDays(weekStart, 7))}
        >
          ›
        </button>
      </div>

      {/* 7-column grid */}
      <div className={gridWrap}>
        {isLoading ? (
          <div className={loadingMsg}>Loading...</div>
        ) : (
          weekDays.map((dayStr, i) => {
            const dayTasks = getTasksForDay(dayStr);
            const isToday = dayStr === todayStr;
            const dayDate = new Date(dayStr);
            const dayNum = dayDate.getDate();

            return (
              <div key={dayStr} className={cn(dayCol, isToday && dayColToday)}>
                {/* Day header */}
                <div className={dayHeader}>
                  <button
                    type="button"
                    className={cn(dayLabel, isToday && dayLabelToday)}
                    onClick={() => onNavigateDay(dayStr)}
                    title={`Go to ${dayStr}`}
                  >
                    <span>{DAY_SHORT[i]}</span>
                    <span className={dayNum2}>{dayNum}</span>
                  </button>
                  <button
                    type="button"
                    className={dayAddBtn}
                    onClick={() => handleAddForDay(dayStr)}
                    title="Add task"
                  >
                    +
                  </button>
                </div>

                {/* Tasks */}
                <div className={dayTaskList}>
                  {dayTasks.map((task) => {
                    const color = HABIT_COLORS[task.color as TaskColor]?.value ?? 'var(--gold)';
                    const blocked = isBlocked(task);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          miniTask,
                          task.status === 'done' && miniTaskDone,
                          blocked && miniTaskBlocked,
                        )}
                        style={{ borderLeftColor: color, borderLeftWidth: 2 }}
                        onClick={() => handleEdit(task)}
                        title={task.name}
                      >
                        <span className={miniTaskIcon}>{task.icon}</span>
                        <span className={miniTaskName}>{task.name}</span>
                        {blocked && <span className={miniLock}>🔒</span>}
                        {task.status === 'done' && <span className={miniDone}>✓</span>}
                      </div>
                    );
                  })}

                  {/* Quests on today column */}
                  {display.showQuests &&
                    i === todayDayIdx &&
                    quests.map((q) => (
                      <div
                        key={q.id}
                        className={cn(miniTask, miniTaskQuest, q.done && miniTaskDone)}
                        title={q.title}
                        onClick={() => onNavigateTab?.('quests')}
                      >
                        <span className={miniTaskIcon}>{q.habitIcon ?? '📌'}</span>
                        <span className={miniTaskName}>{q.title}</span>
                        {q.done && <span className={miniDone}>✓</span>}
                      </div>
                    ))}

                  {/* Habits per day */}
                  {display.showHabits &&
                    getHabitsForDay(dayStr).map((h) => {
                      const color = HABIT_COLORS[h.color as HabitColor]?.value ?? 'var(--violet)';
                      const done = isToday ? (habitLogMap[h.id] ?? false) : false;
                      return (
                        <div
                          key={h.id}
                          className={cn(miniTask, miniTaskHabit, done && miniTaskDone)}
                          style={{ borderLeftColor: color, borderLeftWidth: 2 }}
                          title={h.name}
                          onClick={() => onNavigateTab?.('habits')}
                        >
                          <span className={miniTaskIcon}>{h.icon}</span>
                          <span className={miniTaskName}>{h.name}</span>
                          {done && <span className={miniDone}>✓</span>}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <ScheduleTaskModal
          editing={editing}
          allTasks={allTasks as Task[]}
          defaultDate={addDefaultDate ?? weekStart}
          onClose={() => {
            setShowModal(false);
            setEditing(undefined);
            setAddDefaultDate(undefined);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditing(undefined);
            setAddDefaultDate(undefined);
          }}
        />
      )}

      {deletingTask && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setDeletingTask(undefined)}
        >
          <div className="modal-box" style={{ width: 380 }}>
            <div className="modal-title">
              <span style={{ color: 'var(--rose)' }}>⚠</span> Delete Task
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 16 }}>
              Delete <strong style={{ color: 'var(--text-hi)' }}>{deletingTask.name}</strong>?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn cancel"
                onClick={() => setDeletingTask(undefined)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn"
                onClick={handleDeleteConfirm}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, oklch(0.45 0.18 5), var(--rose))',
                  borderColor: 'var(--rose)',
                  color: '#fff',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const outerWrap = 'flex flex-col flex-1 min-h-0 overflow-hidden';
const navRow =
  'flex items-center gap-2 px-3 py-2 shrink-0 border-b border-[var(--border)] justify-between';
const navBtn =
  'w-7 h-7 flex items-center justify-center rounded border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-mid)] text-[16px] cursor-pointer hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all shrink-0';
const navLabel = 'text-[11px] font-semibold text-[var(--text-hi)]';
const loadingMsg = 'text-[11px] text-[var(--text-lo)] col-span-7 text-center py-8';

const gridWrap = 'flex-1 overflow-hidden grid grid-cols-7 gap-px bg-[var(--border)] min-h-0';

const dayCol = 'flex flex-col bg-[var(--panel)] overflow-hidden min-h-0';
const dayColToday = 'bg-[oklch(0.74_0.17_85_/_0.04)]';

const dayHeader =
  'flex items-center justify-between px-1.5 py-1 border-b border-[var(--border)] shrink-0';
const dayLabel =
  'flex flex-col items-center cursor-pointer hover:text-[var(--gold)] transition-colors';
const dayLabelToday = 'text-[var(--gold)]';
const dayNum2 = 'text-[13px] font-bold leading-none mt-0.5';

const dayAddBtn =
  'w-4 h-4 flex items-center justify-center text-[11px] text-[var(--text-lo)] hover:text-[var(--gold)] cursor-pointer transition-colors leading-none';

const dayTaskList = 'flex-1 overflow-y-auto px-1 py-1 flex flex-col gap-0.5 min-h-0';

const miniTask =
  'flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-[var(--panel2)] border border-[var(--border)] cursor-pointer hover:border-[oklch(0.74_0.17_85_/_0.4)] transition-all overflow-hidden';
const miniTaskDone = 'opacity-50';
const miniTaskBlocked = 'opacity-60 cursor-default';
const miniTaskQuest = 'border-[oklch(0.74_0.17_85_/_0.25)] bg-[oklch(0.74_0.17_85_/_0.05)]';
const miniTaskHabit = 'border-[oklch(0.66_0.22_295_/_0.25)] bg-[oklch(0.66_0.22_295_/_0.05)]';
const miniTaskIcon = 'text-[10px] shrink-0';
const miniTaskName = 'flex-1 truncate text-[var(--text-hi)] leading-tight';
const miniLock = 'text-[8px] shrink-0';
const miniDone = 'text-[9px] text-[oklch(0.76_0.14_162)] shrink-0';
