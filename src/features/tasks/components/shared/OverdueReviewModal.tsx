'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useUpdateTask } from '@/features/dashboard/hooks/useUpdateTask';
import { SessionPlanner, type PlannerTask } from '@/features/schedule/components/SessionPlanner';
import { useTaskBlocks } from '@/features/schedule/hooks/useScheduleBlocks';
import { cn } from '@/libs/utils';

import type { OverdueItem } from '../../hooks/useOverdueReview';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  items: OverdueItem[];
  onRemoveItem: (taskId: string) => void;
  onDismiss: () => void;
}

// ─── Row component ────────────────────────────────────────────────────────────

interface OverdueRowProps {
  item: OverdueItem;
  onRemove: (id: string) => void;
  /** Fires after a successful reschedule when the task already has scheduled
   * sessions, so the caller can prompt the user to go update them. */
  onNeedsScheduleUpdate: (plannerTask: PlannerTask, blockCount: number) => void;
}

function OverdueRow({ item, onRemove, onNeedsScheduleUpdate }: OverdueRowProps) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const { mutate: updateTask, isPending } = useUpdateTask();
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  // Existing scheduled sessions for this task — if any, moving the due date
  // leaves them pointing at the old date, so the user needs to update them too.
  const { data: blocks = [] } = useTaskBlocks(item.id);

  function handleDone() {
    updateTask({ id: item.id, status: 'done' }, { onSuccess: () => onRemove(item.id) });
  }

  function handleReschedule() {
    if (!rescheduleDate) return;
    const newStartDate = toLocalDate(rescheduleDate);
    updateTask(
      { id: item.id, startDate: newStartDate, endDate: null },
      {
        onSuccess: () => {
          onRemove(item.id);
          if (blocks.length > 0) {
            onNeedsScheduleUpdate(
              {
                id: item.id,
                name: item.name,
                icon: item.icon,
                color: item.color,
                duration: item.duration,
                startDate: newStartDate,
              },
              blocks.length,
            );
          }
        },
      },
    );
  }

  function handleAbandon() {
    updateTask({ id: item.id, active: false }, { onSuccess: () => onRemove(item.id) });
  }

  const levelBadge =
    item.overdueLevel === 'critical'
      ? 'bg-[oklch(0.72_0.18_5_/_0.12)] border-[oklch(0.72_0.18_5_/_0.3)] text-[var(--rose)]'
      : 'bg-[oklch(0.74_0.17_85_/_0.1)] border-[oklch(0.74_0.17_85_/_0.3)] text-[var(--gold)]';

  const levelLabel =
    item.overdueLevel === 'critical'
      ? t('overdueReview.levelCritical')
      : t('overdueReview.levelLate');

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-3 rounded-[var(--r-md)] border transition-all',
        item.overdueLevel === 'critical'
          ? 'border-[oklch(0.72_0.18_5_/_0.2)] bg-[oklch(0.72_0.18_5_/_0.04)]'
          : 'border-[var(--border)] bg-[var(--bg-2)]',
      )}
    >
      {/* Task info row */}
      <div className="flex items-start gap-2">
        <span className="text-[18px] leading-none shrink-0 mt-0.5">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="text-[12px] font-semibold text-[var(--text-hi)] truncate">
              {item.name}
            </span>
            <span
              className={cn(
                'text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-[0.06em] font-[var(--font-title)] shrink-0',
                item.overdueLevel === 'critical' ? 'animate-pulse' : '',
                levelBadge,
              )}
            >
              {levelLabel}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-lo)]">
            {t('overdueReview.daysOverdue', { count: item.daysOverdue })}
            {item.endDate
              ? ` ${t('overdueReview.dueDate', { date: item.endDate })}`
              : item.startDate
                ? ` ${t('overdueReview.wasDate', { date: item.startDate })}`
                : ''}
          </p>
        </div>
      </div>

      {/* Reschedule date picker — inline */}
      {showReschedule && (
        <div className="flex items-end gap-2 pl-[26px]">
          <div className="flex-1">
            <DatePicker
              label={t('overdueReview.newDate')}
              value={rescheduleDate}
              onChange={setRescheduleDate}
              onClear={() => setRescheduleDate(null)}
            />
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={handleReschedule}
            disabled={!rescheduleDate || isPending}
          >
            {isPending ? '…' : t('overdueReview.set')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowReschedule(false);
              setRescheduleDate(null);
            }}
            disabled={isPending}
          >
            ✕
          </Button>
        </div>
      )}

      {/* Action buttons */}
      {!showReschedule && (
        <div className="flex items-center gap-2 pl-[26px]">
          {!confirmAbandon ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowReschedule(true)}
                disabled={isPending}
              >
                ↺ {t('editModal.reschedule')}
              </Button>
              <Button size="sm" variant="primary" onClick={handleDone} disabled={isPending}>
                {isPending ? '…' : t('overdueReview.doneAction')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmAbandon(true)}
                disabled={isPending}
                className="text-[var(--rose)] hover:border-[oklch(0.72_0.18_5_/_0.4)]"
              >
                {t('overdueReview.abandon')}
              </Button>
            </>
          ) : (
            <>
              <span className="text-[10px] text-[var(--rose)]">
                {t('overdueReview.confirmAbandon')}
              </span>
              <Button size="sm" variant="ghost" onClick={handleAbandon} disabled={isPending}>
                {isPending ? '…' : t('overdueReview.yesAbandon')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmAbandon(false)}
                disabled={isPending}
              >
                {tCommon('cancel')}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function OverdueReviewModal({ open, items, onRemoveItem, onDismiss }: Props) {
  const t = useTranslations('tasks');
  const allDone = items.length === 0;

  // Post-reschedule prompt — lives on the parent (not OverdueRow) so it
  // survives the row being removed/unmounted when the item is rescheduled.
  const [blockWarning, setBlockWarning] = useState<{
    blockCount: number;
    plannerData: PlannerTask;
  } | null>(null);
  const [plannerTask, setPlannerTask] = useState<PlannerTask | null>(null);

  return (
    <>
      <Modal open={open} onClose={onDismiss} maxWidth="520px">
        <ModalHead
          tag="OVERDUE"
          title={
            allDone ? (
              t('overdueReview.allCaughtUp')
            ) : (
              <span>
                ⚠ {t('overdueReview.title')}{' '}
                <span className="text-[var(--text-lo)] font-normal text-[14px]">
                  {t('overdueReview.missedCount', { count: items.length })}
                </span>
              </span>
            )
          }
        />

        <ModalBody className="max-h-[calc(72vh-120px)] overflow-y-auto">
          {allDone ? (
            <p className="text-[12px] text-[var(--text-lo)] text-center py-6">
              {t('overdueReview.empty')}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <OverdueRow
                  key={item.id}
                  item={item}
                  onRemove={onRemoveItem}
                  onNeedsScheduleUpdate={(plannerData, blockCount) =>
                    setBlockWarning({ blockCount, plannerData })
                  }
                />
              ))}
            </div>
          )}
        </ModalBody>

        <ModalFoot>
          <div className="flex items-center justify-between w-full">
            <p className="text-[10px] text-[var(--text-lo)]">
              {allDone ? '' : t('overdueReview.reviewHint')}
            </p>
            <Button variant="ghost" onClick={onDismiss}>
              {t('overdueReview.dismiss')}
            </Button>
          </div>
        </ModalFoot>
      </Modal>

      {/* Post-reschedule — nudge the user to update the task's existing sessions */}
      <Modal open={blockWarning !== null} onClose={() => setBlockWarning(null)} maxWidth="380px">
        <ModalHead title={`⚡ ${t('editModal.blockWarning.title')}`} />
        <ModalBody>
          <p className="text-[12px] text-[var(--text-hi)] leading-relaxed">
            {t.rich('editModal.blockWarning.message', {
              count: blockWarning?.blockCount ?? 0,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </ModalBody>
        <ModalFoot>
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setBlockWarning(null)}>
              {t('overdueReview.later')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const data = blockWarning?.plannerData ?? null;
                setBlockWarning(null);
                if (data) setPlannerTask(data);
              }}
            >
              {t('editModal.manageSchedule')}
            </Button>
          </div>
        </ModalFoot>
      </Modal>

      <SessionPlanner
        open={plannerTask !== null}
        task={plannerTask}
        onClose={() => setPlannerTask(null)}
      />
    </>
  );
}
