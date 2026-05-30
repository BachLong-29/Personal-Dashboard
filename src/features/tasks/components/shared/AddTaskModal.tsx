'use client';

import { Modal, ModalHead, ModalBody } from '@/components/ui/Modal';
import { useCreateTask } from '@/features/dashboard/hooks/useCreateTask';
import type { CreateTaskPayload } from '@/types';

import type { UITask } from '../../data/mock';
import { TaskForm, type TaskFormValues } from './TaskForm';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** Pre-fill start date (YYYY-MM-DD) */
  defaultDate?: string;
  allTasks?: UITask[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddTaskModal({
  open,
  onClose,
  onSaved,
  defaultDate,
  allTasks = [],
}: AddTaskModalProps) {
  const { mutate: createTask, isPending } = useCreateTask();

  function handleSubmit(values: TaskFormValues) {
    const startDate = values.startDate
      ? (values.startDate.toISOString().split('T')[0] ?? '')
      : (defaultDate ?? new Date().toISOString().split('T')[0] ?? '');

    const payload: CreateTaskPayload = {
      name: values.name,
      note: values.note || undefined,
      icon: values.icon,
      tagId: values.tagId,
      color: values.color,
      startDate,
      startTime: values.startTime || undefined,
      endDate: values.endDate ? values.endDate.toISOString().split('T')[0] : undefined,
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

  const defaultStart = defaultDate ? new Date(defaultDate) : new Date();

  return (
    <Modal open={open} onClose={onClose} maxWidth="560px">
      <ModalHead tag="NEW QUEST" title="＋ Create Task" />
      <ModalBody className="max-h-[78vh] overflow-y-auto">
        <TaskForm
          key={defaultDate ?? 'add'}
          mode="create"
          defaultValues={{ startDate: defaultStart }}
          allTasks={allTasks}
          onSubmit={handleSubmit}
          onCancel={onClose}
          saving={isPending}
        />
      </ModalBody>
    </Modal>
  );
}
