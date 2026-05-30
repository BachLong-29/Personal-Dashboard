'use client';

import { useRef, useState } from 'react';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
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
  const formRef = useRef<TaskFormHandle>(null);
  const [canSave, setCanSave] = useState(false);

  if (!task) return null;

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
    };

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
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="560px">
      <ModalHead
        tag="EDIT QUEST"
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
      </ModalBody>
      <ModalFoot>
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => formRef.current?.submit()}
            disabled={saving || !canSave}
          >
            {saving ? '⏳ Saving…' : '✦ Save Changes'}
          </Button>
        </div>
      </ModalFoot>
    </Modal>
  );
}
