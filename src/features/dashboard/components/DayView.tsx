'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/libs/utils';

import { useCategories } from '../hooks/useCategories';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useTasks } from '../hooks/useTasks';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type { Quest, Task, TaskStatus } from '../types';
import type { ScheduleDisplayOptions } from '../hooks/useScheduleState';
import { ScheduleTaskModal } from './ScheduleTaskModal';
import { TaskCard } from './TaskCard';

interface DayViewProps {
  date: string;
  display: ScheduleDisplayOptions;
  quests?: Quest[];
  onDateChange: (date: string) => void;
}

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
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const [editing, setEditing] = useState<Task | undefined>(undefined);
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
    () => (allTasks as Task[]).filter((t) => t.active && t.startDate <= date && t.endDate >= date),
    [allTasks, date],
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

  function handleEdit(task: Task) {
    setEditing(task);
    setShowModal(true);
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
          {isToday && <span className={todayBadge}>Today</span>}
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
              setEditing(undefined);
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
      </div>

      {showModal && (
        <ScheduleTaskModal
          editing={editing}
          allTasks={allTasks as Task[]}
          defaultDate={date}
          onClose={() => {
            setShowModal(false);
            setEditing(undefined);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditing(undefined);
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
  'text-[9px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded border border-[var(--gold)] text-[var(--gold)] font-[var(--font-title)]';

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
