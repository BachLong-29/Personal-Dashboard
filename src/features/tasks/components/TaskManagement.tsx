'use client';

import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { findClass } from '@/constants/hero-data';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useHabits } from '@/features/dashboard/hooks/useHabits';
import { useHabitLogs } from '@/features/dashboard/hooks/useHabitLogs';
import { useQuests } from '@/features/dashboard/hooks/useQuests';
import { useTasks } from '@/features/dashboard/hooks/useTasks';
import { useCreateTask } from '@/features/dashboard/hooks/useCreateTask';
import { useTaskLogs } from '@/features/dashboard/hooks/useTaskLogs';
import { useToggleHabitLog } from '@/features/dashboard/hooks/useToggleHabitLog';
import { useToggleTaskLog } from '@/features/dashboard/hooks/useToggleTaskLog';
import { useUpdateQuestStatus } from '@/features/dashboard/hooks/useUpdateQuestStatus';
import { useUpdateTask } from '@/features/dashboard/hooks/useUpdateTask';
import type { Character } from '@/features/dashboard/types';
import type { UpdateTaskPayload, UserProfileData, TaskColor } from '@/types';
import DashboardTopbar from '@/features/dashboard/components/DashboardTopbar';
import { AddQuestModal } from '@/features/dashboard/components/AddQuestModal';
import { AddTaskModal } from './shared/AddTaskModal';
import { EditTaskModal } from './shared/EditTaskModal';
import type { TaskFormValues } from './shared/TaskForm';

import { MOCK_TASKS, type TaskCat, type TaskDiff, type UITask } from '../data/mock';
import {
  taskToUITask,
  questToUITask,
  habitToUITask,
  isHabitScheduledToday,
  isHabitScheduledForDate,
  dayOffset,
  slotToDefaultTime,
  type QuestLike,
} from '../data/adapters';
import { PageHeader, type ViewMode } from './PageHeader';
import { TaskDayView } from './day/TaskDayView';
import { TaskWeekView } from './week/TaskWeekView';
import { TaskMonthView } from './month/TaskMonthView';
import { TaskAllView } from './all/TaskAllView';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function todayISO(): string {
  return toLocalDate(new Date());
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskManagement() {
  const todayStr = todayISO();
  const router = useRouter();
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
  const { data: apiHabits = [] } = useHabits();
  const { data: apiHabitLogs = [] } = useHabitLogs(todayStr);
  const { data: apiTaskLogs = [] } = useTaskLogs(todayStr);

  // Day-specific queries — fire whenever selectedDate changes
  const { data: apiTasksForDay = [], isFetching: isFetchingDayTasks } = useTasks(
    selectedDateStr,
    selectedDateStr,
  );
  const { data: apiTaskLogsForDay = [] } = useTaskLogs(selectedDateStr);
  const { data: apiHabitLogsForDay = [] } = useHabitLogs(selectedDateStr);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const updateTask = useUpdateTask();
  const updateQuestStatus = useUpdateQuestStatus();
  const toggleHabitLog = useToggleHabitLog();
  const toggleTaskLog = useToggleTaskLog();
  const createTask = useCreateTask();

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

  const apiMerged = useMemo<UITask[]>(() => {
    // Pass today's TaskLog (if any) so multi-day tasks know if today is logged
    const tasks = apiTasks.map((t) => {
      const log = apiTaskLogs.find((l) => l.taskId === t.id);
      return taskToUITask(t, log);
    });
    const quests = apiQuests.map((q) => questToUITask(q));
    const habits = apiHabits
      .filter((h) => h.active && isHabitScheduledToday(h))
      .map((h) => {
        const log = apiHabitLogs.find((l) => l.habitId === h.id);
        const cancelled = cancelledHabitIds.has(h.id);
        return habitToUITask(h, log, cancelled);
      });
    return [...tasks, ...quests, ...habits];
  }, [apiTasks, apiTaskLogs, apiQuests, apiHabits, apiHabitLogs, cancelledHabitIds]);

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
          const ui = taskToUITask(t, log);
          // Assign slot by startTime regardless of day offset
          const h = t.startTime ? parseInt(t.startTime.split(':')[0] ?? '0', 10) : null;
          const slot: UITask['slot'] =
            h === null
              ? 'morning'
              : h < 10
                ? 'morning'
                : h < 13
                  ? 'deep'
                  : h < 17
                    ? 'afternoon'
                    : 'evening';
          // For multi-day tasks: done = log exists for this date OR task is fully done
          const done = ui.isMultiDay ? !!log || t.status === 'done' : t.status === 'done';
          return { ...ui, slot, day: selectedOffset, done };
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
    selectedOffset,
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
      startTime: task.startTime ?? '',
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
  const [filterCat, setFilterCat] = useState<TaskCat | 'all'>('all');
  const [filterDiff, setFilterDiff] = useState<TaskDiff | 'all'>('all');
  const [search, setSearch] = useState('');
  const [splitMode, setSplitMode] = useState<'week' | 'month'>('week');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      tasks.filter((t) => {
        if (filterCat !== 'all' && t.cat !== filterCat) return false;
        if (filterDiff !== 'all' && t.diff !== filterDiff) return false;
        if (search) {
          const s = search.toLowerCase();
          if (
            !t.title.toLowerCase().includes(s) &&
            !t.desc.toLowerCase().includes(s) &&
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
      toggleHabitLog.mutate({ habitId: task.sourceId, date: selectedDateStr, done: nextDone });
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
    // When dragging to a slot on the current day, assign the slot's default startTime
    const newStartTime = day === 0 ? slotToDefaultTime(slot) : undefined;

    setTasks((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, slot, day, ...(newStartTime ? { startTime: newStartTime } : {}) } : t,
      ),
    );

    // Persist startTime to API for real tasks on the current day
    const task = tasks.find((t) => t.id === id);
    if (task?.source === 'task' && task.sourceId && day === 0) {
      updateTask.mutate({ id: task.sourceId, startTime: newStartTime });
    }
  }

  function handleMoveToDay(id: string, day: number) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, day } : t)));
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

    // Persist — on success the query refetch replaces the temp task with a real one
    createTask.mutate(
      {
        name: habitTask.title.replace(/^\S+\s+/, ''), // strip leading icon
        icon: habitTask.icon ?? '◉',
        color: (habitTask.color ?? 'gold') as TaskColor,
        tagId: habitTask.tagId ?? 'habit',
        startDate: todayStr,
        startTime: newTime,
        duration: habitTask.est,
        habitRef: habitTask.sourceId,
      },
      {
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
        <div className="flex-1 min-h-0 overflow-hidden">
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
          {view === 'all' && <TaskAllView tasks={tasks} onToggleDone={handleToggleDone} />}
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
    </div>
  );
}

