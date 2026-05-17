'use client';

import { useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui';
import { cn } from '@/libs/utils';
import type { Category } from '@/types';

import { HABIT_COLORS } from '../constants';
import { useCategories } from '../hooks/useCategories';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { useCreateTask } from '../hooks/useCreateTask';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type { Task, TaskColor, TaskStatus } from '../types';
import { STATUS_META } from './TaskCard';

interface ScheduleTaskModalProps {
  editing?: Task;
  allTasks?: Task[];
  defaultDate?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function ScheduleTaskModal({
  editing,
  allTasks = [],
  defaultDate,
  onClose,
  onSaved,
}: ScheduleTaskModalProps) {
  const today = new Date().toISOString().substring(0, 10);
  const initDate = defaultDate ?? today;

  const { data: categories = [] } = useCategories();

  const [name, setName] = useState(editing?.name ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [tagId, setTagId] = useState(editing?.tagId ?? '');
  const [color, setColor] = useState<TaskColor>(editing?.color ?? 'gold');
  const [icon, setIcon] = useState(editing?.icon ?? '');
  const [startDate, setStartDate] = useState(editing?.startDate ?? initDate);
  const [endDate, setEndDate] = useState(editing?.endDate ?? initDate);
  const [status, setStatus] = useState<TaskStatus>(editing?.status ?? 'todo');
  const [deps, setDeps] = useState<string[]>(editing?.dependencies ?? []);
  const [showPicker, setShowPicker] = useState(false);

  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const { mutate: createTask, isPending: isCreating, error: createError } = useCreateTask();
  const { mutate: updateTask, isPending: isUpdating, error: updateError } = useUpdateTask();
  const { mutate: createCategory, isPending: isAddingCat } = useCreateCategory();

  const isPending = isCreating || isUpdating;
  const apiError = createError ?? updateError;

  const resolvedTagId = tagId || (categories.length > 0 ? (categories[0] as Category).id : '');

  // Date validation: endDate must be >= startDate
  const dateError = endDate < startDate ? 'End date must be on or after start date.' : '';

  // Dependency options: exclude self and tasks that would create cycles
  const depOptions = allTasks.filter((t) => t.id !== editing?.id && t.active);

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

  function handleSave() {
    if (!name.trim() || !icon || !resolvedTagId || isPending || dateError) return;

    const payload = {
      name: name.trim(),
      note: note.trim() || undefined,
      tagId: resolvedTagId,
      color,
      icon,
      startDate,
      endDate,
      dependencies: deps,
    };

    if (editing) {
      updateTask(
        { id: editing.id, ...payload, status },
        { onSuccess: () => { onSaved?.(); onClose(); } },
      );
    } else {
      createTask(payload, { onSuccess: () => { onSaved?.(); onClose(); } });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEmojiSelect(emoji: any) {
    setIcon(emoji.native as string);
    setShowPicker(false);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 520, maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-title">{editing ? '✎ Edit Task' : '＋ New Task'}</div>

        {/* Name */}
        <div className={fieldGroup}>
          <label className={fieldLabel}>Task Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter task name..."
            maxLength={100}
          />
        </div>

        {/* Status — only shown when editing */}
        {editing && (
          <div className={fieldGroup}>
            <label className={fieldLabel}>Status</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.entries(STATUS_META) as [TaskStatus, typeof STATUS_META[TaskStatus]][]).map(
                ([s, sm]) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(statusChip, status === s && statusChipActive)}
                    style={
                      status === s
                        ? { borderColor: sm.color, color: sm.color, background: sm.bg }
                        : {}
                    }
                  >
                    <span>{sm.icon}</span>
                    <span>{sm.label}</span>
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className={cn(fieldGroup, 'grid grid-cols-2 gap-3')}>
          <div>
            <label className={fieldLabel}>Start Date *</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) setEndDate(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={fieldLabel}>End Date *</label>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        {dateError && <p className={errorText}>{dateError}</p>}

        {/* Icon */}
        <div className={fieldGroup}>
          <label className={fieldLabel}>Icon *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className={iconBtn}
              onClick={() => setShowPicker((v) => !v)}
              title="Pick icon"
            >
              {icon ? <span style={{ fontSize: 22 }}>{icon}</span> : <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>Pick</span>}
            </button>
            {icon && (
              <button type="button" className={clearBtn} onClick={() => setIcon('')}>
                ✕
              </button>
            )}
          </div>
          {showPicker && (
            <div style={{ position: 'relative', zIndex: 50, marginTop: 8 }}>
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

        {/* Color */}
        <div className={fieldGroup}>
          <label className={fieldLabel}>Color</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.entries(HABIT_COLORS) as [TaskColor, { label: string; value: string }][]).map(
              ([key, { label, value }]) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => setColor(key)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: value,
                    border: color === key ? '2px solid white' : '2px solid transparent',
                    boxShadow: color === key ? `0 0 8px ${value}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                />
              ),
            )}
          </div>
        </div>

        {/* Category */}
        <div className={fieldGroup}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className={fieldLabel} style={{ marginBottom: 0 }}>Category *</label>
            <button
              type="button"
              className={addCatToggle}
              onClick={() => setShowAddCat((v) => !v)}
            >
              {showAddCat ? '✕ Cancel' : '+ New'}
            </button>
          </div>

          {showAddCat && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name..."
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setShowAddCat(false); }}
                autoFocus
              />
              <Button variant="primary" size="sm" onClick={handleAddCategory} disabled={isAddingCat}>
                {isAddingCat ? '...' : 'Add'}
              </Button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 80, overflowY: 'auto' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={cn(catChip, resolvedTagId === cat.id && catChipActive)}
                onClick={() => setTagId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className={fieldGroup}>
          <label className={fieldLabel}>Note (optional)</label>
          <textarea
            className={textareaClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            maxLength={500}
          />
        </div>

        {/* Dependencies */}
        {depOptions.length > 0 && (
          <div className={fieldGroup}>
            <label className={fieldLabel}>Dependencies (optional)</label>
            <p style={{ fontSize: 10, color: 'var(--text-lo)', marginBottom: 6 }}>
              This task will be blocked until all selected tasks are done.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
              {depOptions.map((t) => (
                <label key={t.id} className={depRow}>
                  <input
                    type="checkbox"
                    checked={deps.includes(t.id)}
                    onChange={() => toggleDep(t.id)}
                    className={depCheckbox}
                  />
                  <span style={{ fontSize: 14 }}>{t.icon}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-hi)', flex: 1 }}>{t.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-lo)' }}>
                    {t.startDate === t.endDate ? t.startDate : `${t.startDate} → ${t.endDate}`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {apiError && (
          <p className={errorText}>
            {(apiError as Error).message ?? 'Something went wrong.'}
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-btn"
            onClick={handleSave}
            disabled={isPending || !name.trim() || !icon || !!dateError}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, oklch(0.55 0.17 85), var(--gold))',
              borderColor: 'var(--gold)',
              color: '#000',
              opacity: isPending || !name.trim() || !icon || !!dateError ? 0.5 : 1,
            }}
          >
            {isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldGroup = 'mb-4';
const fieldLabel = 'block text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text-mid)] mb-1.5 font-[var(--font-title)]';
const errorText = 'text-[10px] text-[var(--rose)] mt-1 mb-2';

const iconBtn =
  'w-10 h-10 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--panel2)] flex items-center justify-center cursor-pointer hover:border-[var(--gold)] transition-all';
const clearBtn =
  'text-[10px] text-[var(--text-lo)] hover:text-[var(--rose)] cursor-pointer transition-colors';

const catChip =
  'px-2.5 py-1 rounded-full border border-[var(--border)] text-[10px] font-medium text-[var(--text-mid)] bg-[var(--panel2)] cursor-pointer transition-all hover:border-[var(--gold)] hover:text-[var(--text-hi)]';
const catChipActive =
  'border-[var(--gold)] text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)] shadow-[0_0_6px_var(--gold-glow)]';

const addCatToggle =
  'text-[9px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] text-[var(--text-lo)] hover:text-[var(--gold)] transition-colors cursor-pointer';

const textareaClass =
  'w-full bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2 text-[12px] text-[var(--text-hi)] placeholder:text-[var(--text-lo)] focus:outline-none focus:border-[var(--gold)] resize-none transition-colors';

const depRow =
  'flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--r-sm)] bg-[var(--panel2)] border border-[var(--border)] cursor-pointer hover:border-[var(--gold-dim)] transition-colors';
const depCheckbox = 'accent-[var(--gold)] w-3 h-3 cursor-pointer shrink-0';

const statusChip =
  'flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border)] text-[10px] font-medium text-[var(--text-mid)] bg-[var(--panel2)] cursor-pointer transition-all hover:border-[var(--text-lo)] hover:text-[var(--text-hi)] font-[var(--font-title)]';
const statusChipActive = 'font-bold';
