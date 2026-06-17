'use client';

import { useState } from 'react';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';
import type { TaskColor } from '@/types';
import type {
  CreateProjectPayload,
  ProjectDTO,
  ProjectPriority,
  UpdateProjectPayload,
} from '@/types/project';

import { COLOR_CSS, COLOR_OPTIONS, PRIORITY_OPTIONS, PROJECT_ICONS } from '../constants';
import { useCreateProject } from '../hooks/useCreateProject';
import { useUpdateProject } from '../hooks/useUpdateProject';

const DEFAULT_ICON = PROJECT_ICONS[0] ?? '🚀';

interface Props {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal edits this project instead of creating one. */
  project?: ProjectDTO;
  onSaved?: (project: ProjectDTO | undefined) => void;
}

export function ProjectFormModal({ open, onClose, project, onSaved }: Props) {
  const isEdit = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const saving = createProject.isPending || updateProject.isPending;

  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [icon, setIcon] = useState(project?.icon ?? DEFAULT_ICON);
  const [color, setColor] = useState<TaskColor>(project?.color ?? 'gold');
  const [priority, setPriority] = useState<ProjectPriority>(project?.priority ?? 'medium');
  const [deadline, setDeadline] = useState(project?.deadline ?? '');
  const [xp, setXp] = useState(String(project?.xp ?? 0));
  const [coins, setCoins] = useState(String(project?.coins ?? 0));

  const canSave = name.trim().length > 0 && !saving;

  function handleSubmit() {
    if (!canSave) return;
    const base = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon,
      priority,
      xp: parseInt(xp, 10) || 0,
      coins: parseInt(coins, 10) || 0,
    };

    if (project) {
      const payload: UpdateProjectPayload = {
        ...base,
        description: description.trim() || null,
        deadline: deadline || null,
      };
      updateProject.mutate(
        { id: project.id, ...payload },
        {
          onSuccess: (p) => {
            onSaved?.(p);
            onClose();
          },
        },
      );
    } else {
      const payload: CreateProjectPayload = { ...base, deadline: deadline || undefined };
      createProject.mutate(payload, {
        onSuccess: (p) => {
          onSaved?.(p);
          onClose();
        },
      });
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="520px">
      <ModalHead
        tag={isEdit ? 'EDIT PROJECT' : 'NEW PROJECT'}
        title={project ? `✦ ${project.name}` : '＋ Create Project'}
      />
      <ModalBody className="max-h-[calc(80vh-130px)] overflow-y-auto flex flex-col gap-4">
        {/* Name */}
        <Field label="Name">
          <input
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Project name"
            autoFocus
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            className={cn(input, 'min-h-[64px] resize-none')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            placeholder="What is this project about?"
          />
        </Field>

        {/* Icon */}
        <Field label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {PROJECT_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={cn(
                  'w-9 h-9 rounded-[var(--r-sm)] border text-[18px] flex items-center justify-center transition-all',
                  icon === ic
                    ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.12)]'
                    : 'border-[var(--border)] hover:border-[var(--border-hi)]',
                )}
              >
                {ic}
              </button>
            ))}
          </div>
        </Field>

        {/* Color */}
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.label}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-all',
                  color === c.value ? 'scale-110' : 'opacity-60 hover:opacity-100',
                )}
                style={{
                  background: COLOR_CSS[c.value],
                  borderColor: color === c.value ? 'var(--text-hi)' : 'transparent',
                }}
              />
            ))}
          </div>
        </Field>

        {/* Priority */}
        <Field label="Priority">
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-[var(--r-sm)] border text-[11px] font-bold tracking-[0.06em] uppercase transition-all',
                  priority === p.value
                    ? 'border-[var(--gold)] text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)]'
                    : 'border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)]',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Deadline */}
        <Field label="Deadline (optional)">
          <input
            type="date"
            className={input}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Field>

        {/* Rewards */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="XP Reward">
            <input
              type="number"
              min={0}
              className={input}
              value={xp}
              onChange={(e) => setXp(e.target.value)}
            />
          </Field>
          <Field label="Coin Reward">
            <input
              type="number"
              min={0}
              className={input}
              value={coins}
              onChange={(e) => setCoins(e.target.value)}
            />
          </Field>
        </div>
      </ModalBody>
      <ModalFoot>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSave} isLoading={saving}>
          {isEdit ? '✦ Save' : '✦ Create'}
        </Button>
      </ModalFoot>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] [font-family:var(--f-title)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const input =
  'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2 text-[13px] text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none';
