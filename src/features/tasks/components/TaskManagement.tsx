'use client';

import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { useProfile } from '@/features/profile/hooks/useProfile';
import { buildEmptyChar, profileToCharacter } from '@/features/dashboard/utils/character.utils';
import { offsetToISO, toLocalDate, todayISO } from '../utils/date.utils';
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
  parseDateLocal,
  slotToDefaultTime,
  type QuestLike,
} from '../data/adapters';
import { PageHeader, type ViewMode } from './PageHeader';
import { TaskDayView } from './day/TaskDayView';
import { TaskAllView } from './all/TaskAllView';

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskManagement() {
  const todayStr = todayISO();
  const router = useRouter();

  // Monday of the current calendar week (stable)
  const currentWeekStartDate = useMemo(() => {
    const today = new Date();
    const monBased = (today.getDay() + 6) % 7;
    const d = new Date(today);
    d.setDate(today.getDate() - monBased);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const logRangeFrom = useMemo(() => toLocalDate(currentWeekStartDate), [currentWeekStartDate]);

  const logRangeTo = useMemo(() => {
    const d = new Date(currentWeekStartDate);
    d.setDate(currentWeekStartDate.getDate() + 6);
    return toLocalDate(d);
  }, [currentWeekStartDate]);
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

  // Day-specific task list derived client-side from already-loaded apiTasks —
  // no extra API call when navigating dates.
  const apiTasksForDay = useMemo(
    () =>
      apiTasks.filter((t) => {
        if (!t.startDate) return true; // unscheduled — always visible
        const end = t.endDate ?? t.startDate;
        return selectedDateStr >= t.startDate && selectedDateStr <= end;
      }),
    [apiTasks, selectedDateStr],
  );

  // Logs for the selected day (lightweight; React Query caches keyed by date).
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

    const habits = apiHabits
      .filter((h) => h.active)
      .flatMap((h) =>
        Array.from({ length: 7 }, (_, i) => {
          const date = new Date(currentWeekStartDate);
          date.setDate(currentWeekStartDate.getDate() + i);
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
    const spanItems: UITask[] = apiTasksForDay
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
    apiTasks,
    apiTasksForDay,
    apiTaskLogsForDay,
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
      startDate: null,
      endDate: task.endDate ? parseDateLocal(task.endDate) : null,
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
              isLoadingDay={false}
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
          {view === 'all' && <TaskAllView tasks={visible} onEdit={handleEditTask} />}
        </div>
      </div>

      {/* ── Forge Quest modal ──────────────────────────────────────────────── */}
      {showForgeModal && (
        <AddQuestModal onAdd={handleQuestForged} onClose={() => setShowForgeModal(false)} />
      )}

      {/* ── Add Task modal ─────────────────────────────────────────────────── */}
      <AddTaskModal
        open={showAddTaskModal}
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
    </div>
  );
}
