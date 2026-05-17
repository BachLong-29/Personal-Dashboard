'use client';

import { useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui';
import { cn } from '@/libs/utils';
import type { Category } from '@/types';

import { DAY_LABELS, DAY_ORDER, HABIT_COLORS } from '../constants';
import { useCategories } from '../hooks/useCategories';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { useCreateHabit } from '../hooks/useCreateHabit';
import { useUpdateHabit } from '../hooks/useUpdateHabit';
import type { Habit, HabitColor } from '../types';

interface AddHabitModalProps {
  editing?: Habit;
  onClose: () => void;
  onSaved: (habit: Habit) => void;
}

export function AddHabitModal({ editing, onClose, onSaved }: AddHabitModalProps) {
  const { data: categories = [], isLoading: catsLoading } = useCategories();

  const [name, setName] = useState(editing?.name ?? '');
  const [days, setDays] = useState<number[]>(editing?.days ?? [1, 2, 3, 4, 5]);
  const [note, setNote] = useState(editing?.note ?? '');
  const [tagId, setTagId] = useState(editing?.tagId ?? '');
  const [color, setColor] = useState<HabitColor>(editing?.color ?? 'gold');
  const [icon, setIcon] = useState(editing?.icon ?? '');
  const [showPicker, setShowPicker] = useState(false);

  // Quick-add category inline
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const { mutate: createHabit, isPending: isCreating, error: createError } = useCreateHabit();
  const { mutate: updateHabit, isPending: isUpdating, error: updateError } = useUpdateHabit();
  const { mutate: createCategory, isPending: isAddingCat } = useCreateCategory();

  const isPending = isCreating || isUpdating;
  const error = createError ?? updateError;

  // Auto-select first category once loaded if no tagId yet
  const resolvedTagId =
    tagId || (categories.length > 0 ? (categories[0] as Category).id : '');

  function toggleDay(d: number) {
    setDays((prev) => {
      if (prev.includes(d)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== d);
      }
      return [...prev, d];
    });
  }

  function handleAddCategory() {
    const name = newCatName.trim();
    if (!name || isAddingCat) return;
    createCategory(
      { name },
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
    if (!name.trim() || !icon || days.length === 0 || !resolvedTagId || isPending) return;

    const payload = {
      name: name.trim(),
      days,
      note: note.trim() || undefined,
      tagId: resolvedTagId,
      color,
      icon,
    };

    if (editing) {
      updateHabit(
        { id: editing.id, ...payload },
        {
          onSuccess: (habit) => {
            onSaved(habit as Habit);
            onClose();
          },
        },
      );
    } else {
      createHabit(payload, {
        onSuccess: (habit) => {
          onSaved(habit as Habit);
          onClose();
        },
      });
    }
  }

  const canSave =
    name.trim().length > 0 && icon.length > 0 && days.length > 0 && resolvedTagId.length > 0;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 520 }}>
        <div className="modal-title">
          <span>✦</span> {editing ? 'Edit Habit' : 'New Habit'}
        </div>

        {/* Name */}
        <div className="modal-field">
          <div className="modal-label">Habit Name *</div>
          <Input
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Meditation"
            autoFocus
            disabled={isPending}
            onKeyDown={(e) => e.key === 'Enter' && canSave && handleSave()}
          />
        </div>

        {/* Days */}
        <div className="modal-field">
          <div className="modal-label">Repeat Days *</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DAY_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                disabled={isPending}
                onClick={() => toggleDay(d)}
                className={cn(dayChip, days.includes(d) && dayChipActive)}
              >
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="modal-field">
          <div className="modal-label">Category *</div>
          {catsLoading ? (
            <div style={{ fontSize: 11, color: 'var(--text-lo)', padding: '6px 0' }}>
              Loading categories...
            </div>
          ) : (
            <>
              <div className={catList}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => setTagId(cat.id)}
                    className={cn(catChip, resolvedTagId === cat.id && catChipActive)}
                  >
                    {cat.name}
                  </button>
                ))}

                {/* Quick-add toggle */}
                {!showAddCat && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setShowAddCat(true)}
                    className={addCatBtn}
                    title="Add category"
                  >
                    + New
                  </button>
                )}
              </div>

              {/* Inline new category input */}
              {showAddCat && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    className="modal-input"
                    style={{ flex: 1 }}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category name..."
                    autoFocus
                    disabled={isAddingCat}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                      if (e.key === 'Escape') {
                        setShowAddCat(false);
                        setNewCatName('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim() || isAddingCat}
                    className={cn(inlineSaveBtn, (!newCatName.trim() || isAddingCat) && 'opacity-40 cursor-not-allowed')}
                  >
                    {isAddingCat ? '...' : '✓'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddCat(false); setNewCatName(''); }}
                    className={inlineCancelBtn}
                  >
                    ✕
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Color */}
        <div className="modal-field">
          <div className="modal-label">Color *</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(Object.entries(HABIT_COLORS) as [HabitColor, { label: string; value: string }][]).map(
              ([key, { label, value }]) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  disabled={isPending}
                  onClick={() => setColor(key)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: value,
                    border: color === key ? `2px solid white` : '2px solid transparent',
                    outline: color === key ? `2px solid ${value}` : 'none',
                    outlineOffset: 2,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                />
              ),
            )}
          </div>
        </div>

        {/* Icon */}
        <div className="modal-field">
          <div className="modal-label">Icon *</div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowPicker((p) => !p)}
            className={cn(iconPreviewBtn, icon && iconPreviewBtnSelected)}
          >
            {icon ? (
              <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
            ) : (
              <span style={{ fontSize: 18, opacity: 0.4 }}>+</span>
            )}
            <span style={{ fontSize: 10, color: 'var(--text-mid)', letterSpacing: '0.06em' }}>
              {icon ? 'Change icon' : 'Pick an icon'}
            </span>
          </button>
          {showPicker && (
            <div style={{ marginTop: 8 }}>
              <Picker
                data={data}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
                perLine={10}
                onEmojiSelect={(emoji: { native: string }) => {
                  setIcon(emoji.native);
                  setShowPicker(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Note */}
        <div className="modal-field">
          <div className="modal-label">Note (optional)</div>
          <Input
            className="modal-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any notes about this habit..."
            disabled={isPending}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
            ✕ Failed to save habit. Please try again.
          </div>
        )}

        <div className="modal-actions">
          <Button
            type="button"
            variant="ghost"
            className="modal-btn cancel"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="modal-btn confirm"
            onClick={handleSave}
            disabled={!canSave || isPending}
          >
            {isPending ? 'Saving...' : `${editing ? 'Save Changes' : 'Create Habit'} ✦`}
          </Button>
        </div>
      </div>
    </div>
  );
}

