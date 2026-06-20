'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { cn } from '@/libs/utils';
import type { Category, TaskColor, TaskStatus } from '@/types';
import { useCategories } from '@/features/dashboard/hooks/useCategories';
import { useCreateCategory } from '@/features/dashboard/hooks/useCreateCategory';
import { useTaskSearch } from '@/features/dashboard/hooks/useTaskSearch';
import { useProjects } from '@/features/projects/hooks/useProjects';

import { SLOTS } from '../../data/mock';
import { TaskAttachmentsField } from './TaskAttachmentsField';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskFormValues {
  name: string;
  note: string;
  icon: string;
  tagId: string;
  color: TaskColor;
  status: TaskStatus;
  startDate: Date | null;
  endDate: Date | null;
  /** 'HH:MM' or empty string */
  startTime: string;
  /** minutes as numeric string, or empty */
  duration: string;
  /** array of sourceIds */
  dependencies: string[];
  attachments: string[];
  /** Project ObjectId this task belongs to — empty string = none */
  projectId: string;
}

export interface TaskFormHandle {
  submit: () => void;
}

export interface TaskFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<TaskFormValues>;
  /** sourceId of the task being edited — excluded from dependency options */
  editingId?: string;
  /** Hide the project picker — used when the modal is already scoped to a project */
  hideProject?: boolean;
  onSubmit: (values: TaskFormValues) => void;
  /** Called whenever canSave changes so the parent can control the submit button */
  onCanSaveChange?: (canSave: boolean) => void;
  saving?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS: { value: TaskColor; label: string; css: string }[] = [
  { value: 'gold', label: 'Gold', css: 'oklch(0.74 0.17 85)' },
  { value: 'mint', label: 'Mint', css: 'oklch(0.76 0.14 162)' },
  { value: 'violet', label: 'Violet', css: 'oklch(0.66 0.22 295)' },
  { value: 'cyan', label: 'Cyan', css: 'oklch(0.76 0.16 205)' },
  { value: 'rose', label: 'Rose', css: 'oklch(0.72 0.18 5)' },
  { value: 'amber', label: 'Amber', css: 'oklch(0.76 0.16 55)' },
  { value: 'blue', label: 'Blue', css: 'oklch(0.65 0.18 250)' },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: '○  To Do' },
  { value: 'in_progress', label: '◈  In Progress' },
  { value: 'pending', label: '⏳  Pending' },
  { value: 'waiting', label: '◷  Waiting' },
  { value: 'done', label: '✓  Done' },
];

// ─── Slot helper ──────────────────────────────────────────────────────────────

