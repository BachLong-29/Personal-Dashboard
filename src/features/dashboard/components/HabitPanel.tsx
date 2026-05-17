'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';

import { useCategories } from '../hooks/useCategories';
import { useDeleteHabit } from '../hooks/useDeleteHabit';
import { useHabitLogs } from '../hooks/useHabitLogs';
import { useHabits } from '../hooks/useHabits';
import type { Habit } from '../types';
import { AddHabitModal } from './AddHabitModal';
import { CategoryModal } from './CategoryModal';
import { HabitCard } from './HabitCard';

interface HabitPanelProps {
  todayStr: string;
}

export function HabitPanel({ todayStr }: HabitPanelProps) {
  const { data: habits = [], isLoading } = useHabits();
  const { data: logs = [] } = useHabitLogs(todayStr);
  const { data: categories = [] } = useCategories();
  const { mutate: deleteHabit } = useDeleteHabit();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Habit | undefined>(undefined);
  const [deletingHabit, setDeletingHabit] = useState<Habit | undefined>(undefined);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const todayDay = new Date().getDay();
  const logMap = Object.fromEntries(logs.map((l) => [l.habitId, l.done]));
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  function handleEdit(habit: Habit) {
    setEditing(habit);
    setShowModal(true);
  }

  function handleDeleteRequest(habit: Habit) {
    setDeletingHabit(habit);
  }

  function handleDeleteConfirm() {
    if (!deletingHabit) return;
    deleteHabit(deletingHabit.id);
    setDeletingHabit(undefined);
  }

  function handleClose() {
    setShowModal(false);
    setEditing(undefined);
  }

  return (
    <div className={cn(panelBase, panelViolet, panelLayout)}>
      <div className={cornerTL} />
      <div className={cornerTR} />
      <div className={cornerBL} />
      <div className={cornerBR} />

      <div className={header}>
        <div className={titleGroup}>
          <span className={sparkle}>✦</span>
          <span className={titleText}>Daily Habits</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={manageCatBtn}
            onClick={() => setShowCategoryModal(true)}
            title="Manage Categories"
          >
            ◈ Categories
          </button>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <span>+</span> New Habit
          </Button>
        </div>
      </div>

      <div className={listWrap}>
        {isLoading ? (
          <div className={empty}>◆ Loading habits... ◆</div>
        ) : habits.length === 0 ? (
          <div className={empty}>◆ No habits yet. Create one! ◆</div>
        ) : (
          habits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h as Habit}
              tagLabel={catMap[h.tagId]}
              isToday={(h.days as number[]).includes(todayDay)}
              todayDone={logMap[h.id] ?? false}
              onEdit={handleEdit}
              onDelete={(id) => handleDeleteRequest(habits.find((x) => x.id === id) as Habit)}
            />
          ))
        )}
      </div>

      {showModal && (
        <AddHabitModal editing={editing} onClose={handleClose} onSaved={handleClose} />
      )}

      {showCategoryModal && <CategoryModal onClose={() => setShowCategoryModal(false)} />}

      {deletingHabit && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setDeletingHabit(undefined)}
        >
          <div className="modal-box" style={{ width: 400 }}>
            <div className="modal-title">
              <span style={{ color: 'var(--rose)' }}>⚠</span> Delete Habit
            </div>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'var(--panel2)',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border)',
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 20 }}>{deletingHabit.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>
                  {deletingHabit.name}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, margin: 0 }}>
                This habit will be permanently removed and will no longer appear in your daily
                quests. This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn cancel"
                onClick={() => setDeletingHabit(undefined)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn"
                onClick={handleDeleteConfirm}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, oklch(0.45 0.18 5), var(--rose))',
                  borderColor: 'var(--rose)',
                  color: '#fff',
                  boxShadow: '0 0 12px var(--rose-glow)',
                }}
              >
                Delete Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const panelBase =
  "bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] overflow-hidden relative before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)]";
const panelViolet =
  'border-[oklch(0.66_0.22_295_/_0.35)] shadow-[0_0_20px_oklch(0.66_0.22_295_/_0.06),inset_0_0_20px_oklch(0.66_0.22_295_/_0.03)]';
const panelLayout = 'flex-1 overflow-hidden min-h-0 flex flex-col';

const cornerBase = 'absolute w-3 h-3 pointer-events-none border-[var(--violet-dim)]';
const cornerTL = cn(cornerBase, 'top-[5px] left-[5px] border-t-[1.5px] border-l-[1.5px]');
const cornerTR = cn(cornerBase, 'top-[5px] right-[5px] border-t-[1.5px] border-r-[1.5px]');
const cornerBL = cn(cornerBase, 'bottom-[5px] left-[5px] border-b-[1.5px] border-l-[1.5px]');
const cornerBR = cn(cornerBase, 'bottom-[5px] right-[5px] border-b-[1.5px] border-r-[1.5px]');

const header =
  'flex items-center justify-between px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)] shrink-0';
const titleGroup = 'flex items-center gap-2';
const sparkle = 'text-[16px] animate-[spin_4s_linear_infinite]';
const titleText =
  '[font-family:var(--f-title)] text-[14px] font-bold tracking-[0.08em] text-[var(--text-hi)]';

const manageCatBtn =
  'px-[10px] py-[5px] rounded-[var(--r-sm)] text-[10px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-mid)] cursor-pointer transition-all hover:border-[oklch(0.66_0.22_295_/_0.5)] hover:text-[var(--violet)]';

const listWrap = 'flex-1 overflow-y-auto px-3 py-2.5 flex flex-col gap-2';
const empty = 'text-[var(--text-lo)] text-center py-[30px] text-[12px]';
