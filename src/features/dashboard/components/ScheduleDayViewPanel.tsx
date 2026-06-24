'use client';

import { startTransition, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import {
  useScheduleBlocks,
  useCreateScheduleBlock,
  useUpdateScheduleBlock,
} from '@/features/schedule/hooks/useScheduleBlocks';
import {
  taskToUITask,
  questToUITask,
  habitToUITask,
  isHabitScheduledForDate,
  slotToDefaultTime,
} from '@/features/tasks/data/adapters';
import { MOCK_TASKS, type UITask } from '@/features/tasks/data/mock';
import { TaskDayView } from '@/features/tasks/components/day/TaskDayView';
import { AddTaskModal } from '@/features/tasks/components/shared/AddTaskModal';
import { EditTaskModal } from '@/features/tasks/components/shared/EditTaskModal';
import { toLocalDate, offsetToISO } from '@/features/tasks/utils/date.utils';
import { useProjects } from '@/features/projects/hooks/useProjects';
import type { UpdateTaskPayload, ScheduleBlock, TaskColor } from '@/types';

import { useCreateTask } from '../hooks/useCreateTask';
import { useHabitLogs } from '../hooks/useHabitLogs';
import { useHabitLogsRange } from '../hooks/useHabitLogsRange';
import { useHabits } from '../hooks/useHabits';
import { useQuests } from '../hooks/useQuests';
import { useTaskLogs } from '../hooks/useTaskLogs';
import { useToggleHabitLog } from '../hooks/useToggleHabitLog';
import { useToggleTaskLog } from '../hooks/useToggleTaskLog';
import { useTasks } from '../hooks/useTasks';
import { useUpdateQuestStatus } from '../hooks/useUpdateQuestStatus';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type { Quest } from '../types';
import { AddQuestModal } from './AddQuestModal';

interface Props {
  date: string;
  onDateChange: (d: string) => void;
  showQuests?: boolean;
  showHabits?: boolean;
  onAddQuest?: (q: Quest) => void;
}

export function ScheduleDayViewPanel({
  date,
  onDateChange,
  showQuests = true,
  showHabits = true,
  onAddQuest,
}: Props) {
  const t = useTranslations('dashboard');
  const todayStr = toLocalDate(new Date());

  // ── Controlled date ────────────────────────────────────────────────────────
  const selectedDate = useMemo(() => new Date(date + 'T12:00:00'), [date]);
  const selectedDateStr = date;
  const selectedOffset = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / 86_400_000);
  }, [selectedDate]);

  // ── Current week range (Mon–Sun) for habit log cache ──────────────────────
  const currentWeekStart = useMemo(() => {
    const today = new Date();
    const monBased = (today.getDay() + 6) % 7;
    const d = new Date(today);
    d.setDate(today.getDate() - monBased);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const logRangeFrom = useMemo(() => toLocalDate(currentWeekStart), [currentWeekStart]);
  const logRangeTo = useMemo(() => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + 6);
    return toLocalDate(d);
  }, [currentWeekStart]);

  // ── API data ───────────────────────────────────────────────────────────────
  const { data: apiTasks = [] } = useTasks();
  const { data: apiQuestsRaw = [] } = useQuests();
  const { data: apiProjects = [] } = useProjects('active');
  const { data: apiHabits = [] } = useHabits();
  const { data: apiTaskLogs = [] } = useTaskLogs(todayStr);
  const { data: weekHabitLogs = [] } = useHabitLogsRange(logRangeFrom, logRangeTo);

  const { data: apiTasksForDay = [], isFetching: isFetchingDayTasks } = useTasks(
    selectedDateStr,
    selectedDateStr,
  );
  const { data: apiTaskLogsForDay = [] } = useTaskLogs(selectedDateStr);
  const { data: apiHabitLogsForDay = [] } = useHabitLogs(selectedDateStr);

  const { data: weekTaskBlocks = [] } = useScheduleBlocks({
    from: logRangeFrom,
    to: logRangeTo,
    sourceType: 'task',
  });
  const { data: dayTaskBlocks = [] } = useScheduleBlocks({
    from: selectedDateStr,
    to: selectedDateStr,
    sourceType: 'task',
  });

  const blockMap = useMemo(() => {
    const m = new Map<string, ScheduleBlock>();
    for (const b of [...weekTaskBlocks, ...dayTaskBlocks]) {
      const key = `${b.sourceId}|${b.date}`;
      const cur = m.get(key);
      if (!cur || b.startTime < cur.startTime) m.set(key, b);
    }
    return m;
  }, [weekTaskBlocks, dayTaskBlocks]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateTask = useUpdateTask();
  const updateQuestStatus = useUpdateQuestStatus();
  const toggleHabitLog = useToggleHabitLog();
  const toggleTaskLog = useToggleTaskLog();
  const createTask = useCreateTask();
  const createBlock = useCreateScheduleBlock();
  const updateBlock = useUpdateScheduleBlock();

  // ── Project metadata ───────────────────────────────────────────────────────
  const projectMeta = useMemo(
    () => new Map(apiProjects.map((p) => [p.id, { name: p.name, icon: p.icon, color: p.color }])),
    [apiProjects],
  );

  const withProject = useMemo(
    () =>
      (ui: UITask): UITask => {
        const meta = ui.projectId ? projectMeta.get(ui.projectId) : undefined;
        if (!meta) return ui;
        return { ...ui, projectName: meta.name, projectIcon: meta.icon, projectColor: meta.color };
      },
    [projectMeta],
  );

  // ── Cancelled habit ID sets ────────────────────────────────────────────────
  const cancelledHabitIds = useMemo(
    () =>
      new Set(
        apiTasks.flatMap((t) => (t.habitRef && t.startDate === todayStr ? [t.habitRef] : [])),
      ),
    [apiTasks, todayStr],
  );

  const cancelledHabitIdsForDay = useMemo(
    () =>
      new Set(
        apiTasks.flatMap((t) =>
          t.habitRef && t.startDate === selectedDateStr ? [t.habitRef] : [],
        ),
      ),
    [apiTasks, selectedDateStr],
  );

  // ── Merge API → UITask[] ───────────────────────────────────────────────────
  const apiMerged = useMemo<UITask[]>(() => {
    const tasks = apiTasks.map((t) => {
      const log = apiTaskLogs.find((l) => l.taskId === t.id);
      const blockTime = blockMap.get(`${t.id}|${t.startDate}`)?.startTime;
      return withProject(taskToUITask(t, log, blockTime));
    });
    const quests = apiQuestsRaw.map((q) => questToUITask(q));
    const habits = apiHabits
      .filter((h) => h.active)
      .flatMap((h) =>
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date(currentWeekStart);
          d.setDate(currentWeekStart.getDate() + i);
          if (!isHabitScheduledForDate(h, d)) return null;
          const ds = toLocalDate(d);
          const log = weekHabitLogs.find(
            (l) => l.habitId === h.id && toLocalDate(new Date(l.date)) === ds,
          );
          const cancelled = ds === todayStr && cancelledHabitIds.has(h.id);
          const ui = habitToUITask(h, log, cancelled, d);
          return { ...ui, id: `habit-${h.id}-${ds}` };
        }).filter((x): x is UITask => x !== null),
      );
    return [...tasks, ...quests, ...habits];
  }, [
    apiTasks,
    apiTaskLogs,
    apiQuestsRaw,
    apiHabits,
    weekHabitLogs,
    cancelledHabitIds,
    currentWeekStart,
    todayStr,
    withProject,
    blockMap,
  ]);

  // ── Local tasks state ──────────────────────────────────────────────────────
  const apiLoadedRef = useRef(false);
  const [tasks, setTasks] = useState<UITask[]>(() => MOCK_TASKS.map((t) => ({ ...t })));

  useEffect(() => {
    if (apiMerged.length === 0) return;

    // Earliest task block per task on the selected day — drives placement + time.
    const dayBlockByTask = new Map<string, ScheduleBlock>();
    for (const b of dayTaskBlocks) {
      const cur = dayBlockByTask.get(b.sourceId);
      if (!cur || b.startTime < cur.startTime) dayBlockByTask.set(b.sourceId, b);
    }
    // Task ids with a known block anywhere in the loaded range (week + day).
    // A scheduled single-day task lives on its block's day, not its startDate.
    const taskIdsWithBlock = new Set<string>([
      ...weekTaskBlocks.map((b) => b.sourceId),
      ...dayTaskBlocks.map((b) => b.sourceId),
    ]);

    // 1. Span-based items: multi-day tasks always span their range; single-day
    //    tasks appear here only when they have NO block (else placed by block).
    const spanItems: UITask[] = isFetchingDayTasks
      ? []
      : apiTasksForDay
          .filter((t) => {
            const isMulti = !!t.endDate && t.endDate !== t.startDate;
            return isMulti || !taskIdsWithBlock.has(t.id);
          })
          .map((t) => {
            const log = apiTaskLogsForDay.find((l) => l.taskId === t.id);
            const blockTime = blockMap.get(`${t.id}|${selectedDateStr}`)?.startTime;
            const ui = taskToUITask(t, log, blockTime);
            const done = ui.isMultiDay ? !!log || t.status === 'done' : t.status === 'done';
            return withProject({ ...ui, day: selectedOffset, done });
          });

    // 2. Block-scheduled items: any task with a block on the selected day, placed
    //    at the block's time — even when its startDate is a different day.
    const placedIds = new Set(spanItems.map((u) => u.sourceId));
    const blockItems: UITask[] = [...dayBlockByTask.values()].flatMap((b) => {
      if (placedIds.has(b.sourceId)) return [];
      const t = apiTasks.find((x) => x.id === b.sourceId);
      if (!t) return [];
      const log = apiTaskLogsForDay.find((l) => l.taskId === t.id);
      const ui = taskToUITask(t, log, b.startTime);
      const done = ui.isMultiDay ? !!log || t.status === 'done' : t.status === 'done';
      return [withProject({ ...ui, day: selectedOffset, startTime: b.startTime, done })];
    });

    const dayTaskItems: UITask[] = [...spanItems, ...blockItems];

    const isViewingToday = selectedOffset === 0;
    const habitItemsForDay: UITask[] = isViewingToday
      ? []
      : apiHabits
          .filter((h) => h.active && isHabitScheduledForDate(h, selectedDate))
          .map((h) => {
            const log = apiHabitLogsForDay.find((l) => l.habitId === h.id);
            const cancelled = cancelledHabitIdsForDay.has(h.id);
            return habitToUITask(h, log, cancelled, selectedDate);
          });

    const hasDayData = dayTaskItems.length > 0 || habitItemsForDay.length > 0;

    const merged = hasDayData
      ? [
          ...apiMerged.filter((t) => {
            if (t.source === 'task' && t.day === selectedOffset) return false;
            if (!isViewingToday && t.source === 'habit') return false;
            return true;
          }),
          ...dayTaskItems,
          ...habitItemsForDay,
        ]
      : apiMerged;

    startTransition(() => setTasks(merged));
    apiLoadedRef.current = true;
  }, [
    apiMerged,
    apiTasks,
    apiTasksForDay,
    apiTaskLogsForDay,
    isFetchingDayTasks,
    apiHabits,
    apiHabitLogsForDay,
    cancelledHabitIdsForDay,
    selectedDate,
    selectedDateStr,
    selectedOffset,
    withProject,
    blockMap,
    dayTaskBlocks,
    weekTaskBlocks,
  ]);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [showAddQuestModal, setShowAddQuestModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<UITask | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Quest header data ──────────────────────────────────────────────────────
  const questsDone = apiQuestsRaw.filter((q) => q.done).length;
  const questTotal = apiQuestsRaw.length;
  const questPct = questTotal > 0 ? Math.round((questsDone / questTotal) * 100) : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleToggleDone(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (task.isMultiDay && task.source === 'task' && task.sourceId) {
      const nextLogged = !task.loggedToday;
      setTasks((ts) =>
        ts.map((t) => (t.id === id ? { ...t, loggedToday: nextLogged, done: nextLogged } : t)),
      );
      toggleTaskLog.mutate({ taskId: task.sourceId, date: selectedDateStr });
      if (nextLogged && task.status === 'todo') {
        updateTask.mutate({ id: task.sourceId, status: 'in_progress' });
      }
      return;
    }

    const nextDone = !task.done;
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, done: nextDone, progress: nextDone ? 1 : t.progress } : t,
      ),
    );

    if (task.source === 'quest' && task.sourceId) {
      updateQuestStatus.mutate({ id: task.sourceId, done: nextDone });
    } else if (task.source === 'task' && task.sourceId) {
      updateTask.mutate({ id: task.sourceId, status: nextDone ? 'done' : 'todo' });
    } else if (task.source === 'habit' && task.sourceId) {
      const habitDate = offsetToISO(task.day);
      toggleHabitLog.mutate({ habitId: task.sourceId, date: habitDate, done: nextDone });
    }
  }

  function handleCompleteTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task?.sourceId) return;
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: true, progress: 1, status: 'done' } : t)),
    );
    updateTask.mutate({ id: task.sourceId, status: 'done' });
  }

  function handleMoveToSlot(id: string, slot: UITask['slot'], day = 0) {
    const newStartTime = slotToDefaultTime(slot);
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, slot, day, startTime: newStartTime } : t)),
    );
    const task = tasks.find((t) => t.id === id);
    if (task?.source === 'task' && task.sourceId) {
      const targetDate = offsetToISO(day);
      const existing = blockMap.get(`${task.sourceId}|${targetDate}`);
      if (existing) {
        updateBlock.mutate({ id: existing.id, startTime: newStartTime });
      } else {
        createBlock.mutate({
          sourceType: 'task',
          sourceId: task.sourceId,
          date: targetDate,
          startTime: newStartTime,
          duration: task.est ?? 60,
        });
      }
    }
  }

  function handleRescheduleHabit(habitTask: UITask, newTime: string) {
    if (!habitTask.sourceId) return;
    const hour = parseInt(newTime.split(':')[0] ?? '0', 10);
    const slot: UITask['slot'] =
      hour < 10 ? 'morning' : hour < 13 ? 'deep' : hour < 17 ? 'afternoon' : 'evening';

    const tempId = `reschedule-${habitTask.sourceId}-${Date.now()}`;
    const newTask: UITask = {
      ...habitTask,
      id: tempId,
      sourceId: tempId,
      source: 'task',
      slot,
      startTime: newTime,
      habitRef: habitTask.sourceId,
      cancelled: false,
      done: false,
      deadline: `Today · ${newTime}`,
    };
    setTasks((ts) => [
      ...ts.map((t) => (t.id === habitTask.id ? { ...t, cancelled: true } : t)),
      newTask,
    ]);
    createTask.mutate(
      {
        name: habitTask.title.replace(/^\S+\s+/, ''),
        icon: habitTask.icon ?? '◉',
        color: (habitTask.color ?? 'gold') as TaskColor,
        tagId: habitTask.tagId ?? 'habit',
        startDate: todayStr,
        duration: habitTask.est,
        habitRef: habitTask.sourceId,
      },
      {
        onSuccess: (created) => {
          if (created?.id) {
            createBlock.mutate({
              sourceType: 'task',
              sourceId: created.id,
              date: todayStr,
              startTime: newTime,
              duration: habitTask.est ?? 30,
            });
          }
        },
        onError: () => {
          setTasks((ts) => [
            ...ts.filter((t) => t.id !== tempId),
            ...ts.map((t) => (t.id === habitTask.id ? { ...t, cancelled: false } : t)),
          ]);
        },
      },
    );
  }

  function handleEditTask(task: UITask) {
    if (task.source !== 'task') return;
    setEditingTask(task);
  }

  function handleSaveEdit(id: string, payload: UpdateTaskPayload, onSuccess: () => void) {
    updateTask.mutate(
      { id, ...payload },
      {
        onSuccess: () => {
          setEditingTask(null);
          onSuccess();
        },
      },
    );
  }

  // Visible tasks filtered by display toggles
  const visibleTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.source === 'quest' && !showQuests) return false;
        if (t.source === 'habit' && !showHabits) return false;
        return true;
      }),
    [tasks, showQuests, showHabits],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Quest header + progress */}
      {showQuests && (
        <div className={questHeaderWrap}>
          <div className={questTitleRow}>
            <span className={questSparkle}>✦</span>
            <span className={questTitleText}>{t('quests.title')}</span>
            {onAddQuest && (
              <Button variant="primary" size="sm" onClick={() => setShowAddQuestModal(true)}>
                <span>+</span> {t('quests.new')}
              </Button>
            )}
          </div>
          <div className={questProgressRow}>
            <div className={progBarWrap}>
              <div className={progLabel}>
                <span>{t('quests.dailyProgress')}</span>
                <span className={progLabelValue}>
                  {t('quests.completed', { done: questsDone, total: questTotal })}
                </span>
              </div>
              <div className={progTrack}>
                <div className={progFill} style={{ width: `${questPct}%` }} />
              </div>
            </div>
            <div className={progPctWrap}>
              <div className={progPct}>{questPct}%</div>
              <div className={progDone}>{t('quests.done')}</div>
            </div>
          </div>
        </div>
      )}

      {/* TaskDayView */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <TaskDayView
          tasks={visibleTasks}
          allTasks={tasks}
          selectedDate={selectedDate}
          setSelectedDate={(d) => onDateChange(toLocalDate(d))}
          isLoadingDay={isFetchingDayTasks}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onToggleDone={handleToggleDone}
          onMoveToSlot={handleMoveToSlot}
          onRescheduleHabit={handleRescheduleHabit}
          onCompleteTask={handleCompleteTask}
          onEdit={handleEditTask}
          rescheduleLoading={createTask.isPending}
          splitMode="week"
          hideSidePanel
        />
      </div>

      {/* Modals */}
      {showAddQuestModal && onAddQuest && (
        <AddQuestModal
          onAdd={(q) => {
            onAddQuest(q);
            setShowAddQuestModal(false);
          }}
          onClose={() => setShowAddQuestModal(false)}
        />
      )}
      <AddTaskModal
        open={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSaved={() => setShowAddTaskModal(false)}
      />
      <EditTaskModal
        task={editingTask}
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEdit}
        saving={updateTask.isPending}
      />
    </div>
  );
}

