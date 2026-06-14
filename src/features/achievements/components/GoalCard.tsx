'use client';

import { useRef, useState } from 'react';

import { cn } from '@/libs/utils';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { CAT_MAP, RANK_DESC, RANK_STYLE, PRIORITY_STYLE } from '../types';
import type { Goal, GoalCategory } from '../types';
import { ProgressRing } from './ProgressRing';

interface GoalCardProps {
  goal: Goal;
  index: number;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onToggleMilestone: (goalId: string, msId: string) => void;
  onAction: (action: 'edit' | 'complete' | 'archive' | 'restore' | 'delete', goal: Goal) => void;
}

const catAccent: Record<GoalCategory, string> = {
  career:   'var(--gold)',
  health:   'var(--mint)',
  learning: 'var(--cyan)',
  finance:  'var(--violet)',
  personal: 'var(--rose)',
};

const catRingText: Record<GoalCategory, string> = {
  career:   'text-[var(--gold)]',
  health:   'text-[var(--mint)]',
  learning: 'text-[var(--cyan)]',
  finance:  'text-[var(--violet)]',
  personal: 'text-[var(--rose)]',
};

export function GoalCard({ goal, index, expanded, onToggleExpand, onToggleMilestone, onAction }: GoalCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setMenuOpen(false));

  const cat = CAT_MAP[goal.cat];
  const done = goal.status === 'completed';
  const archived = goal.status === 'archived';
  const msDone = goal.milestones.filter((m) => m.done).length;
  const msTotal = goal.milestones.length;
  const showMs = expanded ? goal.milestones : goal.milestones.slice(0, 3);
  const extra = goal.milestones.length - showMs.length;

  const accent = catAccent[goal.cat];
  const ringText = catRingText[goal.cat];

  return (
    <div
      className={cn(
        'flex flex-col bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)]',
        'overflow-hidden relative transition-[border-color,box-shadow] duration-200',
        'border-l-[3px] hover:shadow-[0_4px_20px_oklch(0_0_0_/_0.2)]',
        done && 'opacity-90',
        archived && 'opacity-50 grayscale-[0.3]',
      )}
      style={{
        borderLeftColor: accent,
        animationDelay: `${Math.min(index, 8) * 45}ms`,
      }}
    >
      {/* Conquered ribbon */}
      {done && (
        <div className="absolute top-[18px] right-[-28px] w-[110px] text-center text-[7px] font-black tracking-[0.16em] uppercase py-[3px] pointer-events-none rotate-[38deg] z-10"
          style={{ background: `linear-gradient(90deg, oklch(0.5 0.14 162), var(--mint))`, color: 'var(--panel)' }}>
          CONQUERED
        </div>
      )}

      {/* Top row */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        {/* Progress ring */}
        <div className={cn('relative shrink-0', ringText)}>
          <ProgressRing value={goal.progress} size={52} stroke={5} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-[var(--font-title)] text-[11px] font-black', done ? 'text-[var(--mint)]' : '')}>
              {done ? '✓' : Math.round(goal.progress * 100)}
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {/* Rank */}
            <span className={cn('text-[9px] font-black font-[var(--font-title)] px-1.5 py-0.5 rounded-[3px] border tracking-[0.08em]', RANK_STYLE[goal.rank])}>
              {goal.rank}
            </span>
            {/* Category */}
            <span className={cn('text-[9px] font-semibold tracking-[0.06em] font-[var(--font-title)]', catRingText[goal.cat])}>
              {cat.ci} {cat.label}
            </span>
            {/* Priority */}
            {!done && !archived && (
              <span className={cn('text-[8px] font-bold px-1.5 py-0.5 rounded-[3px] border tracking-[0.06em] font-[var(--font-title)] capitalize', PRIORITY_STYLE[goal.priority])}>
                {goal.priority}
              </span>
            )}
          </div>
          <h3 className="font-[var(--font-title)] text-[13px] font-bold text-[var(--text-hi)] tracking-[0.03em] leading-tight pr-2">
            {goal.title}
          </h3>
        </div>

        {/* Menu */}
        <div ref={menuRef} className="relative shrink-0 mt-0.5">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--r-sm)] text-[var(--text-lo)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)] transition-colors text-[16px] leading-none"
            aria-label="Goal actions"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[160px] bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] shadow-[0_8px_24px_oklch(0_0_0_/_0.4)] overflow-hidden py-1">
              <MenuItem onClick={() => { onAction('edit', goal); setMenuOpen(false); }}>✎ Edit ambition</MenuItem>
              <MenuItem onClick={() => { onToggleExpand(goal.id); setMenuOpen(false); }}>
                {expanded ? '▲ Collapse' : '▾ Expand details'}
              </MenuItem>
              {!done && (
                <MenuItem onClick={() => { onAction('complete', goal); setMenuOpen(false); }}>✓ Mark complete</MenuItem>
              )}
              <div className="h-px bg-[var(--border)] my-1" />
              {archived
                ? <MenuItem onClick={() => { onAction('restore', goal); setMenuOpen(false); }}>↺ Restore</MenuItem>
                : <MenuItem onClick={() => { onAction('archive', goal); setMenuOpen(false); }}>▣ Archive</MenuItem>}
              <MenuItem danger onClick={() => { onAction('delete', goal); setMenuOpen(false); }}>🗑 Delete</MenuItem>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="px-4 pb-3 text-[11px] text-[var(--text-mid)] leading-[1.55] line-clamp-2">
        {goal.desc}
      </p>

      {/* Milestones */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-bold tracking-[0.08em] text-[var(--text-mid)] uppercase font-[var(--font-title)]">
            Milestones
          </span>
          <div className="flex-1 h-[3px] bg-[var(--panel2)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${msTotal ? (msDone / msTotal) * 100 : 0}%`, background: accent }}
            />
          </div>
          <span className="text-[9px] text-[var(--text-lo)]">{msDone}/{msTotal}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {showMs.map((m) => (
            <div
              key={m.id}
              role={archived ? undefined : 'button'}
              tabIndex={archived ? -1 : 0}
              onClick={() => !archived && onToggleMilestone(goal.id, m.id)}
              onKeyDown={(e) => e.key === 'Enter' && !archived && onToggleMilestone(goal.id, m.id)}
              className={cn(
                'flex items-center gap-2.5 py-1.5 rounded-[var(--r-sm)] px-1 -mx-1 transition-colors',
                !archived && 'cursor-pointer hover:bg-[var(--panel2)]',
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-[3px] border flex items-center justify-center text-[9px] shrink-0 transition-all',
                  m.done
                    ? 'text-[var(--panel)]'
                    : 'bg-transparent border-[var(--border)] text-transparent',
                )}
                style={m.done ? { background: accent, borderColor: accent } : undefined}
              >
                ✓
              </span>
              <span className={cn('text-[11px] leading-tight', m.done ? 'text-[var(--text-lo)] line-through' : 'text-[var(--text-hi)]')}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
        {extra > 0 && (
          <button
            type="button"
            onClick={() => onToggleExpand(goal.id)}
            className="mt-1 text-[10px] text-[var(--text-lo)] hover:text-[var(--text-mid)] transition-colors font-[var(--font-title)] tracking-[0.04em]"
          >
            + {extra} more milestone{extra > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-[var(--border)] bg-[oklch(0_0_0_/_0.06)]">
        <span className={cn('text-[10px] flex items-center gap-1', done ? 'text-[var(--mint)]' : 'text-[var(--text-lo)]')}>
          <span>◷</span>
          {done
            ? `Done ${goal.completedDate}`
            : archived
            ? 'Archived'
            : `${goal.targetLabel} · ${goal.daysLeft}d left`}
        </span>
        <div className="flex-1" />
        <span className="text-[10px] font-bold text-[var(--cyan)] font-[var(--font-title)]">
          {goal.xp}<small className="text-[8px] ml-0.5 opacity-60">XP</small>
        </span>
        <span className="text-[10px] font-bold text-[var(--gold)] font-[var(--font-title)]">
          {goal.coins}<small className="text-[8px] ml-0.5 opacity-60">◉</small>
        </span>
      </div>

      {/* Expand toggle */}
      {!expanded ? (
        <button
          type="button"
          onClick={() => onToggleExpand(goal.id)}
          className="py-1.5 text-[9px] text-[var(--text-lo)] hover:text-[var(--text-mid)] tracking-[0.08em] font-[var(--font-title)] transition-colors text-center w-full"
        >
          ▾ DETAILS
        </button>
      ) : (
        <div className="border-t border-[var(--border)] bg-[oklch(0_0_0_/_0.04)] flex flex-col gap-3 p-4">
          {/* Detail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
            {[
              ['Status',   goal.status === 'not-started' ? 'Not Started' : goal.status === 'in-progress' ? 'In Progress' : goal.status === 'completed' ? 'Completed' : 'Archived'],
              ['Rank',     `${goal.rank} · ${RANK_DESC[goal.rank]}`],
              ['Priority', goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)],
              ['Started',  new Date(goal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })],
              ['Target',   goal.targetLabel],
              ['Reward',   `${goal.xp} XP · ${goal.coins} ◉`],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[8px] text-[var(--text-lo)] uppercase tracking-[0.1em] font-[var(--font-title)] mb-0.5">{k}</div>
                <div className="text-[10px] font-semibold text-[var(--text-hi)]">{v}</div>
              </div>
            ))}
          </div>

          {/* Strategy note */}
          {goal.note && (
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] p-3">
              <div className="text-[8px] tracking-[0.1em] uppercase mb-1.5 font-[var(--font-title)]" style={{ color: accent }}>
                ◆ STRATEGY
              </div>
              <p className="text-[10px] text-[var(--text-mid)] leading-[1.6] italic">{goal.note}</p>
            </div>
          )}

          {/* Linked trophy */}
          {goal.linkedTrophy && (
            <p className="text-[9px] text-[var(--text-lo)] font-mono">
              ✧ Completing this unlocks the{' '}
              <span className="text-[var(--gold)]">{goal.linkedTrophy}</span> trophy
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!done && (
              <ActionBtn primary onClick={() => onAction('complete', goal)}>✓ Complete</ActionBtn>
            )}
            <ActionBtn onClick={() => onAction('edit', goal)}>✎ Edit</ActionBtn>
            {archived
              ? <ActionBtn onClick={() => onAction('restore', goal)}>↺ Restore</ActionBtn>
              : <ActionBtn onClick={() => onAction('archive', goal)}>▣ Archive</ActionBtn>}
            <ActionBtn danger onClick={() => onAction('delete', goal)}>🗑</ActionBtn>
          </div>

          <button
            type="button"
            onClick={() => onToggleExpand(goal.id)}
            className="text-[9px] text-[var(--text-lo)] hover:text-[var(--text-mid)] tracking-[0.08em] font-[var(--font-title)] transition-colors text-center pt-1"
          >
            ▴ COLLAPSE
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2 text-[11px] font-semibold transition-colors',
        danger
          ? 'text-[var(--rose)] hover:bg-[oklch(0.74_0.18_5_/_0.08)]'
          : 'text-[var(--text-hi)] hover:bg-[var(--panel2)]',
      )}
    >
      {children}
    </button>
  );
}

function ActionBtn({ children, onClick, primary, danger }: { children: React.ReactNode; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-[var(--r-sm)] text-[10px] font-bold font-[var(--font-title)] tracking-[0.06em] transition-colors border',
        primary && 'bg-[oklch(0.74_0.17_85_/_0.15)] border-[oklch(0.74_0.17_85_/_0.4)] text-[var(--gold)] hover:bg-[oklch(0.74_0.17_85_/_0.25)]',
        danger  && 'bg-transparent border-[oklch(0.74_0.18_5_/_0.3)] text-[var(--rose)] hover:bg-[oklch(0.74_0.18_5_/_0.08)]',
        !primary && !danger && 'bg-transparent border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)]',
      )}
    >
      {children}
    </button>
  );
}
