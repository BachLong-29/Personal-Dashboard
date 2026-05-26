'use client';

import { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/libs/utils';

import { type SlotMeta, type UITask } from '../../data/mock';
import { QuestCard } from '../shared/QuestCard';

const PAGE_SIZE = 4;

// ─── Droppable slot column ────────────────────────────────────────────────────

interface SlotColumnProps {
  slot: SlotMeta;
  tasks: UITask[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onToggleDone: (id: string) => void;
  onReschedule?: (task: UITask) => void;
  onCompleteTask?: (id: string) => void;
  draggingId: string | null;
}

export function SlotColumn({
  slot,
  tasks,
  expandedId,
  setExpandedId,
  onToggleDone,
  onReschedule,
  onCompleteTask,
  draggingId,
}: SlotColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id });
  const [showAll, setShowAll] = useState(false);

  const visibleTasks = showAll ? tasks : tasks.slice(0, PAGE_SIZE);
  const hiddenCount = tasks.length - visibleTasks.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(slotBase, isOver && slotOver)}
      style={{
        borderLeftColor: slot.color,
        backgroundColor: isOver ? slot.bg : undefined,
      }}
    >
      <SlotHeader slot={slot} count={tasks.length} />

      {tasks.length === 0 ? (
        <EmptySlot color={slot.color} />
      ) : (
        <>
          {visibleTasks.map((t) => (
            <DraggableCard
              key={t.id}
              task={t}
              expanded={expandedId === t.id}
              onExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
              onToggleDone={onToggleDone}
              onReschedule={onReschedule}
              onCompleteTask={onCompleteTask}
              isDragging={draggingId === t.id}
            />
          ))}

          {/* Show-more / collapse controls */}
          {hiddenCount > 0 && (
            <button
              type="button"
              className={showMoreBtn}
              style={{ color: slot.color, borderColor: `${slot.color.replace(')', ' / 0.35)')}` }}
              onClick={() => setShowAll(true)}
            >
              ▾ +{hiddenCount} more quest{hiddenCount !== 1 ? 's' : ''}
            </button>
          )}
          {showAll && tasks.length > PAGE_SIZE && (
            <button
              type="button"
              className={showMoreBtn}
              style={{ color: 'var(--text-lo)', borderColor: 'var(--border)' }}
              onClick={() => setShowAll(false)}
            >
              ▴ Show less
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Slot header ──────────────────────────────────────────────────────────────

function SlotHeader({ slot, count }: { slot: SlotMeta; count: number }) {
  return (
    <div className={slotHead}>
      {/* Colored glyph */}
      <span className="text-[13px] leading-none" style={{ color: slot.color }}>
        {slot.glyph}
      </span>

      {/* Label + time */}
      <span
        className="text-[10px] font-black font-[var(--font-title)] tracking-[0.1em] uppercase"
        style={{ color: slot.color }}
      >
        {slot.label}
      </span>
      <span className="text-[9px] text-[var(--text-lo)] ml-0.5">{slot.time}</span>

      {/* Task count badge */}
      <span
        className={slotCount}
        style={
          count > 0
            ? {
                color: slot.color,
                borderColor: slot.color.replace(')', ' / 0.4)'),
                background: slot.bg,
              }
            : undefined
        }
      >
        {count}
      </span>
    </div>
  );
}

// ─── Empty slot ───────────────────────────────────────────────────────────────

function EmptySlot({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2 py-3 px-2 text-[var(--text-lo)]">
      <div
        className="w-5 h-5 rounded-full border border-dashed flex items-center justify-center text-[11px] opacity-40"
        style={{ borderColor: color, color }}
      >
        +
      </div>
      <span className="text-[10px] opacity-50">Drag a quest here, or forge a new one.</span>
    </div>
  );
}

// ─── Draggable card wrapper ───────────────────────────────────────────────────

interface DraggableCardProps {
  task: UITask;
  expanded: boolean;
  onExpand: () => void;
  onToggleDone: (id: string) => void;
  onReschedule?: (task: UITask) => void;
  onCompleteTask?: (id: string) => void;
  isDragging: boolean;
}

function DraggableCard({ task, expanded, onExpand, onToggleDone, onReschedule, onCompleteTask, isDragging }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('touch-none', isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      <QuestCard task={task} expanded={expanded} onExpand={onExpand} onToggleDone={onToggleDone} onReschedule={onReschedule} onCompleteTask={onCompleteTask} />
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const slotBase = 'px-3 py-2.5 transition-colors duration-150 border-l-[3px] border-transparent';
const slotOver = 'ring-1 ring-inset ring-[oklch(0.74_0.17_85_/_0.25)]';

const slotHead = 'flex items-center gap-2 mb-2.5 pb-2 border-b border-[var(--border)]';

const slotCount =
  'ml-auto text-[8px] font-bold text-[var(--text-lo)] bg-[var(--panel2)] border border-[var(--border)] px-1.5 py-0.5 rounded-full transition-colors';

const showMoreBtn =
  'w-full mt-1.5 py-1 text-[8px] font-bold font-[var(--font-title)] tracking-[0.08em] border border-dashed rounded-[var(--r-sm)] transition-colors hover:opacity-80 cursor-pointer';
