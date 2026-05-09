'use client';

import { useState } from 'react';

import type { Quest } from '../types';

interface ConfirmQuestModalProps {
  quest: Quest;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

export function ConfirmQuestModal({ quest, onConfirm, onCancel }: ConfirmQuestModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
        <div className="confirm-checkbox-row" onClick={() => setDontShowAgain((v) => !v)}>
          <span className={`confirm-checkbox${dontShowAgain ? ' checked' : ''}`}>
            {dontShowAgain ? '✓' : ''}
          </span>
          <span>Don&apos;t ask again for the rest of the day</span>
        </div>
        <div className="confirm-actions">
          <button className="confirm-btn secondary" onClick={onCancel}>
            Not Yet
          </button>
          <button className="confirm-btn primary" onClick={() => onConfirm(dontShowAgain)}>
            ✓ Claim Reward
          </button>
        </div>
      </div>
    </div>
  );
}
