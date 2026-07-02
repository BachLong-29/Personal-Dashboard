'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';

import { ALL_HABIT_DAYS, HABIT_DAY_LABELS } from '../constants';
import { useCategories } from '../hooks/useCategories';
import { useDeleteHabit } from '../hooks/useDeleteHabit';
import { useHabitLogs } from '../hooks/useHabitLogs';
import { useHabits } from '../hooks/useHabits';
import { useUpdateHabit } from '../hooks/useUpdateHabit';
import type { Habit, HabitDay } from '../types';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { AddHabitModal } from './AddHabitModal';
import { CategoryModal } from './CategoryModal';
import { HabitCard } from './HabitCard';

interface HabitPanelProps {
  todayStr: string;
}

export function HabitPanel({ todayStr }: HabitPanelProps) {
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { data: habits = [], isLoading } = useHabits();
  const { data: logs = [] } = useHabitLogs(todayStr);
  const { data: categories = [] } = useCategories();
  const { mutate: deleteHabit } = useDeleteHabit();
  const { mutate: updateHabit } = useUpdateHabit();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Habit | undefined>(undefined);
  const [deletingHabit, setDeletingHabit] = useState<Habit | undefined>(undefined);
  const [inactivatingHabit, setInactivatingHabit] = useState<Habit | undefined>(undefined);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDay, setFilterDay] = useState<HabitDay | null>(null);

  const todayDay = new Date().getDay();
  const logMap = Object.fromEntries(logs.map((l) => [l.habitId, l.done]));

  const DOW_TO_HABIT_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const todayDayStr = DOW_TO_HABIT_DAY[todayDay] as HabitDay;
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const filteredHabits = (
    filterDay ? habits.filter((h) => h.schedule.some((e) => e.days.includes(filterDay))) : habits
  )
    .slice()
    .sort((a, b) => Number(b.active) - Number(a.active)); // active first, inactive after

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

  function handleToggleActive(habit: Habit) {
    if (habit.active) {
      // Inactivating requires confirmation first
      setInactivatingHabit(habit);
    } else {
      // Reactivating is instant
      updateHabit({ id: habit.id, active: true });
    }
  }

  function handleInactivateConfirm() {
    if (!inactivatingHabit) return;
    updateHabit({ id: inactivatingHabit.id, active: false });
    setInactivatingHabit(undefined);
  }

  function handleClose() {
    setShowModal(false);
    setEditing(undefined);
  }

  function handleToggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className={cn(panelBase, panelViolet, panelLayout)}>
      <div className={cornerTL} />
      <div className={cornerTR} />
      <div className={cornerBL} />
      <div className={cornerBR} />

      {/* ── Header ── */}
      <div className={header}>
        <div className={titleGroup}>
          <span className={sparkle}>✦</span>
          <span className={titleText}>{tDash('habitPanel.title')}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={manageCatBtn}
            onClick={() => setShowCategoryModal(true)}
            title={tDash('habitPanel.manageCategories')}
          >
            ◈ {tDash('habitPanel.categories')}
          </button>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <span>+</span> {tDash('habitPanel.newHabit')}
          </Button>
        </div>
      </div>

      {/* ── Day filter bar ── */}
      <div className={filterBar}>
        <button
          type="button"
          className={cn(filterPill, filterDay === null && filterPillActive)}
          onClick={() => setFilterDay(null)}
        >
          {tDash('habitPanel.all')}
        </button>
        {ALL_HABIT_DAYS.map((day) => (
          <button
            key={day}
            type="button"
            className={cn(
              filterPill,
              filterDay === day && filterPillActive,
              day === todayDayStr && filterDay !== day && filterPillToday,
            )}
            onClick={() => setFilterDay(filterDay === day ? null : day)}
          >
            {HABIT_DAY_LABELS[day]}
            {day === todayDayStr && <span className={todayDot} />}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      <div className={listWrap}>
        {isLoading ? (
          <div className={empty}>{tDash('habitPanel.loading')}</div>
        ) : filteredHabits.length === 0 ? (
          <div className={empty}>
            {habits.length === 0
              ? tDash('habitPanel.emptyAll')
              : tDash('habitPanel.emptyDay', {
                  day: filterDay ? HABIT_DAY_LABELS[filterDay] : '',
                })}
          </div>
        ) : (
          filteredHabits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h as Habit}
              tagLabel={catMap[h.tagId]}
              isToday={h.schedule.some((e) => e.days.includes(todayDayStr))}
              todayDone={logMap[h.id] ?? false}
              expanded={expandedId === h.id}
              activateLabel={tDash('habitPanel.activate')}
              inactivateLabel={tDash('habitPanel.inactivate')}
              onToggle={() => handleToggle(h.id)}
              onEdit={handleEdit}
              onDelete={(id) => handleDeleteRequest(habits.find((x) => x.id === id) as Habit)}
              onToggleActive={handleToggleActive}
            />
          ))
        )}
      </div>

      {showModal && <AddHabitModal editing={editing} onClose={handleClose} onSaved={handleClose} />}

      {showCategoryModal && <CategoryModal onClose={() => setShowCategoryModal(false)} />}

      <Modal open={!!deletingHabit} onClose={() => setDeletingHabit(undefined)} maxWidth="400px">
        <ModalHead
          title={
            <>
              <span style={{ color: 'var(--rose)' }}>⚠</span> {tDash('habitPanel.deleteTitle')}
            </>
          }
        />
        <ModalBody>
          {deletingHabit && (
            <>
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
                {tDash('habitPanel.deleteDescription')}
              </p>
            </>
          )}
        </ModalBody>
        <ModalFoot>
          <button
            type="button"
            className="modal-btn cancel"
            onClick={() => setDeletingHabit(undefined)}
          >
            {tCommon('cancel')}
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
            {tDash('habitPanel.deleteConfirm')}
          </button>
        </ModalFoot>
      </Modal>

      <Modal
        open={!!inactivatingHabit}
        onClose={() => setInactivatingHabit(undefined)}
        maxWidth="400px"
      >
        <ModalHead
          title={
            <>
              <span style={{ color: 'var(--warning)' }}>⏸</span>{' '}
              {tDash('habitPanel.inactivateTitle')}
            </>
          }
        />
        <ModalBody>
          {inactivatingHabit && (
            <>
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
                <span style={{ fontSize: 20 }}>{inactivatingHabit.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>
                  {inactivatingHabit.name}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6, margin: 0 }}>
                {tDash('habitPanel.inactivateDescription')}
              </p>
            </>
          )}
        </ModalBody>
        <ModalFoot>
          <button
            type="button"
            className="modal-btn cancel"
            onClick={() => setInactivatingHabit(undefined)}
          >
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            className="modal-btn"
            onClick={handleInactivateConfirm}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, oklch(0.55 0.14 75), var(--warning))',
              borderColor: 'var(--warning)',
              color: '#1a1206',
              boxShadow: '0 0 12px oklch(0.8 0.15 80 / 0.35)',
            }}
          >
            {tDash('habitPanel.inactivateConfirm')}
          </button>
        </ModalFoot>
      </Modal>
    </div>
  );
}

