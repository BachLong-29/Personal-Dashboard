'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui';
import { useCreateQuest } from '../hooks/useCreateQuest';
import { COIN_MAP, QUEST_ICONS, XP_MAP } from '../constants';
import type { Difficulty, Quest, QuestType } from '../types';

interface AddQuestModalProps {
  onAdd: (quest: Quest) => void;
  onClose: () => void;
}

const DIFFICULTIES: Difficulty[] = ['S', 'A', 'B', 'C', 'D'];

export function AddQuestModal({ onAdd, onClose }: AddQuestModalProps) {
  const t = useTranslations('dashboard');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<QuestType>('focus');
  const [diff, setDiff] = useState<Difficulty>('B');

  const { mutate: createQuest, isPending, error } = useCreateQuest();

  function handleAdd() {
    if (!title.trim() || isPending) return;

    createQuest(
      {
        title: title.trim(),
        desc: desc.trim() || undefined,
        type,
        difficulty: diff,
        tags: [type],
      },
      {
        onSuccess: (quest) => {
          onAdd(quest as Quest);
          onClose();
        },
      },
    );
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">
          <span>✦</span> New Quest
        </div>
        <div className="modal-field">
          <div className="modal-label">Quest Name</div>
          <Input
            className="modal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter quest title..."
            autoFocus
            disabled={isPending}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="modal-field">
          <div className="modal-label">Description</div>
          <Input
            className="modal-input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What needs to be done?"
            disabled={isPending}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="modal-field">
            <div className="modal-label">Type</div>
            <select
              className="modal-select"
              value={type}
              disabled={isPending}
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
              disabled={isPending}
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
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
            ✕ Failed to create quest. Please try again.
          </div>
        )}
        <div className="modal-actions">
          <Button
            type="button"
            variant="ghost"
            className="modal-btn cancel"
            onClick={onClose}
            disabled={isPending}
          >
            {t('addQuest.buttons.cancel')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="modal-btn confirm"
            onClick={handleAdd}
            disabled={isPending}
          >
            {isPending ? t('addQuest.buttons.pending') : `${t('addQuest.buttons.confirm')} ✦`}
          </Button>
        </div>
      </div>
    </div>
  );
}
