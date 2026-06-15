'use client';

import { useState } from 'react';

import { cn } from '@/libs/utils';
import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CATEGORIES, RANK_DESC } from '../constants';
import type { GoalCategory, GoalPriority, GoalRank, Goal } from '../types';

export interface GoalFormData {
  title: string;
  desc: string;
  cat: GoalCategory;
  rank: GoalRank;
  priority: GoalPriority;
  targetDate: string;
  milestone: string;
}

interface GoalModalProps {
  mode: 'new' | 'edit';
  goal?: Goal | null;
  onClose: () => void;
  onSave?: (data: GoalFormData) => void;
}

const REWARD_MAP: Record<GoalRank, [number, number]> = {
  S: [880, 240],
  A: [560, 150],
  B: [420, 110],
  C: [300, 80],
  D: [180, 50],
};

const PRIORITY_OPTS: { value: GoalPriority; label: string }[] = [
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
];

export function GoalModal({ mode, goal, onClose, onSave }: GoalModalProps) {
  const [title,    setTitle]    = useState(goal?.title       ?? '');
  const [desc,     setDesc]     = useState(goal?.desc        ?? '');
  const [cat,      setCat]      = useState<GoalCategory>(goal?.cat     ?? 'career');
  const [rank,     setRank]     = useState<GoalRank>(goal?.rank        ?? 'B');
  const [priority, setPriority] = useState<GoalPriority>(goal?.priority ?? 'medium');
  const [target,   setTarget]   = useState(goal?.targetDate ?? '');
  const [milestone, setMilestone] = useState('');

  const [xp, coins] = REWARD_MAP[rank];

  const handleSave = () => {
    onSave?.({ title, desc, cat, rank, priority, targetDate: target, milestone });
    onClose();
  };

  return (
    <Modal open onClose={onClose} maxWidth="520px">
      <ModalHead
        tag={`✦ ${mode === 'edit' ? 'REFORGE AMBITION' : 'DECLARE A NEW AMBITION'} ✦`}
        title={mode === 'edit' ? 'Edit Ambition' : 'Forge an Ambition'}
      />

      <ModalBody className="flex flex-col gap-4">
        {/* Title */}
        <Field label="Ambition Title">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Run a half marathon"
            className={inputCls}
          />
        </Field>

        {/* Vision */}
        <Field label="The Vision">
          <textarea
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What does victory look like? Describe the summit…"
            className={cn(inputCls, 'resize-none')}
          />
        </Field>

        {/* Category */}
        <Field label="Realm · Category">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-[var(--r-sm)] text-[10px] font-bold font-[var(--font-title)] tracking-[0.06em] border transition-colors',
                  cat === c.id
                    ? cn('border-current bg-[currentColor]/10', c.textClass)
                    : 'border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)]',
                )}
              >
                <span>{c.ci}</span> {c.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Rank */}
          <Field label="Difficulty Rank">
            <div className="flex gap-1">
              {(['S', 'A', 'B', 'C', 'D'] as GoalRank[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRank(r)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-0 py-1.5 rounded-[var(--r-sm)] text-[10px] font-black font-[var(--font-title)] border transition-colors',
                    rank === r
                      ? 'bg-[oklch(0.74_0.17_85_/_0.15)] border-[oklch(0.74_0.17_85_/_0.5)] text-[var(--gold)]'
                      : 'border-[var(--border)] text-[var(--text-lo)] hover:text-[var(--text-mid)] hover:bg-[var(--panel2)]',
                  )}
                >
                  {r}
                  <small className="text-[7px] font-normal opacity-60 leading-none mt-0.5">{RANK_DESC[r].slice(0, 4)}</small>
                </button>
              ))}
            </div>
          </Field>

          {/* Target date */}
          <Field label="Target Date">
            <input
              type="date"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Priority */}
          <Field label="Priority">
            <div className="flex bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] p-0.5 gap-0.5">
              {PRIORITY_OPTS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'flex-1 py-1.5 text-[10px] font-bold font-[var(--font-title)] tracking-[0.04em] rounded-[3px] transition-colors',
                    priority === p.value
                      ? 'bg-[oklch(0.74_0.17_85_/_0.15)] text-[var(--gold)]'
                      : 'text-[var(--text-lo)] hover:text-[var(--text-mid)]',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          {/* First milestone */}
          <Field label="First Milestone">
            <input
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              placeholder="The first honest step…"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Reward preview */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 bg-[oklch(0.74_0.17_85_/_0.05)] border border-[oklch(0.74_0.17_85_/_0.25)] rounded-[var(--r-sm)]">
          <span className="text-[8px] font-bold tracking-[0.12em] uppercase text-[var(--gold)] font-[var(--font-title)]">
            ◆ BOUNTY ON COMPLETION
          </span>
          <div className="flex-1" />
          <span className="font-[var(--font-title)] text-[16px] font-black text-[var(--cyan)]">
            {xp}<small className="text-[10px] ml-0.5 text-[var(--text-mid)] font-bold">XP</small>
          </span>
          <span className="font-[var(--font-title)] text-[16px] font-black text-[var(--gold)]">
            {coins}<small className="text-[10px] ml-0.5 text-[var(--text-mid)] font-bold">◉</small>
          </span>
        </div>
      </ModalBody>

      <ModalFoot>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="default" onClick={handleSave}>
          <span>✦</span> {mode === 'edit' ? 'Save Changes' : 'Declare It'}
        </Button>
      </ModalFoot>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold tracking-[0.08em] uppercase text-[var(--text-mid)] font-[var(--font-title)]">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] text-[12px] text-[var(--text-hi)] placeholder-[var(--text-lo)] outline-none focus:border-[oklch(0.74_0.17_85_/_0.5)] transition-colors';