/* ── Panel shell ── */
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

/* ── Header ── */
const header =
  'flex items-center justify-between px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)] shrink-0';
const titleGroup = 'flex items-center gap-2';
const sparkle = 'text-[16px] animate-[spin_4s_linear_infinite]';
const titleText =
  '[font-family:var(--f-title)] text-[14px] font-bold tracking-[0.08em] text-[var(--text-hi)]';
const manageCatBtn =
  'px-[10px] py-[5px] rounded-[var(--r-sm)] text-[10px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-mid)] cursor-pointer transition-all hover:border-[oklch(0.66_0.22_295_/_0.5)] hover:text-[var(--violet)]';

/* ── Filter bar ── */
const filterBar =
  'flex items-center gap-1.5 px-3 py-[7px] border-b border-[var(--border)] shrink-0 flex-wrap';
const filterPill =
  'relative flex flex-col items-center px-[9px] py-[3px] rounded-[3px] text-[9px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-lo)] cursor-pointer transition-all hover:text-[var(--text-mid)] hover:border-[var(--border-hi)]';
const filterPillActive =
  'bg-[oklch(0.66_0.22_295_/_0.12)] text-[var(--violet)] border-[oklch(0.66_0.22_295_/_0.5)] hover:text-[var(--violet)]';
const filterPillToday = 'text-[var(--text-mid)] border-[var(--border-hi)]';
const todayDot =
  'absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-[var(--violet)] opacity-70';

/* ── List ── */
const listWrap = 'flex-1 overflow-y-auto px-3 py-2.5 flex flex-col gap-2';
const empty = 'text-[var(--text-lo)] text-center py-[30px] text-[12px]';
