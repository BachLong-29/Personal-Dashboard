'use client';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import type { TaskColor, TaskStatus, UpdateTaskPayload } from '@/types';

import type { UITask } from '../../data/mock';
import { TaskForm, type TaskFormValues, type TaskFormHandle } from './TaskForm';

/** Format a Date using local timezone — avoids UTC off-by-one for UTC+ users. */
function toLocalDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function tomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

const DEFER_REASON_KEYS = ['tooBusy', 'blocked', 'priorityShift', 'health'] as const;
type DeferReasonKey = (typeof DEFER_REASON_KEYS)[number];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EditTaskModalProps {
  task: UITask | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, payload: UpdateTaskPayload) => void;
  saving?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditTaskModal({ task, open, onClose, onSave, saving }: EditTaskModalProps) {
  const t = useTranslations('tasks');
  const formRef = useRef<TaskFormHandle>(null);
  const [canSave, setCanSave] = useState(false);

  // Defer state — reset whenever task changes (key prop on outer element handles this)
  const [isDeferred, setIsDeferred] = useState(false);
  const [deferChipKey, setDeferChipKey] = useState<DeferReasonKey | null>(null);
  const [deferCustom, setDeferCustom] = useState('');
  const [deferDate, setDeferDate] = useState<Date>(tomorrow);

  if (!task) return null;

  function resetDefer() {
    setIsDeferred(false);
    setDeferChipKey(null);
    setDeferCustom('');
    setDeferDate(tomorrow());
  }

  function handleClose() {
    resetDefer();
    onClose();
  }

  function handleSubmit(values: TaskFormValues) {
    if (!task?.sourceId) return;

    const durationNum = values.duration ? parseInt(values.duration, 10) : NaN;

    const payload: UpdateTaskPayload = {
      name: values.name,
      note: values.note || undefined,
      icon: values.icon,
      tagId: values.tagId,
      color: values.color,
      status: values.status,
      duration: durationNum && !Number.isNaN(durationNum) ? durationNum : undefined,
      startDate: values.startDate ? toLocalDate(values.startDate) : undefined,
      startTime: values.startTime ? values.startTime : task.startTime ? null : undefined,
      endDate: values.endDate ? toLocalDate(values.endDate) : task.endDate ? null : undefined,
      dependencies: values.dependencies,
      attachments: values.attachments,
    };

    if (isDeferred) {
      const reason = deferChipKey
        ? t(`defer.reasons.${deferChipKey}`)
        : deferCustom.trim() || t('defer.checkboxLabel');
      payload.deferReason = reason;
      payload.startDate = toLocalDate(deferDate);
    } else if (task.deferReason) {
      payload.deferReason = null;
    }

    onSave(task.sourceId, payload);
  }

  const defaultValues: Partial<TaskFormValues> = {
    name: task.title,
    note: task.desc ?? '',
    icon: task.icon ?? '',
    tagId: task.tagId ?? '',
    color: (task.color as TaskColor | undefined) ?? 'gold',
    status: (task.status as TaskStatus | undefined) ?? 'todo',
    startDate: task.startDate ? new Date(task.startDate) : null,
    endDate: task.endDate ? new Date(task.endDate) : null,
    startTime: task.startTime ?? '',
    duration: task.est != null ? String(task.est) : '',
    dependencies: task.dependencies ?? [],
    attachments: task.attachments ?? [],
  };

  const isSingleDay = !task.endDate || task.endDate === task.startDate;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Modal open={open} onClose={handleClose} maxWidth="560px">
      <ModalHead
        tag={t('editModal.tag')}
        title={
          <span className="flex items-center gap-2 truncate max-w-[420px]">
            {task.icon && <span className="text-[18px] leading-none shrink-0">{task.icon}</span>}
            <span className="text-[18px] truncate">{task.title}</span>
          </span>
        }
      />
      <ModalBody className="max-h-[calc(78vh-130px)] overflow-y-auto">
        <TaskForm
          ref={formRef}
          key={task.id}
          mode="edit"
          defaultValues={defaultValues}
          editingId={task.sourceId}
          onSubmit={handleSubmit}
          onCanSaveChange={setCanSave}
          saving={saving}
        />

        {/* ── Defer section — single-day tasks only ──────────────────────── */}
        {isSingleDay && (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <Checkbox
              checked={isDeferred}
              onChange={(checked) => {
                setIsDeferred(checked);
                if (!checked) resetDefer();
              }}
            >
              {t('defer.checkboxLabel')}
            </Checkbox>

            {isDeferred && (
              <div className="mt-3 space-y-3">
                {/* Reason chips */}
                <div>
                  <p className="text-[9px] font-bold tracking-[0.1em] text-[var(--text-lo)] uppercase mb-2">
                    {t('defer.reasonLabel')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFER_REASON_KEYS.map((key) => (
                      <Button
                        key={key}
                        type="button"
                        size="sm"
                        variant={deferChipKey === key ? 'primary' : 'ghost'}
                        onClick={() => setDeferChipKey(deferChipKey === key ? null : key)}
                      >
                        {t(`defer.reasons.${key}`)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom reason */}
                <Input
                  value={deferChipKey ? t(`defer.reasons.${deferChipKey}`) : deferCustom}
                  disabled={!!deferChipKey}
                  maxLength={200}
                  placeholder={t('defer.reasonPlaceholder')}
                  onChange={(e) => setDeferCustom(e.target.value)}
                />

                {/* Date picker */}
                <DatePicker
                  label={t('defer.dateLabel')}
                  value={deferDate}
                  onChange={(d) => {
                    if (d >= today) setDeferDate(d);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFoot>
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose} disabled={saving}>
            {t('editModal.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => formRef.current?.submit()}
            disabled={saving || !canSave}
          >
            {saving
              ? t('editModal.saving')
              : isDeferred
                ? t('editModal.reschedule')
                : t('editModal.save')}
          </Button>
        </div>
      </ModalFoot>
    </Modal>
  );
}
