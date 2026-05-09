'use client';

import { useState } from 'react';

import type { BurstPos, Quest } from '../types';
import { AddQuestModal } from './AddQuestModal';
import { QuestCard } from './QuestCard';

interface QuestPanelProps {
  quests: Quest[];
  onToggle: (id: number, burstPos: BurstPos | null) => void;
  onAddQuest: (quest: Quest) => void;
  animationsEnabled: boolean;
}

export function QuestPanel({ quests, onToggle, onAddQuest, animationsEnabled }: QuestPanelProps) {
  const [showModal, setShowModal] = useState(false);

  const done = quests.filter((q) => q.done).length;
  const pct = quests.length ? Math.round((done / quests.length) * 100) : 0;

  return (
    <div className="quest-panel panel panel-gold" style={{ position: 'relative' }}>
      <div className="corner-tl" />
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="corner-br" />
      <div className="quest-subheader">
        <div className="quest-title-group">
          <span className="quest-sparkle">✦</span>
          <span className="quest-main-title">{`Today\'s Quests`}</span>
        </div>
        <button className="quest-add-btn" onClick={() => setShowModal(true)}>
          <span>+</span> New Quest
        </button>
      </div>
      <div className="progress-mini">
        <div className="prog-bar-wrap">
          <div className="prog-label">
            <span>Daily Progress</span>
            <span>
              {done}/{quests.length} Complete
            </span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 38 }}>
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--mint)',
            }}
          >
            {pct}%
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-mid)', letterSpacing: '0.08em' }}>DONE</div>
        </div>
      </div>
      <div className="quest-list">
        {quests.map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            onToggle={onToggle}
            animationsEnabled={animationsEnabled}
          />
        ))}
        {quests.length === 0 && (
          <div
            style={{
              color: 'var(--text-lo)',
              textAlign: 'center',
              padding: '30px 0',
              fontSize: 12,
            }}
          >
            ◆ No quests yet. Add one above! ◆
          </div>
        )}
      </div>
      {showModal && <AddQuestModal onAdd={onAddQuest} onClose={() => setShowModal(false)} />}
    </div>
  );
}
