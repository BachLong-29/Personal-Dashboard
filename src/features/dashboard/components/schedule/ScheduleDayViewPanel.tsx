'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { TaskDayView } from '@/features/tasks/components/day/TaskDayView';
import { AddTaskModal } from '@/features/tasks/components/shared/AddTaskModal';
import { EditTaskModal } from '@/features/tasks/components/shared/EditTaskModal';
import { toLocalDate } from '@/features/tasks/utils/date.utils';

import { useScheduleDayTasks } from '../../hooks/useScheduleDayTasks';
import type { Quest } from '../../types';
import { AddHabitModal } from '../habits/AddHabitModal';
import { AddQuestModal } from './AddQuestModal';
import { NewItemMenu } from './NewItemMenu';

interface Props {
  date: string;
  onDateChange: (d: string) => void;
  showQuests?: boolean;
  showHabits?: boolean;
  onAddQuest?: (q: Quest) => void;
}

export function ScheduleDayViewPanel({
  date,
  onDateChange,
  showQuests = true,
  showHabits = true,
  onAddQuest,
}: Props) {
  const t = useTranslations('dashboard');

  const {
    tasks,
    visibleTasks,
    selectedDate,
    isFetchingDayTasks,
    isRescheduling,
    progress,
    editingTask,
    isSavingEdit,
    onToggleDone,
    onCompleteTask,
    onMoveToSlot,
    onRescheduleHabit,
    onEdit,
    onSaveEdit,
    onCloseEdit,
  } = useScheduleDayTasks({ date, showQuests, showHabits, requireBlock: true });

  // ── Create-modal + expand UI state ─────────────────────────────────────────
  const [showAddQuestModal, setShowAddQuestModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Quest header + progress */}
      {showQuests && (
        <div className={questHeaderWrap}>
          <div className={questTitleRow}>
            <span className={questSparkle}>✦</span>
            <span className={questTitleText}>{t('quests.title')}</span>
            <NewItemMenu
              showQuestOption={!!onAddQuest}
              onSelectTask={() => setShowAddTaskModal(true)}
              onSelectQuest={() => setShowAddQuestModal(true)}
              onSelectHabit={() => setShowAddHabitModal(true)}
            />
          </div>
          <div className={questProgressRow}>
            <div className={progBarWrap}>
              <div className={progLabel}>
                <span>{t('quests.dailyProgress')}</span>
                <span className={progLabelValue}>
                  {t('quests.completed', { done: progress.done, total: progress.total })}
                </span>
              </div>
              <div className={progTrack}>
                <div className={progFill} style={{ width: `${progress.pct}%` }} />
              </div>
            </div>
            <div className={progPctWrap}>
              <div className={progPct}>{progress.pct}%</div>
              <div className={progDone}>{t('quests.done')}</div>
            </div>
          </div>
        </div>
      )}

      {/* TaskDayView */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <TaskDayView
          tasks={visibleTasks}
          allTasks={tasks}
          selectedDate={selectedDate}
          setSelectedDate={(d) => onDateChange(toLocalDate(d))}
          isLoadingDay={isFetchingDayTasks}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onToggleDone={onToggleDone}
          onMoveToSlot={onMoveToSlot}
          onRescheduleHabit={onRescheduleHabit}
          onCompleteTask={onCompleteTask}
          onEdit={onEdit}
          rescheduleLoading={isRescheduling}
          splitMode="week"
          hideSidePanel
        />
      </div>

      {/* Modals */}
      {showAddQuestModal && onAddQuest && (
        <AddQuestModal
          onAdd={(q) => {
            onAddQuest(q);
            setShowAddQuestModal(false);
          }}
          onClose={() => setShowAddQuestModal(false)}
        />
      )}
      <AddTaskModal
        open={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSaved={() => setShowAddTaskModal(false)}
      />
      {showAddHabitModal && (
        <AddHabitModal
          onClose={() => setShowAddHabitModal(false)}
          onSaved={() => setShowAddHabitModal(false)}
        />
      )}
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

// ── Quest header styles ────────────────────────────────────────────────────────

const questHeaderWrap = 'shrink-0 border-b border-[var(--border)] bg-[oklch(0.74_0.17_85_/_0.03)]';
const questTitleRow = 'flex items-center gap-2 px-[14px] pt-[8px] pb-[6px]';
const questSparkle = 'text-[14px] animate-[spin_4s_linear_infinite]';
const questTitleText =
  'flex-1 [font-family:var(--f-title)] text-[13px] font-bold tracking-[0.08em] text-[var(--text-hi)]';
const questProgressRow = 'flex items-center gap-2.5 px-[14px] pb-[8px]';
const progBarWrap = 'flex-1 flex flex-col gap-[3px]';
const progLabel = 'flex justify-between text-[9px] text-[var(--text-mid)] tracking-[0.06em]';
const progLabelValue = 'text-[var(--mint)] font-bold';
const progTrack =
  'h-[6px] bg-[var(--panel3)] rounded-[4px] overflow-hidden border border-[var(--border)]';
const progFill =
  'h-full rounded-[4px] bg-[linear-gradient(90deg,var(--mint),var(--cyan))] shadow-[0_0_8px_oklch(0.76_0.14_162_/_0.5)] transition-[width] duration-[600ms] ease-[ease]';
const progPctWrap = 'text-center min-w-[34px]';
const progPct = 'font-[var(--font-title)] text-[14px] font-bold text-[var(--mint)]';
const progDone = 'text-[8px] text-[var(--text-mid)] tracking-[0.08em]';