// ─── Character helpers (private to this module) ───────────────────────────────

function buildEmptyChar(): Character {
  return {
    name: '',
    title: '',
    level: 1,
    rank: 'E',
    class: '',
    streak: 0,
    xp: 0,
    xpNext: 1000,
    coins: 0,
    gems: 0,
    stats: [
      { key: 'DIS', value: 0, color: 'var(--gold)' },
      { key: 'WIS', value: 0, color: 'var(--violet)' },
      { key: 'END', value: 0, color: 'var(--mint)' },
      { key: 'COM', value: 0, color: 'var(--cyan)' },
      { key: 'SER', value: 0, color: 'var(--rose)' },
    ],
  };
}

function profileToCharacter(profile: UserProfileData): Character {
  const heroClass = findClass(profile.classId);
  const scale = (v: number) => Math.round((v / Math.max(profile.statPool, 1)) * 100);
  return {
    name: profile.heroName || 'Hero',
    title: profile.title,
    level: profile.level,
    rank: profile.rank || 'E',
    class: heroClass.name,
    streak: profile.streak,
    xp: profile.xp ?? 0,
    xpNext: profile.xpNext ?? 0,
    coins: profile.coins ?? 0,
    gems: profile.gems ?? 0,
    stats: [
      { key: 'DIS', value: scale(profile.stats.discipline), color: 'var(--gold)' },
      { key: 'WIS', value: scale(profile.stats.wisdom), color: 'var(--violet)' },
      { key: 'END', value: scale(profile.stats.endurance), color: 'var(--mint)' },
      { key: 'COM', value: scale(profile.stats.composition), color: 'var(--cyan)' },
      { key: 'SER', value: scale(profile.stats.serenity), color: 'var(--rose)' },
    ],
  };
}
