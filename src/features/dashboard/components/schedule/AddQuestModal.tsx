'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Input, Select, type SelectOption } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { QUEST_ICONS, XP_MAP } from '../../constants';
import { useCreateQuest } from '../../hooks/useCreateQuest';
import type { Difficulty, Quest, QuestType } from '../../types';
import { todayISO } from '@/features/tasks/utils/date.utils';

interface AddQuestModalProps {
  onAdd: (quest: Quest) => void;
  onClose: () => void;
}

const DIFFICULTIES: Difficulty[] = ['S', 'A', 'B', 'C', 'D'];

const TYPE_OPTIONS: SelectOption[] = Object.entries(QUEST_ICONS).map(([k, v]) => ({
  value: k,
  label: `${v} ${k}`,
}));

const DIFF_OPTIONS: SelectOption[] = DIFFICULTIES.map((d) => ({
  value: d,
  label: `${d}-Rank (+${XP_MAP[d] ?? 0} XP)`,
}));

export function AddQuestModal({ onAdd, onClose }: AddQuestModalProps) {
  const t = useTranslations('dashboard');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<QuestType>('focus');
  const [diff, setDiff] = useState<Difficulty>('B');
  const [dueDate, setDueDate] = useState(() => todayISO());

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
        dueDate,
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
    <Modal open onClose={onClose}>
      <ModalHead tag="✦" title={t('addQuest.title')} />
      <ModalBody>
        <div className="modal-field">
          <div className="modal-label">{t('addQuest.fields.questName')}</div>
          <Input
            className="modal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('addQuest.placeholders.title')}
            autoFocus
            disabled={isPending}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="modal-field">
          <div className="modal-label">{t('addQuest.fields.description')}</div>
          <Input
            className="modal-input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={t('addQuest.placeholders.description')}
            disabled={isPending}
          />
        </div>
        <div className="modal-field">
          <div className="modal-label">{t('addQuest.fields.dueDate')}</div>
          <Input
            className="modal-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Select
            label={t('addQuest.fields.type')}
            options={TYPE_OPTIONS}
            value={type}
            onValueChange={(v) => setType(v as QuestType)}
            disabled={isPending}
          />
          <Select
            label={t('addQuest.fields.difficulty')}
            options={DIFF_OPTIONS}
            value={diff}
            onValueChange={(v) => setDiff(v as Difficulty)}
            disabled={isPending}
          />
        </div>
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
            ✕ {t('addQuest.errors.saveFailed')}
          </div>
        )}
      </ModalBody>
      <ModalFoot>
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
      </ModalFoot>
    </Modal>
  );
}
