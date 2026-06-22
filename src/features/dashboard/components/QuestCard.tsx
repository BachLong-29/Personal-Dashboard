'use client';

import { useRef } from 'react';

import { ProjectBadge } from '@/components/common/ProjectBadge';

import { HABIT_COLORS, QUEST_ICONS } from '../constants';
import type { BurstPos, HabitColor, Quest } from '../types';

interface QuestCardProps {
  quest: Quest;
  onToggle: (id: string, burstPos: BurstPos | null) => void;
  animationsEnabled: boolean;
  onViewDetail?: (quest: Quest) => void;
}

export function QuestCard({ quest, onToggle, animationsEnabled, onViewDetail }: QuestCardProps) {
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

  const icon = quest.habitIcon ?? QUEST_ICONS[quest.type] ?? '📌';
  const habitColorVal = quest.habitColor
    ? HABIT_COLORS[quest.habitColor as HabitColor]?.value
    : undefined;

  return (
    <div ref={cardRef} className={`quest-card${quest.done ? ' done' : ''}`} onClick={handleCheck}>
      <div className={`quest-check${quest.done ? ' checked' : ''}`} onClick={handleCheck}>
        {quest.done ? '✓' : ''}
      </div>
      <div
        className={`quest-icon-wrap type-${quest.type}`}
        style={
          habitColorVal ? { background: `${habitColorVal}20`, color: habitColorVal } : undefined
        }
      >
        {icon}
      </div>
      <div className="quest-info">
        <div className="quest-name">{quest.title}</div>
        <div className="quest-desc">{quest.desc}</div>
        {quest.projectName && (
          <div className="mt-1">
            <ProjectBadge
              name={quest.projectName}
              icon={quest.projectIcon}
              color={quest.projectColor}
            />
          </div>
        )}
      </div>
      <div className="quest-rewards">
        {quest.taskId && (
          <div
            className="diff-badge"
            style={{
              background: habitColorVal ? `${habitColorVal}20` : undefined,
              color: habitColorVal ?? '#67e8f9',
              borderColor: habitColorVal ? `${habitColorVal}50` : undefined,
            }}
          >
            task
          </div>
        )}
        {quest.habitId && (
          <div
            className="diff-badge"
            style={{
              background: habitColorVal ? `${habitColorVal}20` : undefined,
              color: habitColorVal,
              borderColor: habitColorVal ? `${habitColorVal}50` : undefined,
            }}
          >
            habit
          </div>
        )}
        {!quest.taskId && !quest.habitId && (
          <div className={`diff-badge diff-${quest.difficulty}`}>{quest.difficulty}</div>
        )}
        <div className="reward-pill xp">⚡ {quest.xp}</div>
        <div className="reward-pill coin">🪙 {quest.coins}</div>
      </div>
      {onViewDetail && (
        <button
          type="button"
          className="quest-detail-btn"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(quest);
          }}
          title="View details"
          aria-label="View quest details"
        >
          ⊞
        </button>
      )}
    </div>
  );
}