// ── Quest header styles ────────────────────────────────────────────────────────

const questHeaderWrap = 'shrink-0 border-b border-[var(--border)] bg-[oklch(0.74_0.17_85_/_0.03)]';
const questTitleRow = 'flex items-center gap-2 px-[14px] pt-[8px] pb-[6px]';
const questSparkle = 'text-[14px] animate-[spin_4s_linear_infinite]';
const questTitleText =
  'flex-1 [font-family:var(--f-title)] text-[13px] font-bold tracking-[0.08em] text-[var(--text-hi)]';
const questProgressRow = 'flex items-center gap-2.5 px-[14px] pb-[8px]';
const progBarWrap = 'flex-1 flex flex-col gap-[3px]';
const progLabel = 'flex justify-between text-[9px] text-[var(--text-mid)] tracking-[0.06em]';
const progLabelValue = 'text-[var(--mint)] font-bold';
const progTrack =
  'h-[6px] bg-[var(--panel3)] rounded-[4px] overflow-hidden border border-[var(--border)]';
const progFill =
  'h-full rounded-[4px] bg-[linear-gradient(90deg,var(--mint),var(--cyan))] shadow-[0_0_8px_oklch(0.76_0.14_162_/_0.5)] transition-[width] duration-[600ms] ease-[ease]';
const progPctWrap = 'text-center min-w-[34px]';
const progPct = 'font-[var(--font-title)] text-[14px] font-bold text-[var(--mint)]';
const progDone = 'text-[8px] text-[var(--text-mid)] tracking-[0.08em]';
