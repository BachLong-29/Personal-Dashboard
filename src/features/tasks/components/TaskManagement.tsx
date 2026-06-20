'use client';

import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { useProfile } from '@/features/profile/hooks/useProfile';
import { buildEmptyChar, profileToCharacter } from '@/features/dashboard/utils/character.utils';
import { isInRange, offsetToISO, toLocalDate, todayISO } from '../utils/date.utils';
import { useHabits } from '@/features/dashboard/hooks/useHabits';
import { useHabitLogs } from '@/features/dashboard/hooks/useHabitLogs';
import { useHabitLogsRange } from '@/features/dashboard/hooks/useHabitLogsRange';
import { useQuests } from '@/features/dashboard/hooks/useQuests';
import { useTasks } from '@/features/dashboard/hooks/useTasks';
import { useCreateTask } from '@/features/dashboard/hooks/useCreateTask';
import { useTaskLogs } from '@/features/dashboard/hooks/useTaskLogs';
import { useToggleHabitLog } from '@/features/dashboard/hooks/useToggleHabitLog';
import { useToggleTaskLog } from '@/features/dashboard/hooks/useToggleTaskLog';
import { useCategories } from '@/features/dashboard/hooks/useCategories';
import { useProjects } from '@/features/projects/hooks/useProjects';
import {
  useScheduleBlocks,
  useCreateScheduleBlock,
  useUpdateScheduleBlock,
} from '@/features/schedule/hooks/useScheduleBlocks';
import type { ScheduleBlock } from '@/types';
import { useUpdateQuestStatus } from '@/features/dashboard/hooks/useUpdateQuestStatus';
import { useMoveQuest } from '@/features/dashboard/hooks/useMoveQuest';
import { useUpdateTask } from '@/features/dashboard/hooks/useUpdateTask';
import type { Character } from '@/features/dashboard/types';
import type { UpdateTaskPayload, TaskColor } from '@/types';
import DashboardTopbar from '@/features/dashboard/components/DashboardTopbar';
import { AddQuestModal } from '@/features/dashboard/components/AddQuestModal';
import { AddTaskModal } from './shared/AddTaskModal';
import { EditTaskModal } from './shared/EditTaskModal';
import type { TaskFormValues } from './shared/TaskForm';

