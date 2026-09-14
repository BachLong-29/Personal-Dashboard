'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUpdateScheduleBlock } from '@/features/schedule/hooks/useScheduleBlocks';
import type { PlannerTask } from '@/features/schedule/components/SessionPlanner';

export interface SessionUpdateTarget {
  /** Blocks belonging to the task — carried over so the move needs no refetch. */
  blockIds: string[];
  plannerData: PlannerTask;
  /**
   * False when the sessions are stale for some other reason than the day moving
   * (a duration change, say) — moving them to the same date would be a no-op,
   * so the shortcut is hidden.
   */
  dateMoved: boolean;
}

interface Props {
  /** Null closes the prompt. */
  target: SessionUpdateTarget | null;
  onClose: () => void;
  /** Hand off to the Session Planner for edits the shortcut can't make. */
  onManage: (plannerData: PlannerTask) => void;
}

/**
 * Shown after a task's date or duration changes while it still has scheduled
 * sessions pinned to the old day. Offers the common case — drop them on the new
 * start date — as one tap, with the planner as the fallback.
 */
export function SessionUpdatePrompt({ target, onClose, onManage }: Props) {
  const t = useTranslations('tasks');
  const { mutateAsync: updateBlock, isPending: moving } = useUpdateScheduleBlock();
  const [failed, setFailed] = useState(false);

  function close() {
    setFailed(false);
    onClose();
  }

  async function handleMove() {
    if (!target) return;
    setFailed(false);
    try {
      await Promise.all(
        target.blockIds.map((id) => updateBlock({ id, date: target.plannerData.startDate })),
      );
      close();
    } catch {
      // Stay open so the user can retry or fall back to the planner.
      setFailed(true);
    }
  }

  return (
    <Modal open={target !== null} onClose={close} maxWidth="380px">
      <ModalHead title={`⚡ ${t('editModal.blockWarning.title')}`} />
      <ModalBody>
        <p className="text-[12px] text-[var(--text-hi)] leading-relaxed">
          {t.rich('editModal.blockWarning.message', {
            count: target?.blockIds.length ?? 0,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        {failed && (
          <p className="mt-2 text-[11px] text-[var(--rose)]">
            ✕ {t('editModal.blockWarning.moveFailed')}
          </p>
        )}
      </ModalBody>
      <ModalFoot>
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="ghost"
            onClick={close}
            disabled={moving}
            className="w-full sm:w-auto justify-center"
          >
            {t('overdueReview.later')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const data = target?.plannerData ?? null;
              close();
              if (data) onManage(data);
            }}
            disabled={moving}
            className="w-full sm:w-auto justify-center"
          >
            {t('editModal.manageSchedule')}
          </Button>
          {target?.dateMoved && (
            <Button
              variant="primary"
              onClick={handleMove}
              disabled={moving}
              className="w-full sm:w-auto justify-center"
            >
              {moving
                ? '…'
                : t('editModal.blockWarning.moveToDate', { date: target.plannerData.startDate })}
            </Button>
          )}
        </div>
      </ModalFoot>
    </Modal>
  );
}
