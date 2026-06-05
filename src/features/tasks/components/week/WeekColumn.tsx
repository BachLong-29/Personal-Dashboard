'use client';

import { useState } from 'react';

import { cn } from '@/libs/utils';

import { type UITask } from '../../data/mock';
import { QuestCardMini } from './QuestCardMini';

interface WeekColumnProps {
  dayLabel: string;
  date: Date;
  dayOffset: number;
  isToday: boolean;
  tasks: UITask[];
  done: number;
  pct: number;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onToggleDone: (id: string) => void;
  onMoveToDay: (id: string, day: number) => void;
}

export function WeekColumn({
  dayLabel,
  date,
  dayOffset,
  isToday,
  tasks,
  done,
  pct,
  expandedId,
  setExpandedId,
  onToggleDone,
  onMoveToDay,
}: WeekColumnProps) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={cn(colBase, isToday && colToday, over && colOver)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('taskId');
        if (id) onMoveToDay(id, dayOffset);
      }}
    >
      {/* Column header */}
      <div className="px-2.5 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[12px] font-black text-[var(--text-hi)] font-[var(--font-title)]">
            {dayLabel}
          </span>
          <span className="text-[11px] text-[var(--text-lo)]">{date.getDate()}</span>
          {isToday && (
            <span className="text-[7px] font-bold text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.12)] border border-[oklch(0.74_0.17_85_/_0.3)] px-1 py-0.5 rounded tracking-[0.1em]">
              TODAY
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div className="flex-1 h-[3px] bg-[var(--panel2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--violet)] rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[8px] text-[var(--text-lo)] shrink-0">
            {done}/{tasks.length}
          </span>
        </div>
      </div>

      {/* Task list */}
      <div className="p-2 md:flex-1 md:overflow-y-auto">
        {tasks.length === 0 ? (
          <EmptyColumn />
        ) : (
          tasks.map((t) => {
            const isHabit = t.source === 'habit' || t.cat === 'habit';
            return (
              <div
                key={t.id}
                draggable={!isHabit}
                onDragStart={
                  isHabit
                    ? undefined
                    : (e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData('taskId', t.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }
                }
              >
                <QuestCardMini
                  task={t}
                  expanded={expandedId === t.id}
                  onExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  onToggleDone={onToggleDone}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="text-[18px] opacity-30 mb-1">＋</div>
      <div className="text-[9px] text-[var(--text-lo)] opacity-60">No quests</div>
    </div>
  );
}

const colBase =
  'bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] flex flex-col transition-colors duration-150 md:min-h-0 md:overflow-hidden';
const colToday = 'border-[oklch(0.74_0.17_85_/_0.4)] bg-[oklch(0.74_0.17_85_/_0.02)]';
const colOver =
  'bg-[oklch(0.74_0.17_85_/_0.08)] ring-1 ring-inset ring-[oklch(0.74_0.17_85_/_0.4)]';
