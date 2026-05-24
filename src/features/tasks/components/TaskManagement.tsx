'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { findClass } from '@/constants/hero-data';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useHabits } from '@/features/dashboard/hooks/useHabits';
import { useHabitLogs } from '@/features/dashboard/hooks/useHabitLogs';
import { useQuests } from '@/features/dashboard/hooks/useQuests';
import { useTasks } from '@/features/dashboard/hooks/useTasks';
import { useToggleHabitLog } from '@/features/dashboard/hooks/useToggleHabitLog';
import { useUpdateQuestStatus } from '@/features/dashboard/hooks/useUpdateQuestStatus';
import { useUpdateTask } from '@/features/dashboard/hooks/useUpdateTask';
import type { Character } from '@/features/dashboard/types';
import type { UserProfileData } from '@/types';
import DashboardTopbar from '@/features/dashboard/components/DashboardTopbar';
import { AddQuestModal } from '@/features/dashboard/components/AddQuestModal';

import { MOCK_TASKS, type TaskCat, type TaskDiff, type UITask } from '../data/mock';
import { taskToUITask, questToUITask, habitToUITask, isHabitScheduledToday, type QuestLike } from '../data/adapters';
import { PageHeader, type ViewMode } from './PageHeader';
import { TaskDayView } from './day/TaskDayView';
import { TaskWeekView } from './week/TaskWeekView';
import { TaskMonthView } from './month/TaskMonthView';
import { TaskAllView } from './all/TaskAllView';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0]!;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskManagement() {
  const todayStr = todayISO();

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
  const { data: apiTasks    = [] } = useTasks();
  const { data: apiQuests   = [] } = useQuests();
  const { data: apiHabits   = [] } = useHabits();
  const { data: apiHabitLogs = [] } = useHabitLogs(todayStr);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const updateTask        = useUpdateTask();
  const updateQuestStatus = useUpdateQuestStatus();
  const toggleHabitLog    = useToggleHabitLog();

  // ── Merge API data → UITask[] ─────────────────────────────────────────────
  const apiMerged = useMemo<UITask[]>(() => {
    const tasks   = apiTasks.map((t) => taskToUITask(t));

    const quests  = apiQuests.map((q) => questToUITask(q));

    const habits = apiHabits
      .filter((h) => h.active && isHabitScheduledToday(h))
      .map((h) => {
        const log = apiHabitLogs.find((l) => l.habitId === h.id);
        return habitToUITask(h, log);
      });

    return [...tasks, ...quests, ...habits];
  }, [apiTasks, apiQuests, apiHabits, apiHabitLogs]);

  // ── Local task state ──────────────────────────────────────────────────────
  // Seed with MOCK_TASKS while API loads; replace once real data arrives.
  const apiLoadedRef = useRef(false);
  const [tasks, setTasks] = useState<UITask[]>(() => MOCK_TASKS.map((t) => ({ ...t })));

  useEffect(() => {
    // Only replace state when we have at least one real entity from the API
    if (apiMerged.length === 0) return;
    setTasks(apiMerged);
    apiLoadedRef.current = true;
  }, [apiMerged]);

  // ── Forge modal ──────────────────────────────────────────────────────────────
  const [showForgeModal, setShowForgeModal] = useState(false);

  function handleQuestForged(quest: QuestLike) {
    // Optimistically prepend the new quest as a UITask so it appears immediately
    setTasks((ts) => [questToUITask(quest), ...ts]);
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
    // Optimistic local update first
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, done: !t.done, progress: !t.done ? 1 : t.progress } : t,
      ),
    );

    // Fire the appropriate API mutation based on source
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextDone = !task.done;

    if (task.source === 'quest' && task.sourceId) {
      updateQuestStatus.mutate({ id: task.sourceId, done: nextDone });
    } else if (task.source === 'task' && task.sourceId) {
      updateTask.mutate({
        id: task.sourceId,
        status: nextDone ? 'done' : 'todo',
      });
    } else if (task.source === 'habit' && task.sourceId) {
      toggleHabitLog.mutate({
        habitId: task.sourceId,
        date: todayStr,
        done: nextDone,
      });
    }
    // 'mock' source: local-only, no API call needed
  }

  function handleMoveToSlot(id: string, slot: UITask['slot']) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, slot, day: 0 } : t)));
  }

  function handleMoveToDay(id: string, day: number) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, day } : t)));
  }

  // ── Header counts ────────────────────────────────────────────────────────────
  const todayDone  = visible.filter((t) => t.day === 0 && t.done).length;
  const todayTotal = visible.filter((t) => t.day === 0).length;
  const weekDone   = visible.filter((t) => t.day >= 0 && t.day <= 6 && t.done).length;
  const weekTotal  = visible.filter((t) => t.day >= 0 && t.day <= 6).length;

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
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onToggleDone={handleToggleDone}
              onMoveToSlot={handleMoveToSlot}
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
          {view === 'all' && (
            <TaskAllView
              tasks={tasks}
              onToggleDone={handleToggleDone}
            />
          )}
        </div>
      </div>

      {/* ── Forge Quest modal ──────────────────────────────────────────────── */}
      {showForgeModal && (
        <AddQuestModal
          onAdd={handleQuestForged}
          onClose={() => setShowForgeModal(false)}
        />
      )}
    </div>
  );
}

// ─── Character helpers (private to this module) ───────────────────────────────

function buildEmptyChar(): Character {
  return {
    name: '', title: '', level: 1, rank: 'E', class: '',
    streak: 0, xp: 0, xpNext: 1000, coins: 0, gems: 0,
    stats: [
      { key: 'DIS', value: 0, color: 'var(--gold)'   },
      { key: 'WIS', value: 0, color: 'var(--violet)' },
      { key: 'END', value: 0, color: 'var(--mint)'   },
      { key: 'COM', value: 0, color: 'var(--cyan)'   },
      { key: 'SER', value: 0, color: 'var(--rose)'   },
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
      { key: 'DIS', value: scale(profile.stats.discipline),  color: 'var(--gold)'   },
      { key: 'WIS', value: scale(profile.stats.wisdom),      color: 'var(--violet)' },
      { key: 'END', value: scale(profile.stats.endurance),   color: 'var(--mint)'   },
      { key: 'COM', value: scale(profile.stats.composition), color: 'var(--cyan)'   },
      { key: 'SER', value: scale(profile.stats.serenity),    color: 'var(--rose)'   },
    ],
  };
}
