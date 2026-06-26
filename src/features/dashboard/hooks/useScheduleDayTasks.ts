import { startTransition, useEffect, useMemo, useRef, useState } from 'react';

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
import { toLocalDate, offsetToISO } from '@/features/tasks/utils/date.utils';
import { useProjects } from '@/features/projects/hooks/useProjects';
import type { UpdateTaskPayload, ScheduleBlock, TaskColor } from '@/types';

import { useCreateTask } from './useCreateTask';
import { useHabitLogs } from './useHabitLogs';
import { useHabitLogsRange } from './useHabitLogsRange';
import { useHabits } from './useHabits';
import { useQuests } from './useQuests';
import { useTaskLogs } from './useTaskLogs';
import { useToggleHabitLog } from './useToggleHabitLog';
import { useToggleTaskLog } from './useToggleTaskLog';
import { useTasks } from './useTasks';
import { useUpdateQuestStatus } from './useUpdateQuestStatus';
import { useUpdateTask } from './useUpdateTask';

interface UseScheduleDayTasksParams {
  /** Selected day, "YYYY-MM-DD". */
  date: string;
  showQuests: boolean;
  showHabits: boolean;
}

interface DayProgress {
  done: number;
  total: number;
  pct: number;
}

interface UseScheduleDayTasksResult {
  /** Full merged ledger for the loaded range (all sources). */
  tasks: UITask[];
  /** `tasks` filtered by the quests/habits display toggles. */
  visibleTasks: UITask[];
  selectedDate: Date;
  isFetchingDayTasks: boolean;
  /** A habit→task reschedule create is in flight. */
  isRescheduling: boolean;
  /** Selected-day completion stats for the header bar. */
  progress: DayProgress;
  editingTask: UITask | null;
  isSavingEdit: boolean;
  onToggleDone: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onMoveToSlot: (id: string, slot: UITask['slot'], day?: number) => void;
  onRescheduleHabit: (habitTask: UITask, newTime: string) => void;
  onEdit: (task: UITask) => void;
  onSaveEdit: (id: string, payload: UpdateTaskPayload, onSuccess: () => void) => void;
  onCloseEdit: () => void;
}

/**
 * Data + mutation layer for the schedule day view: fetches tasks / quests /
 * habits / blocks for the current week and selected day, merges them into a
 * single {@link UITask} ledger, keeps a local working copy for optimistic
 * edits, and exposes the handlers that drive the day grid.
 */
export function useScheduleDayTasks({
  date,
  showQuests,
  showHabits,
}: UseScheduleDayTasksParams): UseScheduleDayTasksResult {
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

  // ── Editing flow ───────────────────────────────────────────────────────────
  const [editingTask, setEditingTask] = useState<UITask | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function onToggleDone(id: string) {
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

  function onCompleteTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task?.sourceId) return;
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: true, progress: 1, status: 'done' } : t)),
    );
    updateTask.mutate({ id: task.sourceId, status: 'done' });
  }

  function onMoveToSlot(id: string, slot: UITask['slot'], day = 0) {
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

  function onRescheduleHabit(habitTask: UITask, newTime: string) {
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

  function onEdit(task: UITask) {
    if (task.source !== 'task') return;
    setEditingTask(task);
  }

  function onSaveEdit(id: string, payload: UpdateTaskPayload, onSuccess: () => void) {
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

  // ── Derived: visible list + selected-day progress ──────────────────────────
  const visibleTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.source === 'quest' && !showQuests) return false;
        if (t.source === 'habit' && !showHabits) return false;
        return true;
      }),
    [tasks, showQuests, showHabits],
  );

  // Progress counts the selected day's visible items (tasks + quests + habits),
  // mirroring the day-view ledger so the header and grid never disagree.
  const progress = useMemo<DayProgress>(() => {
    const dayItems = visibleTasks.filter((t) => t.day === selectedOffset);
    const done = dayItems.filter((t) => t.done).length;
    const total = dayItems.length;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [visibleTasks, selectedOffset]);

  return {
    tasks,
    visibleTasks,
    selectedDate,
    isFetchingDayTasks,
    isRescheduling: createTask.isPending,
    progress,
    editingTask,
    isSavingEdit: updateTask.isPending,
    onToggleDone,
    onCompleteTask,
    onMoveToSlot,
    onRescheduleHabit,
    onEdit,
    onSaveEdit,
    onCloseEdit: () => setEditingTask(null),
  };
}
