'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/libs/utils';

import { useCategories } from '../hooks/useCategories';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useHabitLogs } from '../hooks/useHabitLogs';
import { useHabits } from '../hooks/useHabits';
import { useTasks } from '../hooks/useTasks';
import { useToggleHabitLog } from '../hooks/useToggleHabitLog';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type { HabitDay, Quest, Task, TaskStatus } from '../types';
import type { ScheduleDisplayOptions } from '../hooks/useScheduleState';
import { AddTaskModal } from '@/features/tasks/components/shared/AddTaskModal';
import { EditTaskModal } from '@/features/tasks/components/shared/EditTaskModal';
import { taskToUITask } from '@/features/tasks/data/adapters';
import type { UpdateTaskPayload } from '@/types';
import { TaskCard } from './TaskCard';

interface DayViewProps {
  date: string;
  display: ScheduleDisplayOptions;
  quests?: Quest[];
  onDateChange: (date: string) => void;
}

const DOW_MAP: Record<number, HabitDay> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().substring(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function DayView({ date, display, quests = [], onDateChange }: DayViewProps) {
  const { data: allTasks = [], isLoading } = useTasks();
  const { data: categories = [] } = useCategories();
  const { data: habits = [] } = useHabits();
  const { data: habitLogs = [] } = useHabitLogs(date);
  const { mutate: updateTask, isPending: isSavingTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: toggleHabitLog } = useToggleHabitLog();

  const [editing, setEditing] = useState<Task | null>(null);
  const [cloning, setCloning] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | undefined>(undefined);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const doneMap = useMemo<Record<string, boolean>>(
    () => Object.fromEntries(allTasks.map((t) => [t.id, t.status === 'done'])),
    [allTasks],
  );

  const dayTasks = useMemo(
    () =>
      (allTasks as Task[]).filter(
        (t) => t.active && t.startDate <= date && (t.endDate ?? t.startDate) >= date,
      ),
    [allTasks, date],
  );

  const dayOfWeek: HabitDay = DOW_MAP[new Date(date + 'T12:00:00').getDay()] ?? 'mon';

  const dayHabits = useMemo(
    () => habits.filter((h) => h.active && h.schedule.some((e) => e.days.includes(dayOfWeek))),
    [habits, dayOfWeek],
  );

  const logMap = useMemo(
    () => Object.fromEntries(habitLogs.map((l) => [l.habitId, l])),
    [habitLogs],
  );

  function isBlocked(task: Task): boolean {
    if (task.status !== 'todo') return false;
    return task.dependencies.some((depId) => !doneMap[depId]);
  }

  function blockedByNames(task: Task): string[] {
    return task.dependencies
      .filter((depId) => !doneMap[depId])
      .map((depId) => (allTasks as Task[]).find((t) => t.id === depId)?.name ?? depId);
  }

  function handleStatusChange(id: string, status: TaskStatus) {
    updateTask({ id, status });
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setCloning(null);
  }

  function handleEdit(task: Task) {
    setEditing(task);
    setCloning(null);
    setShowModal(true);
  }

  function handleClone(task: Task) {
    setCloning(task);
    setEditing(null);
    setShowModal(true);
  }

  function handleSaveEdit(id: string, payload: UpdateTaskPayload) {
    updateTask({ id, ...payload }, { onSuccess: closeModal });
  }

  function handleDeleteConfirm() {
    if (!deletingTask) return;
    deleteTask(deletingTask.id);
    setDeletingTask(undefined);
  }

  const todayStr = new Date().toISOString().substring(0, 10);
  const isToday = date === todayStr;

  return (
    <div className={outerWrap}>
      {/* Day navigation */}
      <div className={navRow}>
        <button type="button" className={navBtn} onClick={() => onDateChange(addDays(date, -1))}>
          ‹
        </button>
        <div className={navCenter}>
          <span className={cn(navDateLabel, isToday && navDateToday)}>{formatDateLabel(date)}</span>
          {!isToday && (
            <button type="button" className={todayBadge} onClick={() => onDateChange(todayStr)}>
              Today
            </button>
          )}
        </div>
        <button type="button" className={navBtn} onClick={() => onDateChange(addDays(date, 1))}>
          ›
        </button>
      </div>

      <div className={contentWrap}>
        {/* Tasks section */}
        <div className={sectionHeader}>
          <span className={sectionTitle}>◆ Tasks</span>
          <button
            type="button"
            className={addBtn}
            onClick={() => {
              setEditing(null);
              setCloning(null);
              setShowModal(true);
            }}
          >
            + Add
          </button>
        </div>

        {isLoading ? (
          <div className={emptyMsg}>Loading...</div>
        ) : dayTasks.length === 0 ? (
          <div className={emptyMsg}>No tasks for this day.</div>
        ) : (
          <div className={listWrap}>
            {dayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                tagLabel={catMap[task.tagId]}
                isBlocked={isBlocked(task)}
                blockedByNames={blockedByNames(task)}
                onEdit={handleEdit}
                onClone={handleClone}
                onDelete={(id) => setDeletingTask(dayTasks.find((t) => t.id === id))}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* Quests section */}
        {display.showQuests && quests.length > 0 && (
          <>
            <div className={cn(sectionHeader, 'mt-3')}>
              <span className={sectionTitle}>⚡ Quests</span>
            </div>
            <div className={listWrap}>
              {quests.map((q) => (
                <div key={q.id} className={questRow}>
                  <span className={questIcon}>{q.habitIcon ?? '📌'}</span>
                  <span className={cn(questName, q.done && questNameDone)}>{q.title}</span>
                  {q.done && <span className={questDone}>✓</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Habits section */}
        {display.showHabits && dayHabits.length > 0 && (
          <>
            <div className={cn(sectionHeader, 'mt-3')}>
              <span className={sectionTitle}>✦ Habits</span>
              <span className={habitCount}>
                {dayHabits.filter((h) => logMap[h.id]?.done).length}/{dayHabits.length}
              </span>
            </div>
            <div className={listWrap}>
              {dayHabits.map((h) => {
                const done = logMap[h.id]?.done ?? false;
                return (
                  <button
                    key={h.id}
                    type="button"
                    className={cn(habitRow, done && habitRowDone)}
                    onClick={() => toggleHabitLog({ habitId: h.id, date, done: !done })}
                  >
                    <span className={cn(habitCheck, done && habitCheckDone)}>
                      {done ? '✓' : '○'}
                    </span>
                    <span className={habitIcon}>{h.icon}</span>
                    <span className={cn(habitName, done && habitNameDone)}>{h.name}</span>
                    {h.duration && <span className={habitDuration}>⏱ {h.duration}m</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <AddTaskModal
        open={showModal && !editing}
        defaultDate={date}
        defaultValues={
          cloning
            ? {
                name: `Copy of ${cloning.name}`,
                note: cloning.note ?? '',
                icon: cloning.icon,
                tagId: cloning.tagId,
                color: cloning.color as never,
                startDate: new Date(date),
                startTime: cloning.startTime ?? '',
                duration: cloning.duration != null ? String(cloning.duration) : '',
                dependencies: cloning.dependencies,
              }
            : undefined
        }
        onClose={closeModal}
        onSaved={closeModal}
      />
      <EditTaskModal
        task={editing ? taskToUITask(editing) : null}
        open={showModal && !!editing}
        onClose={closeModal}
        onSave={handleSaveEdit}
        saving={isSavingTask}
      />

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
              Delete <strong style={{ color: 'var(--text-hi)' }}>{deletingTask.name}</strong>? This
              cannot be undone.
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
const navRow = 'flex items-center gap-2 px-3 py-2 shrink-0 border-b border-[var(--border)]';
const navBtn =
  'w-7 h-7 flex items-center justify-center rounded border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-mid)] text-[16px] cursor-pointer hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all shrink-0';
const navCenter = 'flex-1 flex items-center justify-center gap-2';
const navDateLabel = 'text-[12px] font-semibold text-[var(--text-hi)]';
const navDateToday = 'text-[var(--gold)]';
const todayBadge =
  'text-[9px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded border border-[var(--gold)] text-[var(--gold)] font-[var(--font-title)] hover:bg-[oklch(0.74_0.17_85_/_0.12)] transition-colors cursor-pointer';

const contentWrap = 'flex-1 overflow-y-auto px-3 py-2.5 min-h-0';
const sectionHeader = 'flex items-center justify-between mb-1.5';
const sectionTitle =
  'text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] font-[var(--font-title)]';
const addBtn =
  'text-[9px] font-bold tracking-[0.08em] uppercase text-[var(--text-lo)] hover:text-[var(--gold)] cursor-pointer transition-colors font-[var(--font-title)]';
const listWrap = 'flex flex-col gap-1.5 mb-2';
const emptyMsg = 'text-[11px] text-[var(--text-lo)] text-center py-4';

const questRow =
  'flex items-center gap-2 px-2.5 py-1.5 bg-[oklch(0.74_0.17_85_/_0.05)] border border-[oklch(0.74_0.17_85_/_0.2)] rounded-[var(--r-sm)]';
const questIcon = 'text-[13px] shrink-0';
const questName = 'flex-1 text-[11px] font-medium text-[var(--text-hi)]';
const questNameDone = 'line-through text-[var(--text-lo)]';
const questDone = 'text-[11px] text-[oklch(0.76_0.14_162)]';

const habitCount = 'text-[9px] font-bold text-[var(--text-lo)] font-[var(--font-title)]';
const habitRow =
  'w-full flex items-center gap-2 px-2.5 py-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] cursor-pointer transition-all hover:border-[var(--border-hi)] text-left';
const habitRowDone = 'opacity-60';
const habitCheck = 'text-[11px] shrink-0 text-[var(--text-lo)] w-4 text-center';
const habitCheckDone = 'text-[var(--mint)]';
const habitIcon = 'text-[13px] shrink-0';
const habitName = 'flex-1 text-[11px] font-medium text-[var(--text-hi)] truncate';
const habitNameDone = 'line-through text-[var(--text-lo)]';
const habitDuration = 'text-[9px] text-[var(--text-lo)] shrink-0';
