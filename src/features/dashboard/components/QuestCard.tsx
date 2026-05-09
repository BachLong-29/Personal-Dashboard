'use client';

import { useRef } from 'react';

import { QUEST_ICONS } from '../constants';
import type { BurstPos, Quest } from '../types';

interface QuestCardProps {
  quest: Quest;
  onToggle: (id: number, burstPos: BurstPos | null) => void;
  animationsEnabled: boolean;
}

export function QuestCard({ quest, onToggle, animationsEnabled }: QuestCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleCheck(e: React.MouseEvent) {
    e.stopPropagation();
    if (animationsEnabled && !quest.done && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      onToggle(quest.id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    } else {
      onToggle(quest.id, null);
    }
  }

  return (
    <div ref={cardRef} className={`quest-card${quest.done ? ' done' : ''}`} onClick={handleCheck}>
      <div className={`quest-check${quest.done ? ' checked' : ''}`} onClick={handleCheck}>
        {quest.done ? '✓' : ''}
      </div>
      <div className={`quest-icon-wrap type-${quest.type}`}>
        {QUEST_ICONS[quest.type] ?? '📌'}
      </div>
      <div className="quest-info">
        <div className="quest-name">{quest.title}</div>
        <div className="quest-desc">{quest.desc}</div>
      </div>
      <div className="quest-rewards">
        <div className={`diff-badge diff-${quest.difficulty}`}>{quest.difficulty}</div>
        <div className="reward-pill xp">⚡ {quest.xp}</div>
        <div className="reward-pill coin">🪙 {quest.coins}</div>
      </div>
    </div>
  );
}
