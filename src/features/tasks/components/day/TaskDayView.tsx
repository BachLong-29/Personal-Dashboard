'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';

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
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onToggleDone: (id: string) => void;
  onMoveToSlot: (id: string, slot: UITask['slot']) => void;
  onRescheduleHabit: (task: UITask, newTime: string) => void;
  onCompleteTask: (id: string) => void;
  rescheduleLoading?: boolean;
  splitMode: 'week' | 'month';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskDayView({
  tasks,
  allTasks,
  expandedId,
  setExpandedId,
  onToggleDone,
  onMoveToSlot,
  onRescheduleHabit,
  onCompleteTask,
  rescheduleLoading,
  splitMode,
}: TaskDayViewProps) {
  const todayTasks = tasks.filter((t) => t.day === 0);
  const done = todayTasks.filter((t) => t.done).length;
  const pct = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;

  const [activeId, setActiveId] = useState<string | null>(null);
  // Which habit card triggered the reschedule modal
  const [rescheduleTarget, setRescheduleTarget] = useState<UITask | null>(null);
  const activeTask = activeId ? todayTasks.find((t) => t.id === activeId) : null;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    onMoveToSlot(active.id as string, over.id as UITask['slot']);
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">
        {/* ── Left: daily ledger ────────────────────────────────────────── */}
        <section className="flex-1 min-w-0 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] flex flex-col overflow-hidden">
          {/* Panel head */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] shrink-0">
            <span className="text-[8px] tracking-[0.18em] text-[var(--text-lo)] font-[var(--font-title)] font-bold">
              CHAPTER I
            </span>
            <h2 className="text-[13px] font-bold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.05em]">
              Today · {dateStr}
            </h2>
            <div className="flex-1" />
            <DayProgress done={done} total={todayTasks.length} pct={pct} />
          </div>

          {/* Active session indicator */}
          <ActiveBlock tasks={todayTasks} />

          {/* Slot columns */}
          <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-[var(--border)]">
            {SLOTS.map((slot) => (
              <SlotColumn
                key={slot.id}
                slot={slot}
                tasks={todayTasks.filter((t) => t.slot === slot.id)}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                onToggleDone={onToggleDone}
                onReschedule={setRescheduleTarget}
                onCompleteTask={onCompleteTask}
                draggingId={activeId}
              />
            ))}
          </div>
        </section>

        {/* ── Right: side panels ────────────────────────────────────────── */}
        <section className="w-[400px] shrink-0 flex flex-col gap-2.5 overflow-y-auto">
          {splitMode === 'week' ? <WeekPeek tasks={allTasks} /> : <MonthPeek tasks={allTasks} />}
          <ScheduleStrip tasks={todayTasks} />
        </section>
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
