'use client';

import type { Quest } from '../types';

interface PenaltyModalProps {
  unfinished: Quest[];
  tier: number;
  onComplete: () => void;
  onFail: () => void;
}

interface PenaltyFailureModalProps {
  tier: number;
  onContinue: () => void;
}

export function PenaltyModal({ unfinished, tier, onComplete, onFail }: PenaltyModalProps) {
  return (
    <div className="confirm-backdrop">
      <div className="confirm-modal">
        <div className="confirm-icon" style={{ color: 'var(--rose)' }}>
          ⚠
        </div>
        <div className="confirm-tag">◆ End of Day — Tier {tier} ◆</div>
        <div className="confirm-title">Unfinished Quests</div>
        <div className="confirm-msg">
          You have {unfinished.length} unfinished quest{unfinished.length > 1 ? 's' : ''}. Complete
          them now or face consequences.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '8px 0' }}>
          {unfinished.map((q) => (
            <div key={q.id} style={{ fontSize: 11, color: 'var(--text-mid)' }}>
              • {q.title}
            </div>
          ))}
        </div>
        <div className="confirm-actions">
          <button className="confirm-btn secondary" onClick={onFail}>
            ✗ Accept Penalty
          </button>
          <button className="confirm-btn primary" onClick={onComplete}>
            ✓ Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}

export function PenaltyFailureModal({ tier, onContinue }: PenaltyFailureModalProps) {
  return (
    <div className="confirm-backdrop">
      <div className="confirm-modal">
        <div className="confirm-icon" style={{ color: 'var(--rose)' }}>
          💀
        </div>
        <div className="confirm-tag">◆ Penalty Applied ◆</div>
        <div className="confirm-title">Consequences Dealt</div>
        <div className="confirm-msg">
          {`Tier ${tier} penalty has been applied. Your stats have been reduced.
          Don\'t let this happen again, hunter.`}
        </div>
        <div className="confirm-actions">
          <button className="confirm-btn primary" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
