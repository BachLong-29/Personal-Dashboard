'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/libs/utils';

import { HABIT_COLORS } from '../constants';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useHabitLogs } from '../hooks/useHabitLogs';
import { useHabits } from '../hooks/useHabits';
import { useMoveQuest } from '../hooks/useMoveQuest';
import { useQuests } from '../hooks/useQuests';
import { useTasks } from '../hooks/useTasks';
import { useUpdateHabit } from '../hooks/useUpdateHabit';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type { CenterTab, Habit, HabitColor, Quest, Task, TaskColor } from '../types';
import type { ScheduleDisplayOptions } from '../hooks/useScheduleState';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { AddTaskModal } from '@/features/tasks/components/shared/AddTaskModal';
import { EditTaskModal } from '@/features/tasks/components/shared/EditTaskModal';
import { taskToUITask } from '@/features/tasks/data/adapters';
import type { Task as CoreTask } from '@/types/task';

interface WeekViewProps {
  weekStart: string;
  display: ScheduleDisplayOptions;
  onWeekChange: (weekStart: string) => void;
  onNavigateDay: (date: string) => void;
  onNavigateTab?: (tab: CenterTab) => void;
}

type ActiveDrag =
  | { type: 'task'; item: Task; color: string; dayStr: string }
  | { type: 'quest'; item: Quest; dayStr: string }
  | { type: 'habit'; item: Habit; color: string; dayStr: string };

type DayItem =
  | { kind: 'task'; item: Task; time?: string; color: string }
  | { kind: 'quest'; item: Quest; time?: string }
  | { kind: 'habit'; item: Habit; time?: string; color: string };

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