function getSlotForTime(time: string) {
  if (!time) return null;
  const h = parseInt(time.split(':')[0] ?? '0', 10);
  const id = h < 10 ? 'morning' : h < 13 ? 'deep' : h < 17 ? 'afternoon' : 'evening';
  return SLOTS.find((s) => s.id === id) ?? null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TaskForm = forwardRef<TaskFormHandle, TaskFormProps>(function TaskForm(
  { mode, defaultValues, editingId, hideProject, onSubmit, onCanSaveChange, saving },
  ref,
) {
  // ── Form state ───────────────────────────────────────────────────────────────
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [note, setNote] = useState(defaultValues?.note ?? '');
  const [icon, setIcon] = useState(defaultValues?.icon ?? '');
  const [tagId, setTagId] = useState(defaultValues?.tagId ?? '');
  const [color, setColor] = useState<TaskColor>(defaultValues?.color ?? 'gold');
  const [status, setStatus] = useState<TaskStatus>(defaultValues?.status ?? 'todo');
  const [startDate, setStartDate] = useState<Date | null>(defaultValues?.startDate ?? new Date());
  const [endDate, setEndDate] = useState<Date | null>(defaultValues?.endDate ?? null);
  const [startTime, setStartTime] = useState(defaultValues?.startTime ?? '');
  const [duration, setDuration] = useState(defaultValues?.duration ?? '');
  const [deps, setDeps] = useState<string[]>(defaultValues?.dependencies ?? []);
  const [attachments, setAttachments] = useState<string[]>(defaultValues?.attachments ?? []);
  const [projectId, setProjectId] = useState(defaultValues?.projectId ?? '');

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [showPicker, setShowPicker] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [depQuery, setDepQuery] = useState('');

  // ── Data hooks ───────────────────────────────────────────────────────────────
  const { data: categories = [] } = useCategories();
  const { mutate: createCategory, isPending: isAddingCat } = useCreateCategory();
  const { data: depResults = [] } = useTaskSearch(depQuery, 10, editingId);
  const { data: projects = [] } = useProjects('active');

  // ── Derived ──────────────────────────────────────────────────────────────────
  const resolvedTagId = tagId || (categories.length > 0 ? (categories[0] as Category).id : '');

  const dateError =
    startDate && endDate && endDate.getTime() < startDate.getTime()
      ? 'End date must be on or after start date.'
      : '';

  const durationNum = duration ? parseInt(duration, 10) : NaN;
  const durationHint =
    !Number.isNaN(durationNum) && durationNum > 0
      ? `≈ ${Math.floor(durationNum / 60) > 0 ? `${Math.floor(durationNum / 60)}h ` : ''}${durationNum % 60}m`
      : '';

  const slotMeta = getSlotForTime(startTime);

  const canSave = name.trim().length > 0 && !!icon && !!resolvedTagId && !dateError;

  const visibleDepIds = new Set(depResults.map((t) => t.id));
  const hiddenSelectedCount = deps.filter((id) => !visibleDepIds.has(id)).length;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function toggleDep(id: string) {
    setDeps((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  function handleAddCategory() {
    const trimmed = newCatName.trim();
    if (!trimmed || isAddingCat) return;
    createCategory(
      { name: trimmed },
      {
        onSuccess: (cat) => {
          setTagId((cat as Category).id);
          setNewCatName('');
          setShowAddCat(false);
        },
      },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEmojiSelect(emoji: any) {
    setIcon(emoji.native as string);
    setShowPicker(false);
  }

  function handleSubmit() {
    if (!canSave || saving) return;
    onSubmit({
      name: name.trim(),
      note: note.trim(),
      icon,
      tagId: resolvedTagId,
      color,
      status,
      startDate,
      endDate,
      startTime,
      duration,
      dependencies: deps,
      attachments,
      projectId,
    });
  }

  // ── Expose submit handle + notify parent of canSave ──────────────────────────
  const submitRef = useRef(handleSubmit);
  submitRef.current = handleSubmit;
  useImperativeHandle(ref, () => ({ submit: () => submitRef.current() }));

  const onCanSaveChangeRef = useRef(onCanSaveChange);
  onCanSaveChangeRef.current = onCanSaveChange;
  useEffect(() => {
    onCanSaveChangeRef.current?.(canSave);
  }, [canSave]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* ── Icon ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>
          Icon <span className={requiredMark}>*</span>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className={cn(
              iconBtn,
              showPicker && 'border-[var(--gold)] shadow-[0_0_10px_oklch(0.74_0.17_85_/_0.3)]',
              icon && 'border-[oklch(0.74_0.17_85_/_0.5)]',
            )}
            title="Pick emoji"
          >
            {icon ? (
              <span className="text-[22px] leading-none">{icon}</span>
            ) : (
              <span className="text-[10px] text-[var(--text-lo)]">Pick</span>
            )}
          </button>
          {icon && (
            <button
              type="button"
              onClick={() => setIcon('')}
              className="text-[10px] text-[var(--text-lo)] hover:text-[var(--rose)] transition-colors cursor-pointer"
            >
              ✕ clear
            </button>
          )}
        </div>
        {showPicker && (
          <div className="mt-2 relative z-50">
            <Picker
              data={data}
              theme="dark"
              previewPosition="none"
              skinTonePosition="none"
              perLine={10}
              onEmojiSelect={handleEmojiSelect}
            />
          </div>
        )}
      </div>

      {/* ── Name ──────────────────────────────────────────────────────── */}
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Quest title…"
        onKeyDown={(e) => e.key === 'Enter' && canSave && handleSubmit()}
      />

      {/* ── Status (edit mode only) ────────────────────────────────────── */}
      {mode === 'edit' && (
        <Select
          label="Status"
          value={status}
          onValueChange={(v) => setStatus(v as TaskStatus)}
          options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
        />
      )}

      {/* ── Dates ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <DatePicker
          label="Start date"
          value={startDate}
          onChange={setStartDate}
          onClear={() => setStartDate(null)}
        />
        <DatePicker
          label="End date"
          value={endDate}
          onChange={setEndDate}
          onClear={() => setEndDate(null)}
          placeholder="Same as start"
        />
      </div>
      {dateError && <p className="text-[10px] text-[var(--rose)] -mt-2">{dateError}</p>}

      {/* ── Start Time + Slot badge ────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>
          Start Time <span className={optionalMark}>optional</span>
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={timeInputCls}
            />
            {startTime && (
              <button
                type="button"
                onClick={() => setStartTime('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-lo)] hover:text-[var(--rose)] transition-colors cursor-pointer leading-none"
                title="Clear time"
              >
                ✕
              </button>
            )}
          </div>

          {startTime && slotMeta && (
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold font-[var(--font-title)] tracking-[0.08em] shrink-0"
              style={{
                borderColor: slotMeta.color.replace(')', ' / 0.4)'),
                color: slotMeta.color,
                background: slotMeta.bg,
              }}
            >
              {slotMeta.glyph} {slotMeta.label}
              <span className="font-normal opacity-70 ml-0.5">({slotMeta.time})</span>
            </span>
          )}

          {!startTime && (
            <span className="text-[10px] text-[var(--text-lo)] italic">
              Slot assigned automatically after drag
            </span>
          )}
        </div>
      </div>

      {/* ── Duration ──────────────────────────────────────────────────── */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Duration (min)"
            type="number"
            min={1}
            max={1440}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="60"
          />
        </div>
        {durationHint && (
          <span className="text-[11px] text-[var(--text-lo)] pb-2.5 shrink-0">{durationHint}</span>
        )}
      </div>

      {/* ── Category ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className={fieldLabel}>
            Category <span className={requiredMark}>*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowAddCat((v) => !v)}
            className="text-[9px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] text-[var(--text-lo)] hover:text-[var(--gold)] transition-colors cursor-pointer"
          >
            {showAddCat ? '✕ Cancel' : '+ New'}
          </button>
        </div>

        {showAddCat && (
          <div className="flex gap-2 mb-1">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory();
                if (e.key === 'Escape') setShowAddCat(false);
              }}
              autoFocus
            />
            <Button variant="primary" size="sm" onClick={handleAddCategory} disabled={isAddingCat}>
              {isAddingCat ? '…' : 'Add'}
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setTagId(cat.id)}
              className={cn(catChip, resolvedTagId === cat.id && catChipActive)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Project ───────────────────────────────────────────────────── */}
      {!hideProject && (
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel}>
            Project <span className={optionalMark}>optional</span>
          </label>
          {projects.length === 0 ? (
            <p className="text-[10px] text-[var(--text-lo)]">
              No projects yet — create one in the Projects page to group tasks.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto">
              <button
                type="button"
                onClick={() => setProjectId('')}
                className={cn(catChip, projectId === '' && catChipActive)}
              >
                None
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProjectId(p.id)}
                  className={cn(catChip, projectId === p.id && catChipActive)}
                  title={p.name}
                >
                  <span className="mr-1">{p.icon}</span>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Color ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <span className={fieldLabel}>Color</span>
        <div className="flex items-center gap-2.5">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setColor(c.value)}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-all duration-150',
                color === c.value
                  ? 'border-white scale-[1.2] shadow-[0_0_10px_oklch(0.74_0.17_85_/_0.5)]'
                  : 'border-transparent opacity-50 hover:opacity-90 hover:scale-105',
              )}
              style={{ background: c.css }}
            />
          ))}
        </div>
      </div>

      {/* ── Note ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>
          Note <span className={optionalMark}>optional</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Optional description…"
          className={textareaClass}
        />
      </div>

      {/* ── Attachments ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>
          Attachments <span className={optionalMark}>optional · max 3</span>
        </label>
        <TaskAttachmentsField value={attachments} onChange={setAttachments} />
      </div>

      {/* ── Dependencies ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>
          Dependencies <span className={optionalMark}>optional</span>
        </label>
        <p className="text-[10px] text-[var(--text-lo)] -mt-0.5">
          This task will be blocked until all selected tasks are done.
        </p>
        <input
          type="text"
          value={depQuery}
          onChange={(e) => setDepQuery(e.target.value)}
          placeholder="Search tasks…"
          className={depSearchInput}
        />
        {depResults.length === 0 ? (
          <p className="text-[10px] text-[var(--text-lo)] text-center py-2">No tasks found.</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-[130px] overflow-y-auto">
            {depResults.map((t) => (
              <label key={t.id} className={depRow}>
                <input
                  type="checkbox"
                  checked={deps.includes(t.id)}
                  onChange={() => toggleDep(t.id)}
                  className="accent-[var(--gold)] w-3 h-3 cursor-pointer shrink-0"
                />
                <span className="text-[14px] shrink-0">{t.icon}</span>
                <span className="text-[11px] text-[var(--text-hi)] flex-1 truncate">{t.name}</span>
                <span className="text-[10px] text-[var(--text-lo)] shrink-0">{t.startDate}</span>
              </label>
            ))}
          </div>
        )}
        {hiddenSelectedCount > 0 && (
          <p className="text-[10px] text-[var(--text-lo)]">
            ✓ {hiddenSelectedCount} more selected (search to view)
          </p>
        )}
      </div>
    </div>
  );
});

// ─── Style constants ──────────────────────────────────────────────────────────

const fieldLabel =
  'block text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--text-md)] font-[var(--font-title)]';
const requiredMark = 'text-[var(--rose)]';
const optionalMark =
  'normal-case tracking-normal font-normal text-[var(--text-lo)] ml-1 text-[10px]';

const iconBtn = cn(
  'w-11 h-11 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-2)]',
  'flex items-center justify-center cursor-pointer transition-all duration-150',
  'hover:border-[var(--border-hi)] hover:bg-[var(--bg-3)]',
);

const timeInputCls = cn(
  'rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-2)]',
  'px-3 py-2 pr-8 text-[13px] text-[var(--text-hi)] min-w-[130px]',
  'hover:border-[var(--border-hi)] hover:bg-[var(--bg-3)]',
  'focus:border-[var(--gold)] focus:outline-none',
  'focus:shadow-[0_0_0_3px_oklch(0.78_0.16_82_/_0.15)]',
  'transition-all duration-[180ms] [color-scheme:dark]',
);

const textareaClass = cn(
  'w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-2)]',
  'px-4 py-2.5 text-[13px] text-[var(--text-hi)] placeholder:text-[var(--text-dim)]',
  'hover:border-[var(--border-hi)] hover:bg-[var(--bg-3)]',
  'focus:border-[var(--gold)] focus:outline-none',
  'focus:shadow-[0_0_0_3px_oklch(0.78_0.16_82_/_0.15)]',
  'resize-none transition-all duration-[180ms]',
);

const catChip = cn(
  'px-2.5 py-1 rounded-full border border-[var(--border)] text-[10px] font-medium',
  'text-[var(--text-md)] bg-[var(--bg-2)] cursor-pointer transition-all',
  'hover:border-[var(--gold)] hover:text-[var(--text-hi)]',
);
const catChipActive = cn(
  'border-[var(--gold)] text-[var(--gold)]',
  'bg-[oklch(0.74_0.17_85_/_0.1)] shadow-[0_0_6px_oklch(0.74_0.17_85_/_0.3)]',
);

const depSearchInput = cn(
  'w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-2)]',
  'px-3 py-2 text-[12px] text-[var(--text-hi)] placeholder:text-[var(--text-dim)]',
  'hover:border-[var(--border-hi)] hover:bg-[var(--bg-3)]',
  'focus:border-[var(--gold)] focus:outline-none',
  'focus:shadow-[0_0_0_3px_oklch(0.78_0.16_82_/_0.15)]',
  'transition-all duration-[180ms]',
);

const depRow = cn(
  'flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--r-sm)]',
  'bg-[var(--bg-2)] border border-[var(--border)] cursor-pointer',
  'hover:border-[oklch(0.74_0.17_85_/_0.35)] transition-colors',
);
