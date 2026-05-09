'use client';

import { useState } from 'react';

import { COIN_MAP, QUEST_ICONS, XP_MAP } from '../constants';
import type { Difficulty, Quest, QuestType } from '../types';

interface AddQuestModalProps {
  onAdd: (quest: Quest) => void;
  onClose: () => void;
}

const DIFFICULTIES: Difficulty[] = ['S', 'A', 'B', 'C', 'D'];

export function AddQuestModal({ onAdd, onClose }: AddQuestModalProps) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<QuestType>('focus');
  const [diff, setDiff] = useState<Difficulty>('B');

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      desc: desc.trim() || 'Complete this quest',
      type,
      difficulty: diff,
      xp: XP_MAP[diff],
      coins: COIN_MAP[diff],
      done: false,
      id: Date.now(),
      tags: [type],
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">
          <span>✦</span> New Quest
        </div>
        <div className="modal-field">
          <div className="modal-label">Quest Name</div>
          <input
            className="modal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter quest title..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="modal-field">
          <div className="modal-label">Description</div>
          <input
            className="modal-input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What needs to be done?"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="modal-field">
            <div className="modal-label">Type</div>
            <select
              className="modal-select"
              value={type}
              onChange={(e) => setType(e.target.value as QuestType)}
            >
              {Object.entries(QUEST_ICONS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v} {k}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <div className="modal-label">Difficulty</div>
            <select
              className="modal-select"
              value={diff}
              onChange={(e) => setDiff(e.target.value as Difficulty)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}-Rank (+{XP_MAP[d]} XP)
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn confirm" onClick={handleAdd}>
            Add Quest ✦
          </button>
        </div>
      </div>
    </div>
  );
}