function dayDiff(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekView({
  weekStart,
  display,
  onWeekChange,
  onNavigateDay,
  onNavigateTab,
}: WeekViewProps) {
  const weekEnd = addDays(weekStart, 6);
  const todayStr = new Date().toISOString().substring(0, 10);

  const { data: allTasks = [], isLoading } = useTasks(weekStart, weekEnd);
  const { data: weekQuests = [] } = useQuests(weekStart, weekEnd);
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: moveQuest } = useMoveQuest();
  const { data: habits = [] } = useHabits();
  const { data: todayHabitLogs = [] } = useHabitLogs(todayStr);
  const { mutate: updateHabit } = useUpdateHabit();

  const [editing, setEditing] = useState<Task | undefined>(undefined);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addDefaultDate, setAddDefaultDate] = useState<string | undefined>(undefined);
  const [deletingTask, setDeletingTask] = useState<Task | undefined>(undefined);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const doneMap = useMemo<Record<string, boolean>>(
    () => Object.fromEntries((allTasks as Task[]).map((t) => [t.id, t.status === 'done'])),
    [allTasks],
  );

  const habitLogMap = useMemo<Record<string, boolean>>(
    () => Object.fromEntries(todayHabitLogs.map((l) => [l.habitId, l.done])),
    [todayHabitLogs],
  );

  // Group week quests by dueDate (YYYY-MM-DD)
  const questsByDate = useMemo<Record<string, Quest[]>>(() => {
    const map: Record<string, Quest[]> = {};
    for (const q of weekQuests as Quest[]) {
      const date = q.dueDate?.substring(0, 10);
      if (!date) continue;
      (map[date] ??= []).push(q);
    }
    return map;
  }, [weekQuests]);

  const weekDays = getWeekDays(weekStart);

  function getTasksForDay(dateStr: string): Task[] {
    return (allTasks as Task[]).filter(
      (t) => t.active && t.startDate <= dateStr && (t.endDate ?? t.startDate) >= dateStr,
    );
  }

  const DOW_TO_HABIT_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  function getHabitsForDay(dateStr: string): Habit[] {
    const dow = new Date(dateStr).getDay();
    const dayStr = DOW_TO_HABIT_DAY[dow];
    if (!dayStr) return [];
    return (habits as Habit[]).filter(
      (h) => h.active && h.schedule.some((e) => e.days.includes(dayStr)),
    );
  }

  function isBlocked(task: Task): boolean {
    if (task.status !== 'todo') return false;
    return task.dependencies.some((depId) => !doneMap[depId]);
  }

  function handleEdit(task: Task) {
    setEditing(task);
    setShowEditModal(true);
  }

  function handleAddForDay(dateStr: string) {
    setEditing(undefined);
    setAddDefaultDate(dateStr);
    setShowAddModal(true);
  }

  function handleDeleteConfirm() {
    if (!deletingTask) return;
    deleteTask(deletingTask.id);
    setDeletingTask(undefined);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag(event.active.data.current as ActiveDrag);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const drag = active.data.current as ActiveDrag;
    const targetDay = over.id as string;
    if (drag.dayStr === targetDay) return;

    if (drag.type === 'task') {
      const diff = dayDiff(drag.dayStr, targetDay);
      updateTask({
        id: drag.item.id,
        startDate: addDays(drag.item.startDate, diff),
        endDate: drag.item.endDate ? addDays(drag.item.endDate, diff) : undefined,
      });
    } else if (drag.type === 'quest') {
      moveQuest({ id: drag.item.id, dueDate: targetDay });
    } else if (drag.type === 'habit') {
      const sourceDow = new Date(drag.dayStr).getDay();
      const targetDow = new Date(targetDay).getDay();
      if (sourceDow === targetDow) return;

      const sourceDay = DOW_TO_HABIT_DAY[sourceDow];
      const targetDayStr = DOW_TO_HABIT_DAY[targetDow];
      if (!sourceDay || !targetDayStr) return;

      // Find the schedule entry that owns sourceDay and move it to targetDay
      const habit = drag.item as Habit;
      const sourceEntry = habit.schedule.find((e) => e.days.includes(sourceDay));
      if (!sourceEntry) return;

      const newSchedule = habit.schedule
        .map((e) => {
          if (e === sourceEntry) {
            // Remove sourceDay, add targetDay (no duplicates)
            const newDays = e.days.filter((d) => d !== sourceDay);
            if (!newDays.includes(targetDayStr)) newDays.push(targetDayStr);
            return { ...e, days: newDays };
          }
          // Remove targetDay from any other entry (day can only live in one slot)
          return { ...e, days: e.days.filter((d) => d !== targetDayStr) };
        })
        .filter((e) => e.days.length > 0);

      updateHabit({ id: drag.item.id, schedule: newSchedule });
    }
  }

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
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={gridWrap}>
          {isLoading ? (
            <div className={loadingMsg}>Loading...</div>
          ) : (
            weekDays.map((dayStr, i) => {
              const dayTasks = getTasksForDay(dayStr);
              const isToday = dayStr === todayStr;
              const dayNum = new Date(dayStr).getDate();

              return (
                <DroppableDay key={dayStr} id={dayStr} isToday={isToday}>
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

                  {/* Items — unified, sorted by time */}
                  <div className={dayTaskList}>
                    {(() => {
                      const dow = DOW_TO_HABIT_DAY[new Date(dayStr).getDay()];

                      const items: DayItem[] = [
                        ...dayTasks.map((t) => ({
                          kind: 'task' as const,
                          item: t,
                          time: t.startTime || undefined,
                          color: HABIT_COLORS[t.color as TaskColor]?.value ?? 'var(--gold)',
                        })),
                        ...(display.showQuests ? (questsByDate[dayStr] ?? []) : []).map((q) => ({
                          kind: 'quest' as const,
                          item: q,
                          time: undefined,
                        })),
                        ...(display.showHabits ? getHabitsForDay(dayStr) : []).map((h) => ({
                          kind: 'habit' as const,
                          item: h,
                          time: dow
                            ? h.schedule.find((e) => e.days.includes(dow))?.time
                            : undefined,
                          color: HABIT_COLORS[h.color as HabitColor]?.value ?? 'var(--violet)',
                        })),
                      ];

                      // Timed items first (ascending), unscheduled at bottom
                      items.sort((a, b) => {
                        if (!a.time && !b.time) return 0;
                        if (!a.time) return 1;
                        if (!b.time) return -1;
                        return a.time.localeCompare(b.time);
                      });

                      return items.map((item) => {
                        if (item.kind === 'task') {
                          const task = item.item;
                          const blocked = isBlocked(task);
                          return (
                            <DraggableItem
                              key={task.id}
                              id={`task|${task.id}|${dayStr}`}
                              data={{ type: 'task', item: task, color: item.color, dayStr }}
                            >
                              <div
                                className={cn(
                                  miniTask,
                                  task.status === 'done' && miniTaskDone,
                                  blocked && miniTaskBlocked,
                                )}
                                style={{ borderLeftColor: item.color, borderLeftWidth: 2 }}
                                onClick={() => handleEdit(task)}
                                title={`${item.time ? item.time + ' ' : ''}${task.name}`}
                              >
                                <div className="flex items-center gap-1 w-full min-w-0">
                                  <span className={miniTaskIcon}>{task.icon}</span>
                                  <span className={miniTaskName}>{task.name}</span>
                                  {blocked && <span className={miniLock}>🔒</span>}
                                  {task.status === 'done' && <span className={miniDone}>✓</span>}
                                </div>
                                {item.time && <span className={miniTime}>{item.time}</span>}
                              </div>
                            </DraggableItem>
                          );
                        }

                        if (item.kind === 'quest') {
                          const q = item.item;
                          return (
                            <DraggableItem
                              key={q.id}
                              id={`quest|${q.id}|${dayStr}`}
                              data={{ type: 'quest', item: q, dayStr }}
                            >
                              <div
                                className={cn(miniTask, miniTaskQuest, q.done && miniTaskDone)}
                                title={q.title}
                                onClick={() => onNavigateTab?.('quests')}
                              >
                                <span className={miniTaskIcon}>{q.habitIcon ?? '📌'}</span>
                                <span className={miniTaskName}>{q.title}</span>
                                {q.done && <span className={miniDone}>✓</span>}
                              </div>
                            </DraggableItem>
                          );
                        }

                        // habit — no drag
                        const h = item.item;
                        const done = isToday ? (habitLogMap[h.id] ?? false) : false;
                        return (
                          <div
                            key={h.id}
                            className={cn(
                              miniTask,
                              miniTaskHabit,
                              miniTaskNoGrab,
                              done && miniTaskDone,
                            )}
                            style={{ borderLeftColor: item.color, borderLeftWidth: 2 }}
                            title={`${item.time ? item.time + ' ' : ''}${h.name}`}
                            onClick={() => onNavigateTab?.('habits')}
                          >
                            <div className="flex items-center gap-1 w-full min-w-0">
                              <span className={miniTaskIcon}>{h.icon}</span>
                              <span className={miniTaskName}>{h.name}</span>
                              {done && <span className={miniDone}>✓</span>}
                            </div>
                            {item.time && <span className={miniTime}>{item.time}</span>}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </DroppableDay>
              );
            })
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDrag && (
            <div
              className={cn(
                miniTask,
                activeDrag.type === 'quest' && miniTaskQuest,
                activeDrag.type === 'habit' && miniTaskHabit,
                dragOverlayItem,
              )}
              style={
                activeDrag.type !== 'quest'
                  ? { borderLeftColor: activeDrag.color, borderLeftWidth: 2 }
                  : undefined
              }
            >
              <span className={miniTaskIcon}>
                {activeDrag.type === 'task'
                  ? activeDrag.item.icon
                  : activeDrag.type === 'quest'
                    ? (activeDrag.item.habitIcon ?? '📌')
                    : activeDrag.item.icon}
              </span>
              <span className={miniTaskName}>
                {activeDrag.type === 'task'
                  ? activeDrag.item.name
                  : activeDrag.type === 'quest'
                    ? activeDrag.item.title
                    : activeDrag.item.name}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Create — unified AddTaskModal */}
      <AddTaskModal
        open={showAddModal}
        defaultDate={addDefaultDate ?? weekStart}
        onClose={() => {
          setShowAddModal(false);
          setAddDefaultDate(undefined);
        }}
        onSaved={() => {
          setShowAddModal(false);
          setAddDefaultDate(undefined);
        }}
      />

      {/* Edit — unified EditTaskModal */}
      <EditTaskModal
        task={editing ? taskToUITask(editing as unknown as CoreTask) : null}
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditing(undefined);
        }}
        onSave={(id, payload) => {
          updateTask(
            { id, ...payload },
            {
              onSuccess: () => {
                setShowEditModal(false);
                setEditing(undefined);
              },
            },
          );
        }}
      />

      <Modal open={!!deletingTask} onClose={() => setDeletingTask(undefined)} maxWidth="380px">
        <ModalHead
          title={
            <>
              <span style={{ color: 'var(--rose)' }}>⚠</span> Delete Task
            </>
          }
        />
        <ModalBody>
          <p style={{ fontSize: 12, color: 'var(--text-mid)', margin: 0 }}>
            Delete <strong style={{ color: 'var(--text-hi)' }}>{deletingTask?.name}</strong>?
          </p>
        </ModalBody>
        <ModalFoot>
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
        </ModalFoot>
      </Modal>
    </div>
  );
}

// ── Droppable day column ──────────────────────────────────────────────────────

function DroppableDay({
  id,
  isToday,
  children,
}: {
  id: string;
  isToday: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn(dayCol, isToday && dayColToday, isOver && dayColOver)}>
      {children}
    </div>
  );
}

// ── Draggable item wrapper ────────────────────────────────────────────────────

function DraggableItem({
  id,
  data,
  children,
}: {
  id: string;
  data: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({ id, data });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0 : 1,
        touchAction: 'none',
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

// ── Style constants ───────────────────────────────────────────────────────────

const outerWrap = 'flex flex-col flex-1 min-h-0 overflow-hidden';
const navRow =
  'flex items-center gap-2 px-3 py-2 shrink-0 border-b border-[var(--border)] justify-between';
const navBtn =
  'w-7 h-7 flex items-center justify-center rounded border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-mid)] text-[16px] cursor-pointer hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all shrink-0';
const navLabel = 'text-[11px] font-semibold text-[var(--text-hi)]';
const loadingMsg = 'text-[11px] text-[var(--text-lo)] col-span-7 text-center py-8';

const gridWrap =
  'flex-1 overflow-y-auto md:overflow-hidden grid grid-cols-1 md:grid-cols-7 gap-px bg-[var(--border)] min-h-0';

const dayCol =
  'flex flex-col bg-[var(--panel)] md:overflow-hidden md:min-h-0 transition-colors duration-150';
const dayColToday = 'bg-[oklch(0.74_0.17_85_/_0.04)]';
const dayColOver =
  'bg-[oklch(0.74_0.17_85_/_0.1)] ring-1 ring-inset ring-[oklch(0.74_0.17_85_/_0.45)]';

const dayHeader =
  'flex items-center justify-between px-1.5 py-1 border-b border-[var(--border)] shrink-0';
const dayLabel =
  'flex flex-col items-center cursor-pointer hover:text-[var(--gold)] transition-colors';
const dayLabelToday = 'text-[var(--gold)]';
const dayNum2 = 'text-[13px] font-bold leading-none mt-0.5';

const dayAddBtn =
  'w-4 h-4 flex items-center justify-center text-[11px] text-[var(--text-lo)] hover:text-[var(--gold)] cursor-pointer transition-colors leading-none';

const dayTaskList = 'px-1 py-1 flex flex-col gap-0.5 md:flex-1 md:overflow-y-auto md:min-h-0';

const miniTask =
  'flex flex-col gap-0.5 px-1.5 py-1.5 rounded text-[9px] bg-[var(--panel2)] border border-[var(--border)] cursor-grab active:cursor-grabbing hover:border-[oklch(0.74_0.17_85_/_0.4)] transition-all overflow-hidden';
const miniTaskDone = 'opacity-50';
const miniTaskBlocked = 'opacity-60 cursor-default';
const miniTaskQuest = 'border-[oklch(0.74_0.17_85_/_0.25)] bg-[oklch(0.74_0.17_85_/_0.05)]';
const miniTaskHabit = 'border-[oklch(0.66_0.22_295_/_0.25)] bg-[oklch(0.66_0.22_295_/_0.05)]';
const miniTaskIcon = 'text-[10px] shrink-0';
const miniTaskName = 'flex-1 truncate text-[var(--text-hi)] leading-tight';
const miniLock = 'text-[8px] shrink-0';
const miniDone = 'text-[9px] text-[oklch(0.76_0.14_162)] shrink-0';
const miniTime = 'text-[7px] text-[var(--text-lo)] shrink-0 font-[var(--font-title)]';
const miniTaskNoGrab = '!cursor-pointer active:!cursor-pointer';

const dragOverlayItem =
  'w-[150px] shadow-[0_8px_28px_rgba(0,0,0,0.55)] scale-105 !cursor-grabbing border-[oklch(0.74_0.17_85_/_0.5)] bg-[var(--panel3)]';
