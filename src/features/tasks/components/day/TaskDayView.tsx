'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import type { ScheduleBlock } from '@/types';

import { DatePicker } from '@/components/ui/DatePicker';

import { SLOTS, type UITask } from '../../data/mock';
import { QuestCard } from '../shared/QuestCard';
import { ActiveBlock } from './ActiveBlock';
import { DayProgress } from './DayProgress';
import { MonthPeek } from './MonthPeek';
import { RescheduleHabitModal } from './RescheduleHabitModal';
import { ScheduleStrip } from './ScheduleStrip';
import { SlotColumn } from './SlotColumn';
import { WeekPeek } from './WeekPeek';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskDayViewProps {
  tasks: UITask[];
  allTasks: UITask[];
  /** Task schedule blocks for the visible week — passed to the side peek panels. */
  taskBlocks?: ScheduleBlock[];
  /** Controlled selected date — owned by TaskManagement */
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  /** True while the day-specific API query is in-flight */
  isLoadingDay?: boolean;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onToggleDone: (id: string) => void;
  onMoveToSlot: (id: string, slot: UITask['slot'], day?: number) => void;
  onRescheduleHabit: (task: UITask, newTime: string) => void;
  onCompleteTask: (id: string) => void;
  onEdit?: (task: UITask) => void;
  onClone?: (task: UITask) => void;
  rescheduleLoading?: boolean;
  splitMode: 'week' | 'month';
  hideSidePanel?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeOffset(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskDayView({
  tasks,
  allTasks,
  taskBlocks,
  selectedDate,
  setSelectedDate,
  isLoadingDay,
  expandedId,
  setExpandedId,
  onToggleDone,
  onMoveToSlot,
  onRescheduleHabit,
  onCompleteTask,
  onEdit,
  onClone,
  rescheduleLoading,
  splitMode,
  hideSidePanel = false,
}: TaskDayViewProps) {
  const t = useTranslations('tasks');

  // ── Date offset derived from controlled prop ─────────────────────────────────
  const selectedOffset = useMemo(() => computeOffset(selectedDate), [selectedDate]);

  function shiftDate(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  }

  // ── Tasks for selected date ─────────────────────────────────────────────────
  // Backlog tasks (source 'task' with no startDate) default to day 0 in the
  // adapter, so exclude them here — an unscheduled task belongs to no day.
  const selectedTasks = tasks.filter(
    (t) => t.day === selectedOffset && !(t.source === 'task' && !t.startDate),
  );
  const done = selectedTasks.filter((t) => t.done).length;
  const pct = selectedTasks.length ? Math.round((done / selectedTasks.length) * 100) : 0;

  // ── DnD state ───────────────────────────────────────────────────────────────
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<UITask | null>(null);
  const activeTask = activeId ? selectedTasks.find((t) => t.id === activeId) : null;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    onMoveToSlot(active.id as string, over.id as UITask['slot'], selectedOffset);
  }

  function handleMoveToNextDay(task: UITask) {
    onMoveToSlot(task.id, task.slot, selectedOffset + 1);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-col md:flex-row gap-3 flex-1 min-h-0 overflow-hidden">
        {/* ── Left: daily ledger ────────────────────────────────────────── */}
        <section className="flex-1 min-w-0 min-h-0 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] flex flex-col overflow-hidden">
          {/* Panel head with date navigation */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] shrink-0">
            <span className="text-[8px] tracking-[0.18em] text-[var(--text-lo)] font-[var(--font-title)] font-bold shrink-0">
              {t('taskDayView.chapterOne')}
            </span>

            {/* Date navigation */}
            <div className="flex items-center gap-1.5 flex-1">
              {/* Prev day */}
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                title={t('taskDayView.previousDay')}
                className={navArrowBtn}
              >
                <Icon icon="ArrowLeft" className="text-[14px]" />
              </button>

              {/* DatePicker — shows selected date, opens calendar popup */}
              <div className="w-[190px] shrink-0">
                <DatePicker value={selectedDate} onChange={setSelectedDate} />
              </div>

              {/* Next day */}
              <button
                type="button"
                onClick={() => shiftDate(1)}
                title={t('taskDayView.nextDay')}
                className={navArrowBtn}
              >
                <Icon icon="ArrowRight" className="text-[14px]" />
              </button>

              {/* Today chip — visible only when not on today */}
              {selectedOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date())}
                  className={todayChipCls}
                >
                  {t('taskDayView.today')}
                </button>
              )}
            </div>

            <DayProgress done={done} total={selectedTasks.length} pct={pct} />
          </div>

          {/* Active session indicator */}
          <ActiveBlock tasks={selectedTasks} />

          {/* Loading bar — visible while day-specific query is in flight */}
          {isLoadingDay && (
            <div className="h-[2px] w-full shrink-0 bg-[oklch(0.74_0.17_85_/_0.25)] overflow-hidden">
              <div
                className="h-full w-2/5 bg-[var(--gold)] rounded-full opacity-80"
                style={{ animation: 'slide-loading 1.2s ease-in-out infinite' }}
              />
            </div>
          )}

          {/* Slot columns */}
          <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-[var(--border)]">
            {SLOTS.map((slot) => (
              <SlotColumn
                key={slot.id}
                slot={slot}
                tasks={selectedTasks.filter((t) => t.slot === slot.id)}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                onToggleDone={onToggleDone}
                onReschedule={setRescheduleTarget}
                onCompleteTask={onCompleteTask}
                onEdit={onEdit}
                onClone={onClone}
                onMoveToNextDay={handleMoveToNextDay}
                draggingId={activeId}
              />
            ))}
          </div>
        </section>

        {/* ── Right: side panels — hidden on mobile or when hideSidePanel ── */}
        {!hideSidePanel && (
          <section className="hidden md:flex w-[400px] shrink-0 flex-col gap-2.5 overflow-y-auto">
            {splitMode === 'week' ? (
              <WeekPeek tasks={allTasks} taskBlocks={taskBlocks} />
            ) : (
              <MonthPeek tasks={allTasks} taskBlocks={taskBlocks} />
            )}
            <ScheduleStrip tasks={selectedTasks} />
          </section>
        )}
      </div>

      {/* Drag overlay — ghost card */}
      <DragOverlay>
        {activeTask && (
          <div className="w-[300px]">
            <QuestCard task={activeTask} isOverlay compact />
          </div>
        )}
      </DragOverlay>

      {/* Reschedule habit modal */}
      {rescheduleTarget && (
        <RescheduleHabitModal
          task={rescheduleTarget}
          loading={rescheduleLoading}
          onConfirm={(newTime) => {
            onRescheduleHabit(rescheduleTarget, newTime);
            setRescheduleTarget(null);
          }}
          onClose={() => setRescheduleTarget(null)}
        />
      )}
    </DndContext>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const navArrowBtn =
  'w-6 h-6 flex items-center justify-center text-[var(--text-lo)] hover:text-[var(--gold)] text-[9px] rounded hover:bg-[var(--panel2)] transition-colors shrink-0';

const todayChipCls =
  'px-2 py-0.5 text-[8px] font-bold font-[var(--font-title)] tracking-[0.08em] text-[var(--gold)] border border-[oklch(0.74_0.17_85_/_0.4)] rounded-full hover:bg-[oklch(0.74_0.17_85_/_0.1)] transition-colors shrink-0';
