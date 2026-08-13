'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { cn } from '@/libs/utils';
import type { FinanceGoal, TaskColor } from '@/types';

import { COLOR_CSS, COLOR_OPTIONS, GOAL_ICONS } from '../constants';
import { useCreateGoal } from '../hooks/useCreateGoal';
import { useUpdateGoal } from '../hooks/useUpdateGoal';
import { formatAmountInput, toAmountDigits } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  goal?: FinanceGoal | null;
}

export function GoalFormModal({ open, onClose, goal }: Props) {
  const t = useTranslations('finance');
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isEdit = !!goal;
  const isPending = createGoal.isPending || updateGoal.isPending;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(GOAL_ICONS[0] ?? '🎯');
  const [color, setColor] = useState<TaskColor>('gold');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(goal?.name ?? '');
      setIcon(goal?.icon ?? GOAL_ICONS[0] ?? '🎯');
      setColor((goal?.color as TaskColor) ?? 'gold');
      setTargetAmount(goal ? String(goal.targetAmount) : '');
      setTargetDate(goal?.targetDate ?? '');
    }
  }

  const amountNum = Number(targetAmount);
  const canSave = name.trim().length > 0 && amountNum > 0 && !isPending;

  function handleSubmit() {
    if (!canSave) return;
    const payload = {
      name: name.trim(),
      icon,
      color,
      targetAmount: amountNum,
      targetDate: targetDate || undefined,
    };

    if (goal) {
      updateGoal.mutate(
        { id: goal.id, ...payload, targetDate: targetDate || null },
        { onSuccess: onClose },
      );
      return;
    }
    createGoal.mutate(payload, { onSuccess: onClose });
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="440px">
      <ModalHead
        tag={isEdit ? t('goals.editTag') : t('goals.newTag')}
        title={(isEdit ? '✎ ' : '＋ ') + (isEdit ? t('goals.editTitle') : t('goals.newTitle'))}
      />
      <ModalBody className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('goals.name')}</span>
          <input
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder={t('goals.namePlaceholder')}
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('goals.targetAmount')}</span>
          <input
            type="text"
            inputMode="numeric"
            className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[18px] font-bold tabular-nums text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none"
            value={formatAmountInput(targetAmount)}
            onChange={(e) => setTargetAmount(toAmountDigits(e.target.value))}
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('goals.targetDate')}</span>
          <input
            type="date"
            className={input}
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
          <span className="text-[11px] text-[var(--text-mid)]">{t('goals.noTargetDate')}</span>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('goals.icon')}</span>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-[var(--r-sm)] border text-[18px] transition-all',
                  icon === ic
                    ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.12)]'
                    : 'border-[var(--border)] hover:border-[var(--border-hi)]',
                )}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('goals.color')}</span>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.label}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-all',
                  color === c.value ? 'scale-110' : 'opacity-60 hover:opacity-100',
                )}
                style={{
                  background: COLOR_CSS[c.value],
                  borderColor: color === c.value ? 'var(--text-hi)' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFoot>
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSave} isLoading={isPending}>
          ✦ {isEdit ? t('common.save') : t('common.create')}
        </Button>
      </ModalFoot>
    </Modal>
  );
}

const fieldLabel =
  'text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--text-mid)] [font-family:var(--f-title)]';
const input =
  'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2 text-[13px] text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none';