const dayChip =
  'px-[10px] py-[5px] rounded-[var(--r-sm)] text-[10px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-mid)] cursor-pointer transition-all duration-150 hover:border-[var(--border-hi)] hover:text-[var(--text-hi)]';
const dayChipActive =
  'bg-[oklch(0.74_0.17_85_/_0.15)] border-[oklch(0.74_0.17_85_/_0.6)] text-[var(--gold)] shadow-[0_0_8px_var(--gold-glow)]';

const catList = 'flex flex-wrap gap-[6px]';
const catChip =
  'px-[10px] py-[5px] rounded-[var(--r-sm)] text-[11px] font-[var(--font-body)] border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-mid)] cursor-pointer transition-all duration-150 hover:border-[var(--border-hi)] hover:text-[var(--text-hi)]';
const catChipActive =
  'bg-[oklch(0.74_0.17_85_/_0.15)] border-[oklch(0.74_0.17_85_/_0.6)] text-[var(--gold)]';
const addCatBtn =
  'px-[10px] py-[5px] rounded-[var(--r-sm)] text-[11px] font-[var(--font-body)] border border-dashed border-[var(--border)] text-[var(--text-lo)] cursor-pointer transition-all hover:border-[oklch(0.74_0.17_85_/_0.4)] hover:text-[var(--gold)]';

const inlineSaveBtn =
  'w-[34px] h-[34px] rounded-[var(--r-sm)] flex items-center justify-center text-[13px] bg-[oklch(0.74_0.17_85_/_0.15)] border border-[oklch(0.74_0.17_85_/_0.5)] text-[var(--gold)] cursor-pointer hover:bg-[oklch(0.74_0.17_85_/_0.25)] transition-all shrink-0';
const inlineCancelBtn =
  'w-[34px] h-[34px] rounded-[var(--r-sm)] flex items-center justify-center text-[13px] bg-[var(--panel2)] border border-[var(--border)] text-[var(--text-mid)] cursor-pointer hover:border-[var(--border-hi)] hover:text-[var(--text-hi)] transition-all shrink-0';

const iconPreviewBtn =
  'flex items-center gap-2.5 px-3 h-[44px] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--panel2)] cursor-pointer transition-all duration-150 hover:border-[var(--border-hi)] w-full';
const iconPreviewBtnSelected =
  'border-[oklch(0.74_0.17_85_/_0.5)] shadow-[0_0_8px_var(--gold-glow)]';
