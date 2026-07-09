'use client';

import { useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { cn } from '@/libs/utils';
import type { Category } from '@/types';

import { ALL_HABIT_DAYS, HABIT_DAY_SHORT, HABIT_COLORS } from '../../constants';
import { useCategories } from '../../hooks/useCategories';
import { useCreateCategory } from '../../hooks/useCreateCategory';
import { useCreateHabit } from '../../hooks/useCreateHabit';
import { useUpdateHabit } from '../../hooks/useUpdateHabit';
import type { Habit, HabitColor, HabitDay } from '../../types';

// ─── Local schedule state (adds `id` key for React) ──────────────────────────

interface ScheduleEntry {
  id: string;
  days: HabitDay[];
  time: string; // HH:MM
}

let _counter = 0;
function makeEntry(days: HabitDay[] = [], time = ''): ScheduleEntry {
  return { id: String(++_counter), days, time };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddHabitModalProps {
  editing?: Habit;
  onClose: () => void;
  onSaved: (habit: Habit) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddHabitModal({ editing, onClose, onSaved }: AddHabitModalProps) {
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { data: categories = [], isLoading: catsLoading } = useCategories();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName] = useState(editing?.name ?? '');

  const [schedule, setSchedule] = useState<ScheduleEntry[]>(() => {
    if (editing?.schedule?.length) {
      return editing.schedule.map((e) => makeEntry(e.days as HabitDay[], e.time));
    }
    return [makeEntry(['mon', 'tue', 'wed', 'thu', 'fri'], '')];
  });

  const [duration, setDuration] = useState(
    editing?.duration != null ? String(editing.duration) : '',
  );
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

  const resolvedTagId = tagId || (categories.length > 0 ? (categories[0] as Category).id : '');

  // ── Schedule helpers ────────────────────────────────────────────────────────

  const assignedDays = new Set(schedule.flatMap((e) => e.days));
  const unassignedDays = ALL_HABIT_DAYS.filter((d) => !assignedDays.has(d));

  function toggleDayInEntry(entryId: string, day: HabitDay) {
    setSchedule((prev) => {
      const entry = prev.find((e) => e.id === entryId);
      if (!entry) return prev;

      const isInThisEntry = entry.days.includes(day);

      if (isInThisEntry) {
        if (entry.days.length === 1) return prev;
        return prev.map((e) =>
          e.id === entryId ? { ...e, days: e.days.filter((d) => d !== day) } : e,
        );
      }

      return prev.map((e) => {
        if (e.id === entryId) return { ...e, days: [...e.days, day] };
        if (e.days.includes(day)) return { ...e, days: e.days.filter((d) => d !== day) };
        return e;
      });
    });
  }

  function setEntryTime(entryId: string, time: string) {
    setSchedule((prev) => prev.map((e) => (e.id === entryId ? { ...e, time } : e)));
  }

  function addEntry() {
    if (unassignedDays.length === 0) return;
    setSchedule((prev) => [...prev, makeEntry([], '')]);
  }

  function removeEntry(entryId: string) {
    if (schedule.length <= 1) return;
    setSchedule((prev) => prev.filter((e) => e.id !== entryId));
  }

  // ── Category helpers ────────────────────────────────────────────────────────

  function handleAddCategory() {
    const catName = newCatName.trim();
    if (!catName || isAddingCat) return;
    createCategory(
      { name: catName },
      {
        onSuccess: (cat) => {
          setTagId((cat as Category).id);
          setNewCatName('');
          setShowAddCat(false);
        },
      },
    );
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    const validSchedule = schedule.filter((e) => e.days.length > 0 && e.time.trim());
    if (!name.trim() || !icon || validSchedule.length === 0 || !resolvedTagId || isPending) return;

    const durationNum = duration ? parseInt(duration, 10) : undefined;

    const payload = {
      name: name.trim(),
      schedule: validSchedule.map(({ days, time }) => ({ days, time })),
      duration: durationNum && !Number.isNaN(durationNum) ? durationNum : undefined,
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
    name.trim().length > 0 &&
    icon.length > 0 &&
    resolvedTagId.length > 0 &&
    schedule.some((e) => e.days.length > 0 && e.time.trim().length > 0);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Modal open onClose={onClose} maxWidth="540px" scrollable>
      <ModalHead
        tag="✦"
        title={editing ? tDash('addHabitModal.titleEdit') : tDash('addHabitModal.titleCreate')}
      />
      <ModalBody scrollable>
        {/* Name */}
        <div className="modal-field">
          <div className="modal-label">{tDash('addHabitModal.fields.habitName')} *</div>
          <Input
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tDash('addHabitModal.placeholders.name')}
            autoFocus
            disabled={isPending}
            onKeyDown={(e) => e.key === 'Enter' && canSave && handleSave()}
          />
        </div>

        {/* Schedule builder */}
        <div className="modal-field">
          <div className="modal-label">{tDash('addHabitModal.fields.schedule')} *</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {schedule.map((entry) => (
              <div key={entry.id} className={scheduleRow}>
                {/* Day chips row */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                  {ALL_HABIT_DAYS.map((day) => {
                    const active = entry.days.includes(day);
                    const inOther = !active && assignedDays.has(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isPending}
                        title={
                          inOther ? tDash('addHabitModal.hints.alreadyInOtherSlot') : undefined
                        }
                        onClick={() => toggleDayInEntry(entry.id, day)}
                        className={cn(dayChip, active && dayChipActive, inOther && dayChipOther)}
                      >
                        {HABIT_DAY_SHORT[day]}
                      </button>
                    );
                  })}

                  {schedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className={removeRowBtn}
                      title={tDash('addHabitModal.hints.removeTimeSlot')}
                      disabled={isPending}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Time input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={timeLabel}>{tDash('addHabitModal.fields.time')}</span>
                  <input
                    type="time"
                    className={cn('modal-input', timeInput)}
                    value={entry.time}
                    onChange={(e) => setEntryTime(entry.id, e.target.value)}
                    disabled={isPending}
                    required
                  />
                  {!entry.time && (
                    <span style={{ fontSize: 10, color: 'var(--rose)', opacity: 0.85 }}>
                      {tDash('addHabitModal.hints.required')}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {unassignedDays.length > 0 && (
              <button type="button" onClick={addEntry} disabled={isPending} className={addSlotBtn}>
                + {tDash('addHabitModal.actions.addTimeSlot')}
                <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 4 }}>
                  (
                  {tDash('addHabitModal.hints.unassigned', {
                    days: unassignedDays.map((d) => HABIT_DAY_SHORT[d]).join('·'),
                  })}
                  )
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Duration (optional) */}
        <div className="modal-field">
          <div className="modal-label">{tDash('addHabitModal.fields.duration')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Input
              className="modal-input"
              type="number"
              min="1"
              max="1440"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder={tDash('addHabitModal.placeholders.duration')}
              disabled={isPending}
              style={{ width: 120 }}
            />
            {duration && (
              <span style={{ fontSize: 10, color: 'var(--text-mid)' }}>
                ≈{' '}
                {Math.floor(parseInt(duration, 10) / 60) > 0
                  ? `${Math.floor(parseInt(duration, 10) / 60)}h `
                  : ''}
                {parseInt(duration, 10) % 60}m
              </span>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="modal-field">
          <div className="modal-label">{tDash('addHabitModal.fields.category')} *</div>
          {catsLoading ? (
            <div style={{ fontSize: 11, color: 'var(--text-lo)', padding: '6px 0' }}>
              {tDash('addHabitModal.hints.loadingCategories')}
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

                {!showAddCat && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setShowAddCat(true)}
                    className={addCatBtn}
                    title={tDash('addHabitModal.hints.addCategory')}
                  >
                    + {tDash('addHabitModal.actions.newCategory')}
                  </button>
                )}
              </div>

              {showAddCat && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    className="modal-input"
                    style={{ flex: 1 }}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder={tDash('addHabitModal.placeholders.categoryName')}
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
                    className={cn(
                      inlineSaveBtn,
                      (!newCatName.trim() || isAddingCat) && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {isAddingCat ? '...' : '✓'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCat(false);
                      setNewCatName('');
                    }}
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
          <div className="modal-label">{tDash('addHabitModal.fields.color')} *</div>
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
                    border: color === key ? '2px solid white' : '2px solid transparent',
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
          <div className="modal-label">{tDash('addHabitModal.fields.icon')} *</div>
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
              {icon
                ? tDash('addHabitModal.hints.changeIcon')
                : tDash('addHabitModal.hints.pickIcon')}
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
          <div className="modal-label">{tDash('addHabitModal.fields.note')}</div>
          <Input
            className="modal-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={tDash('addHabitModal.placeholders.note')}
            disabled={isPending}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
            ✕ {tDash('addHabitModal.hints.saveFailed')}
          </div>
        )}
      </ModalBody>
      <ModalFoot>
        <Button
          type="button"
          variant="ghost"
          className="modal-btn cancel"
          onClick={onClose}
          disabled={isPending}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="modal-btn confirm"
          onClick={handleSave}
          disabled={!canSave || isPending}
        >
          {isPending
            ? tDash('addHabitModal.actions.saving')
            : `${editing ? tDash('addHabitModal.actions.saveChanges') : tDash('addHabitModal.actions.createHabit')} ✦`}
        </Button>
      </ModalFoot>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const scheduleRow =
  'flex flex-col gap-[7px] px-3 py-2.5 rounded-[var(--r-sm)] bg-[var(--panel2)] border border-[var(--border)]';

const dayChip =
  'w-[30px] h-[26px] rounded-[var(--r-sm)] text-[10px] font-bold tracking-[0.06em] uppercase font-[var(--font-title)] border border-[var(--border)] bg-[var(--panel3)] text-[var(--text-mid)] cursor-pointer transition-all duration-150 hover:border-[var(--border-hi)] hover:text-[var(--text-hi)]';
const dayChipActive =
  'bg-[oklch(0.74_0.17_85_/_0.15)] border-[oklch(0.74_0.17_85_/_0.6)] text-[var(--gold)] shadow-[0_0_8px_var(--gold-glow)]';
const dayChipOther = 'opacity-40';

const removeRowBtn =
  'ml-auto w-[22px] h-[22px] rounded-[var(--r-sm)] flex items-center justify-center text-[10px] border border-[var(--border)] bg-[var(--panel3)] text-[var(--text-lo)] cursor-pointer hover:border-[var(--rose)] hover:text-[var(--rose)] transition-all shrink-0';

const timeLabel =
  'text-[9px] tracking-[0.08em] text-[var(--text-lo)] uppercase font-bold font-[var(--font-title)] min-w-[30px]';
const timeInput = '!w-[120px]';

const addSlotBtn =
  'flex items-center px-3 h-[34px] rounded-[var(--r-sm)] text-[11px] font-[var(--font-body)] border border-dashed border-[var(--border)] text-[var(--text-lo)] cursor-pointer transition-all hover:border-[oklch(0.74_0.17_85_/_0.4)] hover:text-[var(--gold)] w-full';

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
