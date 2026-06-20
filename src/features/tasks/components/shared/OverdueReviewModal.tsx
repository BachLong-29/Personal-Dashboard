'use client';

import { useState } from 'react';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useUpdateTask } from '@/features/dashboard/hooks/useUpdateTask';
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

function OverdueRow({ item, onRemove }: { item: OverdueItem; onRemove: (id: string) => void }) {
  const { mutate: updateTask, isPending } = useUpdateTask();
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  function handleDone() {
    updateTask({ id: item.id, status: 'done' }, { onSuccess: () => onRemove(item.id) });
  }

  function handleReschedule() {
    if (!rescheduleDate) return;
    updateTask(
      { id: item.id, startDate: toLocalDate(rescheduleDate), endDate: null },
      { onSuccess: () => onRemove(item.id) },
    );
  }

  function handleAbandon() {
    updateTask({ id: item.id, active: false }, { onSuccess: () => onRemove(item.id) });
  }

  const levelBadge =
    item.overdueLevel === 'critical'
      ? 'bg-[oklch(0.72_0.18_5_/_0.12)] border-[oklch(0.72_0.18_5_/_0.3)] text-[var(--rose)]'
      : 'bg-[oklch(0.74_0.17_85_/_0.1)] border-[oklch(0.74_0.17_85_/_0.3)] text-[var(--gold)]';

  const levelLabel = item.overdueLevel === 'critical' ? '🔴 Critical' : '⚠ Late';

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
            {item.daysOverdue}d overdue
            {item.endDate
              ? ` · due ${item.endDate}`
              : item.startDate
                ? ` · was ${item.startDate}`
                : ''}
          </p>
        </div>
      </div>

      {/* Reschedule date picker — inline */}
      {showReschedule && (
        <div className="flex items-end gap-2 pl-[26px]">
          <div className="flex-1">
            <DatePicker
              label="New date"
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
            {isPending ? '…' : 'Set'}
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
                ↺ Reschedule
              </Button>
              <Button size="sm" variant="primary" onClick={handleDone} disabled={isPending}>
                {isPending ? '…' : '✓ Done'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmAbandon(true)}
                disabled={isPending}
                className="text-[var(--rose)] hover:border-[oklch(0.72_0.18_5_/_0.4)]"
              >
                Abandon
              </Button>
            </>
          ) : (
            <>
              <span className="text-[10px] text-[var(--rose)]">Confirm abandon?</span>
              <Button size="sm" variant="ghost" onClick={handleAbandon} disabled={isPending}>
                {isPending ? '…' : 'Yes, abandon'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmAbandon(false)}
                disabled={isPending}
              >
                Cancel
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
  const allDone = items.length === 0;

  return (
    <Modal open={open} onClose={onDismiss} maxWidth="520px">
      <ModalHead
        tag="OVERDUE"
        title={
          allDone ? (
            'All caught up! ✓'
          ) : (
            <span>
              ⚠ Overdue Quests{' '}
              <span className="text-[var(--text-lo)] font-normal text-[14px]">
                · {items.length} missed
              </span>
            </span>
          )
        }
      />

      <ModalBody className="max-h-[calc(72vh-120px)] overflow-y-auto">
        {allDone ? (
          <p className="text-[12px] text-[var(--text-lo)] text-center py-6">
            No overdue tasks. Keep it up!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <OverdueRow key={item.id} item={item} onRemove={onRemoveItem} />
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFoot>
        <div className="flex items-center justify-between w-full">
          <p className="text-[10px] text-[var(--text-lo)]">
            {allDone ? '' : 'Review each quest to keep your progress on track.'}
          </p>
          <Button variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </ModalFoot>
    </Modal>
  );
}
