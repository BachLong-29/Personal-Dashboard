'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { useProfile } from '@/features/profile/hooks/useProfile';
import { buildEmptyChar, profileToCharacter } from '@/features/dashboard/utils/character.utils';
import { toLocalDate } from '../utils/date.utils';
import { useScheduleDayTasks } from '@/features/dashboard/hooks/useScheduleDayTasks';
import { useCategories } from '@/features/dashboard/hooks/useCategories';
import type { Character } from '@/features/dashboard/types';
import type { TaskColor } from '@/types';
import DashboardTopbar from '@/features/dashboard/components/DashboardTopbar';
import { AddQuestModal } from '@/features/dashboard/components/AddQuestModal';
import { AddTaskModal } from './shared/AddTaskModal';
import { EditTaskModal } from './shared/EditTaskModal';
import type { TaskFormValues } from './shared/TaskForm';

import { type TaskDiff, type UITask } from '../data/mock';
import { questToUITask, parseDateLocal, type QuestLike } from '../data/adapters';
import { PageHeader, type ViewMode } from './PageHeader';
import { TaskDayView } from './day/TaskDayView';
import { TaskAllView } from './all/TaskAllView';

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskManagement() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();

  // ── Selected date for day view ────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const selectedDateStr = useMemo(() => toLocalDate(selectedDate), [selectedDate]);

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

  // ── Day-ledger data + mutations (shared with the dashboard schedule) ──────────
  // The full task page shows every project, sources the day list client-side (no
  // extra fetch when navigating dates), keeps backlog visible, and routes habit
  // edits to the Habits tab.
  const {
    tasks,
    visibleTasks,
    weekTaskBlocks,
    isFetchingDayTasks,
    isRescheduling,
    editingTask,
    isSavingEdit,
    onToggleDone,
    onCompleteTask,
    onMoveToSlot,
    onRescheduleHabit,
    onEdit,
    onSaveEdit,
    onCloseEdit,
    prependTask,
  } = useScheduleDayTasks({
    date: selectedDateStr,
    projectScope: 'all',
    dayTasksSource: 'client',
    preserveBacklog: false,
    onEditHabit: () => {
      const locale = params?.locale ?? 'en';
      router.push(`/${locale}/dashboard?tab=habits`);
    },
  });

  // ── Forge modal ──────────────────────────────────────────────────────────────
  const [showForgeModal, setShowForgeModal] = useState(false);

  function handleQuestForged(quest: QuestLike) {
    // Optimistically prepend the new quest so it appears immediately.
    prependTask(questToUITask(quest));
  }

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
      visibleTasks.filter((t) => {
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
    [visibleTasks, filterCat, filterDiff, search],
  );

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
              taskBlocks={weekTaskBlocks}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              isLoadingDay={isFetchingDayTasks}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onToggleDone={onToggleDone}
              onMoveToSlot={onMoveToSlot}
              onRescheduleHabit={onRescheduleHabit}
              onCompleteTask={onCompleteTask}
              onEdit={onEdit}
              onClone={handleCloneTask}
              rescheduleLoading={isRescheduling}
              splitMode={splitMode}
            />
          )}
          {view === 'all' && <TaskAllView tasks={visible} onEdit={onEdit} />}
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
        onClose={onCloseEdit}
        onSave={onSaveEdit}
        saving={isSavingEdit}
      />
    </div>
  );
}
