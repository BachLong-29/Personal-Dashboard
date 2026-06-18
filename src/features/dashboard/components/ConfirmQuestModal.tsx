'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { useUpdateQuestStatus } from '../hooks/useUpdateQuestStatus';
import type { Quest } from '../types';

interface ConfirmQuestModalProps {
  quest: Quest;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

export function ConfirmQuestModal({ quest, onConfirm, onCancel }: ConfirmQuestModalProps) {
  const t = useTranslations('dashboard');
  const [skipNextPrompt, setSkipNextPrompt] = useState(false);
  const { mutate: updateStatus, isPending, error } = useUpdateQuestStatus();

  function handleConfirm() {
    updateStatus({ id: quest.id, done: true }, { onSuccess: () => onConfirm(skipNextPrompt) });
  }

  return (
    <div className="confirm-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-modal">
        <div className="confirm-icon">✦</div>
        <div className="confirm-tag">◆ Quest Completion ◆</div>
        <div className="confirm-title">Confirm Victory?</div>
        <div className="confirm-quest-name">{quest.title}</div>
        <div className="confirm-msg">
          The System will record this quest as complete and grant you the rewards. This action
          cannot be undone today.
        </div>
        <div className="confirm-rewards">
          <span className="confirm-reward-pill xp">⚡ +{quest.xp} XP</span>
          <span className="confirm-reward-pill coin">🪙 +{quest.coins}</span>
        </div>
        {error && (
          <div
            style={{ color: 'var(--danger)', fontSize: 11, textAlign: 'center', margin: '4px 0' }}
          >
            ✕ Failed to update quest. Please try again.
          </div>
        )}
        <div
          className="confirm-checkbox-row"
          onClick={() => !isPending && setSkipNextPrompt((v) => !v)}
        >
          <span className={`confirm-checkbox${skipNextPrompt ? ' checked' : ''}`}>
            {skipNextPrompt ? '✓' : ''}
          </span>
          <span>Don&apos;t ask again for the rest of the day</span>
        </div>
        <div className="confirm-actions">
          <Button
            type="button"
            variant="ghost"
            className="confirm-btn secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            {t('confirmQuest.buttons.cancel')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="confirm-btn primary"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending
              ? t('confirmQuest.buttons.pending')
              : `✓ ${t('confirmQuest.buttons.confirm')}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
