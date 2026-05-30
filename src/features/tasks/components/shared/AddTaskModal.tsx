'use client';

import { useRef, useState } from 'react';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateTask } from '@/features/dashboard/hooks/useCreateTask';
import type { CreateTaskPayload } from '@/types';

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

export interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** Pre-fill start date (YYYY-MM-DD) */
  defaultDate?: string;
  /** Pre-fill all fields — used when cloning an existing task */
  defaultValues?: Partial<TaskFormValues>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddTaskModal({
  open,
  onClose,
  onSaved,
  defaultDate,
  defaultValues,
}: AddTaskModalProps) {
  const { mutate: createTask, isPending } = useCreateTask();
  const formRef = useRef<TaskFormHandle>(null);
  const [canSave, setCanSave] = useState(false);

  function handleSubmit(values: TaskFormValues) {
    const startDate = values.startDate
      ? toLocalDate(values.startDate)
      : (defaultDate ?? toLocalDate(new Date()));

    const payload: CreateTaskPayload = {
      name: values.name,
      note: values.note || undefined,
      icon: values.icon,
      tagId: values.tagId,
      color: values.color,
      startDate,
      startTime: values.startTime || undefined,
      endDate: values.endDate ? toLocalDate(values.endDate) : undefined,
      duration:
        values.duration && !Number.isNaN(parseInt(values.duration, 10))
          ? parseInt(values.duration, 10)
          : undefined,
      dependencies: values.dependencies,
    };

    createTask(payload, {
      onSuccess: () => {
        onSaved?.();
        onClose();
      },
    });
  }

  const defaultStart =
    defaultValues?.startDate ?? (defaultDate ? new Date(defaultDate) : new Date());

  return (
    <Modal open={open} onClose={onClose} maxWidth="560px">
      <ModalHead tag="NEW QUEST" title="＋ Create Task" />
      <ModalBody className="max-h-[calc(78vh-130px)] overflow-y-auto">
        <TaskForm
          ref={formRef}
          mode="create"
          defaultValues={{ startDate: defaultStart, ...defaultValues }}
          onSubmit={handleSubmit}
          onCanSaveChange={setCanSave}
          saving={isPending}
        />
      </ModalBody>
      <ModalFoot>
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => formRef.current?.submit()}
            disabled={isPending || !canSave}
          >
            {isPending ? '⏳ Saving…' : '✦ Create Task'}
          </Button>
        </div>
      </ModalFoot>
    </Modal>
  );
}
