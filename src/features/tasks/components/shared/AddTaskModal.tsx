'use client';

import { useRef, useState } from 'react';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateTask } from '@/features/dashboard/hooks/useCreateTask';
import { SessionPlanner, type PlannerTask } from '@/features/schedule/components/SessionPlanner';
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
  /** Attach the created task to this project */
  projectId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddTaskModal({
  open,
  onClose,
  onSaved,
  defaultDate,
  defaultValues,
  projectId,
}: AddTaskModalProps) {
  const { mutate: createTask, isPending } = useCreateTask();
  const formRef = useRef<TaskFormHandle>(null);
  const [canSave, setCanSave] = useState(false);
  // Task awaiting session planning (opened after a create that carried an estimate)
  const [plannerTask, setPlannerTask] = useState<PlannerTask | null>(null);

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
      projectId,
      attachments: values.attachments.length > 0 ? values.attachments : undefined,
    };

    createTask(payload, {
      onSuccess: (created) => {
        onSaved?.();
        onClose();
        // Offer session planning when the task carries a time estimate
        if (created?.duration) {
          setPlannerTask({
            id: created.id,
            name: created.name,
            icon: created.icon,
            color: created.color,
            duration: created.duration,
            startDate: created.startDate,
            endDate: created.endDate,
          });
        }
      },
    });
  }

  const defaultStart =
    defaultValues?.startDate ?? (defaultDate ? new Date(defaultDate) : new Date());

  return (
    <>
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

      {/* Session planner — opens after creating a task that has an estimate */}
      <SessionPlanner
        open={plannerTask !== null}
        task={plannerTask}
        onClose={() => setPlannerTask(null)}
      />
    </>
  );
}