import { MOCK_TASKS, type TaskDiff, type UITask } from '../data/mock';
import {
  taskToUITask,
  questToUITask,
  habitToUITask,
  isHabitScheduledForDate,
  dayOffset,
  slotToDefaultTime,
  type QuestLike,
} from '../data/adapters';
import { PageHeader, type ViewMode } from './PageHeader';
import { TaskDayView } from './day/TaskDayView';
import { TaskWeekView } from './week/TaskWeekView';
import { WeekDropDialog } from './week/WeekDropDialog';
import { TaskMonthView } from './month/TaskMonthView';
import { TaskAllView } from './all/TaskAllView';

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskManagement() {
  const todayStr = todayISO();
  const router = useRouter();

  // ── Week view offset — shared with TaskWeekView ──────────────────────────────
  const [weekViewOffset, setWeekViewOffset] = useState(0);

  // Monday of the current calendar week (stable — never changes mid-session)
  const currentWeekStartDate = useMemo(() => {
    const today = new Date();
    const monBased = (today.getDay() + 6) % 7;
    const d = new Date(today);
    d.setDate(today.getDate() - monBased);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Monday of the week being viewed (changes with weekViewOffset)
  const viewedWeekStartDate = useMemo(() => {
    const d = new Date(currentWeekStartDate);
    d.setDate(currentWeekStartDate.getDate() + weekViewOffset * 7);
    return d;
  }, [currentWeekStartDate, weekViewOffset]);

  // Log range covering both the current week and the viewed week (contiguous)
  const logRangeFrom = useMemo(() => {
    const earlier = weekViewOffset < 0 ? viewedWeekStartDate : currentWeekStartDate;
    return toLocalDate(earlier);
  }, [weekViewOffset, viewedWeekStartDate, currentWeekStartDate]);

  const logRangeTo = useMemo(() => {
    const laterStart = weekViewOffset > 0 ? viewedWeekStartDate : currentWeekStartDate;
    const d = new Date(laterStart);
    d.setDate(laterStart.getDate() + 6);
    return toLocalDate(d);
  }, [weekViewOffset, viewedWeekStartDate, currentWeekStartDate]);
  const params = useParams<{ locale: string }>();

  // ── Selected date for day view ────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const selectedDateStr = useMemo(() => toLocalDate(selectedDate), [selectedDate]);
  const selectedOffset = useMemo(() => dayOffset(selectedDateStr), [selectedDateStr]);

  // ── Character state (for topbar) ────────────────────────────────────────────
  const { data: profileData } = useProfile();
  const charInitialized = useRef(false);
  const [char, setChar] = useState<Character>(() => buildEmptyChar());

  useEffect(() => {
    const profile = profileData?.profile;
    if (!profile || charInitialized.current) return;
    setChar(profileToCharacter(profile));
    charInitialized.current = true;
  }, [profileData]);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // ── API data ─────────────────────────────────────────────────────────────────
  const { data: apiTasks = [] } = useTasks();
  const { data: apiQuests = [] } = useQuests();
  const { data: apiProjects = [] } = useProjects();
  const { data: apiHabits = [] } = useHabits();
  const { data: apiTaskLogs = [] } = useTaskLogs(todayStr);
  // Habit logs covering current week + viewed week (contiguous range)
  const { data: weekHabitLogs = [] } = useHabitLogsRange(logRangeFrom, logRangeTo);

  // Day-specific queries — fire whenever selectedDate changes
  const { data: apiTasksForDay = [], isFetching: isFetchingDayTasks } = useTasks(
    selectedDateStr,
    selectedDateStr,
  );
  const { data: apiTaskLogsForDay = [] } = useTaskLogs(selectedDateStr);
  const { data: apiHabitLogsForDay = [] } = useHabitLogs(selectedDateStr);

  // Task schedule blocks — drive each card's slot. Cover the week range + selected day.
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

  /** `${taskId}|${YYYY-MM-DD}` → earliest schedule block on that date. */
  const blockMap = useMemo(() => {
    const m = new Map<string, ScheduleBlock>();
    for (const b of [...weekTaskBlocks, ...dayTaskBlocks]) {
      const key = `${b.sourceId}|${b.date}`;
      const cur = m.get(key);
      if (!cur || b.startTime < cur.startTime) m.set(key, b);
    }
    return m;
  }, [weekTaskBlocks, dayTaskBlocks]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const updateTask = useUpdateTask();
  const updateQuestStatus = useUpdateQuestStatus();
  const moveQuest = useMoveQuest();
  const toggleHabitLog = useToggleHabitLog();
  const toggleTaskLog = useToggleTaskLog();
  const createTask = useCreateTask();
  const createBlock = useCreateScheduleBlock();
  const updateBlock = useUpdateScheduleBlock();

  // ── Merge API data → UITask[] ─────────────────────────────────────────────

  /**
   * Set of habit IDs that have a replacement task for today.
   * A habit is considered "cancelled" when a task with `habitRef === habit.id`
   * exists with a startDate matching today.
   */
  const cancelledHabitIds = useMemo(
    () =>
      new Set(
        apiTasks.flatMap((t) => (t.habitRef && t.startDate === todayStr ? [t.habitRef] : [])),
      ),
    [apiTasks, todayStr],
  );

  /** Same as above but for the currently selected date (used in day view). */
  const cancelledHabitIdsForDay = useMemo(
    () =>
      new Set(
        apiTasks.flatMap((t) =>
          t.habitRef && t.startDate === selectedDateStr ? [t.habitRef] : [],
        ),
      ),
    [apiTasks, selectedDateStr],
  );

  /** projectId → display meta, used to label tasks that belong to a project. */
  const projectMeta = useMemo(
    () => new Map(apiProjects.map((p) => [p.id, { name: p.name, icon: p.icon, color: p.color }])),
    [apiProjects],
  );

  /** Attach resolved project label fields to a task-sourced UITask. */
  const withProject = useMemo(
    () =>
      (ui: UITask): UITask => {
        const meta = ui.projectId ? projectMeta.get(ui.projectId) : undefined;
        if (!meta) return ui;
        return { ...ui, projectName: meta.name, projectIcon: meta.icon, projectColor: meta.color };
      },
    [projectMeta],
  );

  const apiMerged = useMemo<UITask[]>(() => {
    const tasks = apiTasks.map((t) => {
      const log = apiTaskLogs.find((l) => l.taskId === t.id);
      const blockTime = blockMap.get(`${t.id}|${t.startDate}`)?.startTime;
      return withProject(taskToUITask(t, log, blockTime));
    });
    const quests = apiQuests.map((q) => questToUITask(q));

    // Generate habit UITasks for every scheduled day across:
    //   1. The current calendar week (always — keeps day-view today-habits intact)
    //   2. The viewed week when different from the current week
    // IDs include the date so React keys never collide across days.
    const habitWeekStarts =
      weekViewOffset === 0 ? [currentWeekStartDate] : [currentWeekStartDate, viewedWeekStartDate];

    const habits = apiHabits
      .filter((h) => h.active)
      .flatMap((h) =>
        habitWeekStarts.flatMap((weekStart) =>
          Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            if (!isHabitScheduledForDate(h, date)) return null;

            const dateStr = toLocalDate(date);
            // Compare as local dates: the server stores dates at local midnight, so the
            // ISO string may be a previous UTC day (e.g. 2026-06-17T17:00Z = June 18 UTC+7).
            const log = weekHabitLogs.find(
              (l) => l.habitId === h.id && toLocalDate(new Date(l.date)) === dateStr,
            );
            const cancelled = dateStr === todayStr && cancelledHabitIds.has(h.id);
            const ui = habitToUITask(h, log, cancelled, date);
            return { ...ui, id: `habit-${h.id}-${dateStr}` };
          }).filter((x): x is UITask => x !== null),
        ),
      );

    return [...tasks, ...quests, ...habits];
  }, [
    apiTasks,
    apiTaskLogs,
    apiQuests,
    apiHabits,
    weekHabitLogs,
    cancelledHabitIds,
    currentWeekStartDate,
    viewedWeekStartDate,
    weekViewOffset,
    todayStr,
    withProject,
    blockMap,
  ]);

  // ── Local task state ──────────────────────────────────────────────────────
  // Seed with MOCK_TASKS while API loads; replace once real data arrives.
  const apiLoadedRef = useRef(false);
  const [tasks, setTasks] = useState<UITask[]>(() => MOCK_TASKS.map((t) => ({ ...t })));

  useEffect(() => {
    // Only replace state when we have at least one real entity from the API
    if (apiMerged.length === 0) return;

    // ── Day-specific task UITasks (correct slot + done for selected date) ───────
    const dayTaskItems: UITask[] = isFetchingDayTasks
      ? []
      : apiTasksForDay.map((t) => {
          const log = apiTaskLogsForDay.find((l) => l.taskId === t.id);
          // Slot comes from the task's block on the selected date (if any).
          const blockTime = blockMap.get(`${t.id}|${selectedDateStr}`)?.startTime;
          const ui = taskToUITask(t, log, blockTime);
          // For multi-day tasks: done = log exists for this date OR task is fully done
          const done = ui.isMultiDay ? !!log || t.status === 'done' : t.status === 'done';
          return withProject({ ...ui, day: selectedOffset, done });
        });

    // ── Habit UITasks for non-today selected dates ───────────────────────────────
    // For today, apiMerged already contains the correct habits (day=0).
    // For other dates we need habits scheduled for that day-of-week with the
    // correct day offset, log state, and deadline label.
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

    // ── Merge onto apiMerged baseline ────────────────────────────────────────────
    // When adding non-today data:
    //   • replace tasks at selectedOffset with freshly-fetched day items
    //   • replace today's habits (day=0) with date-specific habits
    // When on today: just replace today's tasks; keep apiMerged habits as-is.
    const hasDayData = dayTaskItems.length > 0 || habitItemsForDay.length > 0;

    const merged = hasDayData
      ? [
          ...apiMerged.filter((t) => {
            if (t.source === 'task' && t.day === selectedOffset) return false;
            if (!isViewingToday && t.source === 'habit') return false; // replaced by habitItemsForDay
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
  ]);

  // ── Forge modal ──────────────────────────────────────────────────────────────
  const [showForgeModal, setShowForgeModal] = useState(false);

  // ── Add task modal ────────────────────────────────────────────────────────────
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [cloneDefaults, setCloneDefaults] = useState<Partial<TaskFormValues> | undefined>();

  function handleCloneTask(task: UITask) {
    setCloneDefaults({
      name: `Copy of ${task.title}`,
      icon: task.icon ?? '',
      note: task.desc ?? '',
      tagId: task.tagId ?? '',
      color: (task.color as TaskColor) ?? 'gold',
      startDate: new Date(),
      endDate: task.endDate ? new Date(task.endDate) : null,
      duration: task.est != null ? String(task.est) : '',
      dependencies: task.dependencies ?? [],
    });
    setShowAddTaskModal(true);
  }

  function handleQuestForged(quest: QuestLike) {
    // Optimistically prepend the new quest as a UITask so it appears immediately
    setTasks((ts) => [questToUITask(quest), ...ts]);
  }

  // ── Edit task modal ──────────────────────────────────────────────────────────
  const [editingTask, setEditingTask] = useState<UITask | null>(null);

  function handleEditTask(task: UITask) {
    if (task.source === 'habit') {
      // Navigate to the Habits tab of the dashboard
      const locale = params?.locale ?? 'en';
      router.push(`/${locale}/dashboard?tab=habits`);
      return;
    }
    setEditingTask(task);
  }

  function handleSaveEdit(id: string, payload: UpdateTaskPayload) {
    updateTask.mutate(
      { id, ...payload },
      {
        onSuccess: () => setEditingTask(null),
      },
    );
  }

  // ── View / filter state ─────────────────────────────────────────────────────
  const [view, setView] = useState<ViewMode>('day');
  const { data: categories = [] } = useCategories();
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterDiff, setFilterDiff] = useState<TaskDiff | 'all'>('all');
  const [search, setSearch] = useState('');
  const [splitMode, setSplitMode] = useState<'week' | 'month'>('week');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      tasks.filter((t) => {
        if (filterCat !== 'all' && t.tagId !== filterCat) return false;
        if (filterDiff !== 'all' && t.diff !== filterDiff) return false;
        if (search) {
          const s = search.toLowerCase();
          if (
            !t.title.toLowerCase().includes(s) &&
            !t.desc.toLowerCase().includes(s) &&
            !(t.projectName?.toLowerCase().includes(s) ?? false) &&
            !t.tags.some((x) => x.toLowerCase().includes(s))
          )
            return false;
        }
        return true;
      }),
    [tasks, filterCat, filterDiff, search],
  );

  // ── Actions ─────────────────────────────────────────────────────────────────

  function handleToggleDone(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (task.isMultiDay && task.source === 'task' && task.sourceId) {
      // Multi-day task: toggle today's log — does NOT change the task's overall status
      const nextLogged = !task.loggedToday;

      // Optimistic update: flip loggedToday + mirror into done for the check-button visual
      setTasks((ts) =>
        ts.map((t) => (t.id === id ? { ...t, loggedToday: nextLogged, done: nextLogged } : t)),
      );

      toggleTaskLog.mutate({ taskId: task.sourceId, date: selectedDateStr });

      // First time logging → transition to in_progress
      if (nextLogged && task.status === 'todo') {
        updateTask.mutate({ id: task.sourceId, status: 'in_progress' });
      }
      return;
    }

    // ── Single-day / quest / habit behavior (unchanged) ───────────────────
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
      // Derive the exact calendar date from the task's day offset so toggling
      // a habit on Wed in the week view writes a log for Wed, not selectedDate.
      const habitDate = (() => {
        const d = new Date();
        d.setDate(d.getDate() + task.day);
        return toLocalDate(d);
      })();
      toggleHabitLog.mutate({ habitId: task.sourceId, date: habitDate, done: nextDone });
    }
    // 'mock' source: local-only
  }

  /** Explicitly mark a multi-day task as fully complete (separate from daily check-in). */
  function handleCompleteTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task?.sourceId) return;

    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: true, progress: 1, status: 'done' } : t)),
    );
    updateTask.mutate({ id: task.sourceId, status: 'done' });
  }

  function handleMoveToSlot(id: string, slot: UITask['slot'], day = 0) {
    // Dropping into a slot sets the slot's default time as the card's block time.
    const newStartTime = slotToDefaultTime(slot);

    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, slot, day, startTime: newStartTime } : t)),
    );

    // Persist by creating (or moving) a schedule block on the target date.
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

  // Out-of-range drop awaiting a Strict/Flexible decision
  const [pendingMove, setPendingMove] = useState<{
    sourceId: string;
    title: string;
    targetISO: string;
    startDate?: string;
    endDate?: string;
  } | null>(null);

  function handleMoveToDay(id: string, day: number) {
    // Always reflect the move locally first (keeps the card under the cursor)
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, day } : t)));

    const task = tasks.find((t) => t.id === id);
    if (!task?.sourceId) return;
    const targetISO = offsetToISO(day);

    // ── Quest — moving its deadline ────────────────────────────────────────
    if (task.source === 'quest') {
      moveQuest.mutate({ id: task.sourceId, dueDate: targetISO });
      return;
    }

    // ── Task — persist the new day, guarding the [start, due] span ──────────
    if (task.source === 'task') {
      const inRange = isInRange(targetISO, task.startDate, task.endDate);
      if (task.endDate && !inRange) {
        // Multi-day task dropped outside its span → ask how to resolve (Flexible)
        setPendingMove({
          sourceId: task.sourceId,
          title: task.title,
          targetISO,
          startDate: task.startDate,
          endDate: task.endDate,
        });
        return;
      }
      // Single-day (or in-range) move → just shift the start date
      updateTask.mutate({ id: task.sourceId, startDate: targetISO });
    }
  }

  /** Flexible: grow the task's span to include the dropped day. */
  function handleExtendPending() {
    if (!pendingMove) return;
    const { sourceId, targetISO, endDate } = pendingMove;
    const patch: UpdateTaskPayload =
      endDate && targetISO > endDate ? { endDate: targetISO } : { startDate: targetISO };
    updateTask.mutate({ id: sourceId, ...patch }, { onSettled: () => setPendingMove(null) });
  }

  /** Flexible: move the task to the dropped day as a single-day task. */
  function handleMovePending() {
    if (!pendingMove) return;
    const { sourceId, targetISO } = pendingMove;
    updateTask.mutate(
      { id: sourceId, startDate: targetISO, endDate: null },
      { onSettled: () => setPendingMove(null) },
    );
  }

  function handleRescheduleHabit(habitTask: UITask, newTime: string) {
    if (!habitTask.sourceId) return;

    // Derive slot from the chosen time so the new task lands in the right column
    const hour = parseInt(newTime.split(':')[0] ?? '0', 10);
    const slot: UITask['slot'] =
      hour < 10 ? 'morning' : hour < 13 ? 'deep' : hour < 17 ? 'afternoon' : 'evening';

    // Optimistic: mark the habit as cancelled + add a placeholder task card
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

    // Persist — on success the query refetch replaces the temp task with a real one.
    // The chosen time becomes a schedule block on the new task.
    createTask.mutate(
      {
        name: habitTask.title.replace(/^\S+\s+/, ''), // strip leading icon
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
        // On error: roll back the optimistic update
        onError: () => {
          setTasks((ts) => [
            ...ts.filter((t) => t.id !== tempId),
            ...ts.map((t) => (t.id === habitTask.id ? { ...t, cancelled: false } : t)),
          ]);
        },
      },
    );
  }

  // ── Header counts ────────────────────────────────────────────────────────────
  const todayDone = visible.filter((t) => t.day === 0 && t.done).length;
  const todayTotal = visible.filter((t) => t.day === 0).length;
  const weekDone = visible.filter((t) => t.day >= 0 && t.day <= 6 && t.done).length;
  const weekTotal = visible.filter((t) => t.day >= 0 && t.day <= 6).length;

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)] overflow-hidden">
      {/* Topbar */}
      <DashboardTopbar char={char} dateStr={dateStr} onEndDay={() => {}} />

      {/* Page content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 gap-3">
        {/* Header + filters */}
        <PageHeader
          view={view}
          onViewChange={setView}
          categories={categories}
          filterCat={filterCat}
          onFilterCat={setFilterCat}
          filterDiff={filterDiff}
          onFilterDiff={setFilterDiff}
          splitMode={splitMode}
          onSplitMode={setSplitMode}
          search={search}
          onSearch={setSearch}
          onForge={() => setShowForgeModal(true)}
          onAddTask={() => setShowAddTaskModal(true)}
          todayDone={todayDone}
          todayTotal={todayTotal}
          weekDone={weekDone}
          weekTotal={weekTotal}
        />

        {/* Active view */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {view === 'day' && (
            <TaskDayView
              tasks={visible}
              allTasks={tasks}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              isLoadingDay={isFetchingDayTasks}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onToggleDone={handleToggleDone}
              onMoveToSlot={handleMoveToSlot}
              onRescheduleHabit={handleRescheduleHabit}
              onCompleteTask={handleCompleteTask}
              onEdit={handleEditTask}
              onClone={handleCloneTask}
              rescheduleLoading={createTask.isPending}
              splitMode={splitMode}
            />
          )}
          {view === 'week' && (
            <TaskWeekView
              tasks={visible}
              weekOffset={weekViewOffset}
              onWeekChange={setWeekViewOffset}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onToggleDone={handleToggleDone}
              onMoveToDay={handleMoveToDay}
            />
          )}
          {view === 'month' && (
            <TaskMonthView
              tasks={visible}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onToggleDone={handleToggleDone}
            />
          )}
          {view === 'all' && (
            <TaskAllView tasks={tasks} filterCat={filterCat} onEdit={handleEditTask} />
          )}
        </div>
      </div>

      {/* ── Forge Quest modal ──────────────────────────────────────────────── */}
      {showForgeModal && (
        <AddQuestModal onAdd={handleQuestForged} onClose={() => setShowForgeModal(false)} />
      )}

      {/* ── Add Task modal ─────────────────────────────────────────────────── */}
      <AddTaskModal
        open={showAddTaskModal}
        defaultDate={selectedDateStr}
        defaultValues={cloneDefaults}
        onClose={() => {
          setShowAddTaskModal(false);
          setCloneDefaults(undefined);
        }}
        onSaved={() => {
          setShowAddTaskModal(false);
          setCloneDefaults(undefined);
        }}
      />

      {/* ── Edit Task modal ───────────────────────────────────────────────── */}
      <EditTaskModal
        task={editingTask}
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEdit}
        saving={updateTask.isPending}
      />

      {/* ── Out-of-range drop dialog (Flexible mode) ──────────────────────── */}
      {pendingMove && (
        <WeekDropDialog
          taskTitle={pendingMove.title}
          targetDateLabel={new Date(pendingMove.targetISO).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
          onExtend={handleExtendPending}
          onMove={handleMovePending}
          onCancel={() => setPendingMove(null)}
          loading={updateTask.isPending}
        />
      )}
    </div>
  );
}
