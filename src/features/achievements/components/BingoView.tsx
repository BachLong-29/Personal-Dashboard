'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/libs/utils';
import { CAT_MAP, RANK_STYLE } from '../constants';
import type { Goal, GoalCategory } from '../types';
import { ProgressRing } from './ProgressRing';

/* ─────────────────────── constants ─────────────────────────── */

const LS_BOARD = 'aetheria-bingo-board-v1';
const LS_NOTES = 'aetheria-bingo-notes-v1';

const BINGO_LINES: { id: string; label: string; cells: number[] }[] = [
  { id: 'r0', label: 'Row 1', cells: [0, 1, 2, 3] },
  { id: 'r1', label: 'Row 2', cells: [4, 5, 6, 7] },
  { id: 'r2', label: 'Row 3', cells: [8, 9, 10, 11] },
  { id: 'r3', label: 'Row 4', cells: [12, 13, 14, 15] },
  { id: 'c0', label: 'Column G', cells: [0, 4, 8, 12] },
  { id: 'c1', label: 'Column O', cells: [1, 5, 9, 13] },
  { id: 'c2', label: 'Column A', cells: [2, 6, 10, 14] },
  { id: 'c3', label: 'Column L', cells: [3, 7, 11, 15] },
  { id: 'd0', label: 'Diagonal ↘', cells: [0, 5, 10, 15] },
  { id: 'd1', label: 'Diagonal ↙', cells: [3, 6, 9, 12] },
];

const CHEERS = [
  'A full line falls — glory is yours.',
  'Another line of conquest complete!',
  'The board bows before your will.',
  'Ambition fulfilled — BINGO achieved!',
  'Heroes leave marks; you left a line.',
];

const FX_COLORS = ['#e8b84b', '#f0d27a', '#a06bff', '#4fd0e0', '#5fd6a0', '#ff6b8a', '#ffffff'];

const CAT_COLOR: Record<GoalCategory, string> = {
  career: 'var(--gold)',
  health: 'var(--mint)',
  learning: 'var(--cyan)',
  finance: 'var(--violet)',
  personal: 'var(--rose)',
};
const CAT_GLOW: Record<GoalCategory, string> = {
  career: 'var(--gold-glow)',
  health: 'var(--mint-glow)',
  learning: 'var(--cyan-glow)',
  finance: 'var(--violet-glow)',
  personal: 'var(--rose-glow)',
};

/* ─────────────────────── types ─────────────────────────────── */

type Note = { id: string; text: string; ts: string; edited?: boolean };
type AllNotes = Record<string, Note[]>;
type RewardData = { title: string; cat: GoalCategory; rank: string; xp: number; coins: number };
type BingoData = { line: string; cheer: string };
type AchData = { name: string; reward: string };

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  size: number;
  color: string;
  rot: number;
  vrot: number;
  shape: 'rect' | 'circle' | 'streamer';
  life: number;
  decay: number;
  wob: number;
  wobs: number;
}

/* ─────────────────────── helpers ────────────────────────────── */

function nowStamp() {
  const d = new Date();
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${M[d.getMonth()]} ${d.getDate()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function loadBoard(): (string | null)[] | null {
  try {
    const v = JSON.parse(localStorage.getItem(LS_BOARD) ?? 'null') as unknown;
    if (Array.isArray(v) && v.length === 16) return v as (string | null)[];
  } catch {}
  return null;
}

function buildBoard(goals: Goal[]): (string | null)[] {
  const active = goals.filter((g) => g.status !== 'archived').slice(0, 16);
  const board: (string | null)[] = Array(16).fill(null);
  active.forEach((g, i) => {
    board[i] = g.id;
  });
  return board;
}

function loadNotes(): AllNotes {
  try {
    return JSON.parse(localStorage.getItem(LS_NOTES) ?? '{}') as AllNotes;
  } catch {
    return {};
  }
}

/* ─────────────────────── AnimatedNumber ─────────────────────── */

function AnimatedNumber({ value, dur = 750 }: { value: number; dur?: number }) {
  const [disp, setDisp] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current,
      to = value;
    if (from === to) {
      setDisp(to);
      return;
    }
    let start = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(from + (to - from) * e));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, dur]);
  return <>{disp}</>;
}

/* ─────────────────────── HUD tile ───────────────────────────── */

function HudTile({
  label,
  ico,
  accent,
  glow,
  value,
  suffix,
  of: ofVal,
  sub,
}: {
  label: string;
  ico: string;
  accent: string;
  glow: string;
  value: number;
  suffix?: string;
  of?: number;
  sub: string;
}) {
  const [bumped, setBumped] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      setBumped(true);
      const t = setTimeout(() => setBumped(false), 600);
      prev.current = value;
      return () => clearTimeout(t);
    }
    return undefined;
  }, [value]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--r-md)] px-3 pt-3 pb-2.5',
        'border border-[var(--border)] transition-[transform,box-shadow] duration-200',
        'hover:-translate-y-0.5 hover:shadow-[0_8px_22px_oklch(0_0_0_/_0.4)]',
      )}
      style={{
        background: 'linear-gradient(180deg,var(--surface-2),var(--surface))',
        borderTopColor: accent,
        borderTopWidth: 2,
        animation: bumped ? 'bingo-deal 0.45s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
      }}
    >
      <div
        className="absolute -right-3 -top-3 w-14 h-14 rounded-full opacity-30 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }}
      />
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: accent, fontSize: 12 }}>{ico}</span>
        <span className="font-[var(--font-title)] text-[8px] tracking-[0.16em] text-[var(--text-lo)] uppercase whitespace-nowrap">
          {label}
        </span>
      </div>
      <div className="font-[var(--font-title)] text-[22px] font-extrabold leading-none flex items-baseline gap-1 text-[var(--text-hi)]">
        <AnimatedNumber value={value} />
        {suffix && (
          <small className="text-[11px] text-[var(--text-lo)] font-semibold">{suffix}</small>
        )}
        {ofVal != null && (
          <span className="text-[12px] text-[var(--text-dim)] font-bold">/{ofVal}</span>
        )}
      </div>
      <div className="font-[var(--font-code)] text-[9px] text-[var(--text-lo)] mt-1.5 tracking-[0.04em]">
        {sub}
      </div>
    </div>
  );
}

/* ─────────────────────── BingoCellItem ──────────────────────── */

function BingoCellItem({
  goal,
  idx,
  dealt,
  justDone,
  lineWin,
  onOpen,
}: {
  goal: Goal | null;
  idx: number;
  dealt: boolean;
  justDone: boolean;
  lineWin: boolean;
  onOpen: (idx: number) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const row = Math.floor(idx / 4),
    col = idx % 4;
  const delay = (row + col) * 65;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = btnRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const rip = document.createElement('span');
      const d = Math.max(rect.width, rect.height) * 2;
      Object.assign(rip.style, {
        position: 'absolute',
        borderRadius: '50%',
        pointerEvents: 'none',
        width: d + 'px',
        height: d + 'px',
        left: e.clientX - rect.left + 'px',
        top: e.clientY - rect.top + 'px',
        background: 'radial-gradient(circle, currentColor 0%, transparent 70%)',
        opacity: '0.35',
        transform: 'translate(-50%,-50%) scale(0)',
        transition: 'transform 0.55s ease-out, opacity 0.55s ease-out',
      });
      el.appendChild(rip);
      requestAnimationFrame(() => {
        rip.style.transform = 'translate(-50%,-50%) scale(1)';
        rip.style.opacity = '0';
      });
      setTimeout(() => rip.remove(), 600);
    }
    onOpen(idx);
  };

  if (!goal) {
    return (
      <div
        className="rounded-[var(--r-lg)] border border-[var(--border)] opacity-20 flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg,var(--surface-2),var(--surface))',
          aspectRatio: '1',
          animation: dealt
            ? `bingo-deal 0.6s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms both`
            : undefined,
          opacity: dealt ? undefined : 0,
        }}
      >
        <span className="text-[var(--text-dim)] text-[20px]">·</span>
      </div>
    );
  }

  const cat = CAT_MAP[goal.cat];
  const accent = CAT_COLOR[goal.cat];
  const glow = CAT_GLOW[goal.cat];
  const done = goal.status === 'completed';
  const active = goal.status === 'in-progress';
  const pct = Math.round(goal.progress * 100);
  const priToken = { high: '▲▲▲', medium: '▲▲', low: '▲' }[goal.priority];
  const priColor = { high: 'var(--rose)', medium: 'var(--gold)', low: 'var(--cyan)' }[
    goal.priority
  ];

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      aria-label={`${goal.title} — ${done ? 'completed' : active ? pct + '% complete' : 'not started'}`}
      className={cn(
        'relative overflow-hidden rounded-[var(--r-lg)] border text-left',
        'flex flex-col cursor-pointer transition-[border-color,box-shadow,transform] duration-200',
        'focus-visible:outline-none',
        done
          ? 'border-[var(--gold)]'
          : active
            ? 'border-[var(--border)]'
            : 'border-[var(--border)] opacity-65 saturate-50',
      )}
      style={{
        color: accent,
        background: done
          ? `radial-gradient(circle at 50% 42%, ${glow}, transparent 68%), linear-gradient(180deg,var(--surface-2),var(--surface))`
          : 'linear-gradient(180deg,var(--surface-2),var(--surface))',
        boxShadow: done
          ? `0 0 22px ${glow}, inset 0 0 22px oklch(from var(--gold) l c h / 0.08)`
          : lineWin
            ? `0 0 22px ${glow}`
            : undefined,
        padding: '11px 11px 10px',
        animation:
          [
            dealt ? `bingo-deal 0.6s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms both` : '',
            active && !done ? 'bingo-breathe 3.4s ease-in-out 1s infinite' : '',
            lineWin ? 'bingo-line-flash 1.1s ease-out' : '',
          ]
            .filter(Boolean)
            .join(', ') || undefined,
        opacity: dealt ? undefined : 0,
      }}
    >
      {/* done: shimmer overlay */}
      {done && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(120deg, transparent 38%, oklch(1 0 0 / 0.14) 50%, transparent 62%)',
            backgroundSize: '240% 100%',
            animation: 'bingo-shimmer 3.6s linear infinite',
          }}
        />
      )}

      {/* lock icon for not started */}
      {!done && !active && (
        <span className="absolute top-2 right-2 text-[10px] text-[var(--text-dim)]">🔒</span>
      )}

      {/* top row: cat icon + rank + priority */}
      <div className={cn('flex items-center gap-1.5 mb-auto', done && 'opacity-55')}>
        <span
          className="w-6 h-6 rounded-[var(--r-sm)] flex items-center justify-center text-[13px] shrink-0 border"
          style={{
            color: accent,
            background: `oklch(from ${accent} l c h / 0.1)`,
            borderColor: `oklch(from ${accent} l c h / 0.35)`,
          }}
        >
          {cat.ci}
        </span>
        <span
          className={cn(
            'w-[18px] h-[18px] rounded-[4px] inline-flex items-center justify-center font-[var(--font-title)] text-[9px] font-black shrink-0',
            RANK_STYLE[goal.rank],
          )}
        >
          {goal.rank}
        </span>
        <span
          className="ml-auto text-[8px] leading-none tracking-[-0.5px]"
          style={{ color: priColor }}
        >
          {priToken}
        </span>
      </div>

      {/* title */}
      <div
        className={cn(
          'font-[var(--font-title)] font-bold text-[var(--text-hi)] leading-[1.2] my-2',
          'overflow-hidden',
          done && 'opacity-85 text-[11px] relative z-[2]',
        )}
        style={{
          fontSize: 'clamp(11px, 1.4vw, 13px)',
          display: '-webkit-box',
          WebkitLineClamp: done ? 2 : 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {goal.title}
      </div>

      {/* progress bar (not done) */}
      {!done && (
        <div className="flex items-center gap-1.5 mt-auto">
          <div className="flex-1 h-1 bg-[var(--bg-3)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${pct}%`, background: accent, boxShadow: `0 0 6px ${accent}` }}
            />
          </div>
          <span
            className="font-[var(--font-code)] text-[9px] min-w-[26px] text-right"
            style={{ color: accent }}
          >
            {pct}%
          </span>
        </div>
      )}

      {/* daub stamp (done) */}
      {done && (
        <>
          <div
            className="absolute top-1/2 left-1/2 w-14 h-14 rounded-full z-[1] flex items-center justify-center text-[26px]"
            style={{
              transform: 'translate(-50%,-50%)',
              color: 'var(--gold)',
              background:
                'radial-gradient(circle, var(--gold-glow), oklch(0.78 0.16 82 / 0.05) 70%)',
              border: '1.5px solid oklch(0.78 0.16 82 / 0.55)',
              boxShadow: '0 0 18px var(--gold-glow)',
              textShadow: '0 0 10px var(--gold-glow)',
              animation: justDone
                ? 'bingo-daub 0.55s cubic-bezier(0.34,1.56,0.64,1) both'
                : undefined,
            }}
          >
            {goal.linkedTrophy ? '♛' : '✓'}
          </div>
          <div
            className="absolute left-0 right-0 bottom-0 z-[2] font-[var(--font-title)] text-[7.5px] tracking-[0.2em] uppercase text-center py-1"
            style={{
              color: 'oklch(0.83 0.16 82)',
              background: 'linear-gradient(0deg, oklch(0.78 0.16 82 / 0.16), transparent)',
            }}
          >
            Conquered
          </div>
        </>
      )}
    </button>
  );
}

/* ─────────────────────── BingoBoardGrid ─────────────────────── */

function BingoBoardGrid({
  cells,
  dealt,
  justDoneId,
  lineWinCells,
  onOpen,
}: {
  cells: (Goal | null)[];
  dealt: boolean;
  justDoneId: string | null;
  lineWinCells: number[];
  onOpen: (idx: number) => void;
}) {
  return (
    <div
      className="relative rounded-[var(--r-xl)] p-3 sm:p-5 overflow-hidden border border-[var(--border)] w-full"
      style={{ background: 'linear-gradient(180deg,var(--surface),var(--bg-1))' }}
    >
      {/* Corner ticks */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <span
          key={pos}
          className="absolute w-4 h-4 border-[1.5px] border-[var(--gold)] opacity-50 z-[2]"
          style={{
            top: pos.startsWith('t') ? 9 : undefined,
            bottom: pos.startsWith('b') ? 9 : undefined,
            left: pos.endsWith('l') ? 9 : undefined,
            right: pos.endsWith('r') ? 9 : undefined,
            borderRight: pos.endsWith('l') ? 'none' : undefined,
            borderLeft: pos.endsWith('r') ? 'none' : undefined,
            borderBottom: pos.startsWith('t') ? 'none' : undefined,
            borderTop: pos.startsWith('b') ? 'none' : undefined,
          }}
        />
      ))}

      {/* Board header */}
      <div className="flex items-center gap-2.5 mb-4 relative z-[1]">
        <span className="font-[var(--font-title)] text-[12px] font-bold tracking-[0.18em] text-[var(--text-hi)] uppercase">
          ⊞ &nbsp; The Glory Board
        </span>
        <div className="flex gap-1 ml-auto">
          {['G', 'O', 'A', 'L'].map((c) => (
            <span
              key={c}
              className="font-[var(--font-title)] text-[9px] font-bold tracking-[0.1em] w-[18px] text-center text-[var(--text-dim)]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div
        className="relative z-[1] grid grid-cols-4 gap-2 sm:gap-3"
        style={{ width: 'min(52vh, 520px)', maxWidth: '100%', aspectRatio: '1' }}
        role="grid"
        aria-label="Goal bingo board, 4 by 4"
      >
        {cells.map((goal, idx) => (
          <BingoCellItem
            key={goal?.id ?? `empty-${idx}`}
            goal={goal}
            idx={idx}
            dealt={dealt}
            justDone={!!goal && justDoneId === goal.id}
            lineWin={lineWinCells.includes(idx)}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── BingoLinesPanel ────────────────────── */

function BingoLinesPanel({
  cells,
  wonLineIds,
}: {
  cells: (Goal | null)[];
  wonLineIds: Set<string>;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-3.5">
      <div className="font-[var(--font-title)] text-[10px] tracking-[0.2em] text-[var(--gold)] uppercase mb-3 flex items-center gap-2">
        ⊞ Bingo Lines
        <span className="ml-auto font-[var(--font-code)] text-[10px] text-[var(--text-lo)]">
          {wonLineIds.size}/10
        </span>
      </div>
      <div className="flex flex-col">
        {BINGO_LINES.map((line) => {
          const won = wonLineIds.has(line.id);
          const done = line.cells.filter((i) => cells[i]?.status === 'completed').length;
          return (
            <div
              key={line.id}
              className="flex items-center gap-2 py-1.5 border-b border-dashed border-[var(--border-lo)] last:border-0"
            >
              <div className="flex gap-0.5 shrink-0">
                {line.cells.map((ci, k) => (
                  <span
                    key={k}
                    className="w-2.5 h-2.5 rounded-[2px] border transition-all duration-300"
                    style={
                      cells[ci]?.status === 'completed'
                        ? {
                            background: 'var(--gold)',
                            borderColor: 'var(--gold)',
                            boxShadow: '0 0 6px var(--gold-glow)',
                          }
                        : { background: 'var(--bg-3)', borderColor: 'var(--border)' }
                    }
                  />
                ))}
              </div>
              <span
                className={cn(
                  'font-[var(--font-title)] text-[10px] tracking-[0.06em] flex-1',
                  won ? 'text-[var(--gold)]' : 'text-[var(--text-md)]',
                )}
              >
                {line.label}
              </span>
              {won ? (
                <span className="font-[var(--font-title)] text-[7px] tracking-[0.18em] text-[var(--gold)] border border-[oklch(0.78_0.16_82_/_0.5)] rounded-full px-1.5 py-px">
                  BINGO
                </span>
              ) : (
                <span className="font-[var(--font-code)] text-[9px] text-[var(--text-dim)]">
                  {done}/4
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────── BingoLegend ────────────────────────── */

function BingoLegend() {
  const items = [
    {
      chip: '🔒',
      chipClass: 'opacity-60 saturate-[0.4] text-[var(--text-lo)]',
      name: 'Locked',
      desc: 'Not yet begun — tap to open',
    },
    {
      chip: '◐',
      chipClass:
        'text-[var(--cyan)] border-[oklch(0.78_0.16_205_/_0.5)] shadow-[0_0_10px_var(--cyan-glow)]',
      name: 'In Progress',
      desc: 'Underway, pulsing with intent',
    },
    {
      chip: '✓',
      chipClass: 'text-[var(--gold)] border-[var(--gold)] shadow-[0_0_10px_var(--gold-glow)]',
      name: 'Conquered',
      desc: 'Daubed — counts toward a line',
    },
  ];
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-3.5">
      <div className="font-[var(--font-title)] text-[10px] tracking-[0.2em] text-[var(--gold)] uppercase mb-3">
        ◇ Cell States
      </div>
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div key={it.name} className="flex items-center gap-2.5 py-1.5">
            <span
              className={cn(
                'w-[30px] h-[30px] rounded-[7px] shrink-0 flex items-center justify-center text-[13px] border border-[var(--border)]',
                it.chipClass,
              )}
            >
              {it.chip}
            </span>
            <div className="min-w-0">
              <div className="font-[var(--font-title)] text-[11px] tracking-[0.04em] text-[var(--text-hi)]">
                {it.name}
              </div>
              <div className="text-[9.5px] text-[var(--text-lo)] mt-0.5">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── BingoDetailPanel ───────────────────── */

function BingoDetailPanel({
  goal,
  notes,
  onClose,
  onToggleMilestone,
  onComplete,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: {
  goal: Goal;
  notes: Note[];
  onClose: () => void;
  onToggleMilestone: (goalId: string, msId: string) => void;
  onComplete: (goal: Goal) => void;
  onAddNote: (note: Note) => void;
  onEditNote: (noteId: string, text: string) => void;
  onDeleteNote: (noteId: string) => void;
}) {
  const cat = CAT_MAP[goal.cat];
  const accent = CAT_COLOR[goal.cat];
  const done = goal.status === 'completed';
  const pct = Math.round(goal.progress * 100);
  const msDone = goal.milestones.filter((m) => m.done).length;

  // notes
  const [draft, setDraft] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addNote = () => {
    const t = draft.trim();
    if (!t) return;
    onAddNote({ id: `n${Date.now()}`, text: t, ts: nowStamp() });
    setDraft('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 700);
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const priLabel = { high: 'High', medium: 'Medium', low: 'Low' }[goal.priority];
  const priCls = {
    high: 'text-[var(--rose)] border-[oklch(0.74_0.18_5_/_0.45)] bg-[oklch(0.74_0.18_5_/_0.1)]',
    medium: 'text-[var(--gold)] border-[oklch(0.78_0.16_82_/_0.45)] bg-[oklch(0.78_0.16_82_/_0.1)]',
    low: 'text-[var(--cyan)] border-[oklch(0.78_0.16_205_/_0.45)] bg-[oklch(0.78_0.16_205_/_0.1)]',
  }[goal.priority];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[800] bg-[oklch(0_0_0_/_0.55)] backdrop-blur-sm animate-[fade-in_0.3s_ease]"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-[810] flex flex-col border-l-[1.5px] overflow-hidden"
        style={{
          width: 440,
          maxWidth: '92vw',
          background: 'linear-gradient(180deg,var(--bg-2),var(--bg-1))',
          borderLeftColor: accent,
          boxShadow: `-24px 0 60px oklch(0 0 0 / 0.6)`,
          animation: 'bingo-deal 0.38s cubic-bezier(0.16,1,0.3,1)',
          color: accent,
        }}
        role="dialog"
        aria-label={goal.title}
      >
        {/* Banner */}
        <div
          className="relative overflow-hidden shrink-0 px-5 py-5 border-b border-[var(--border)]"
          style={{
            background: `radial-gradient(ellipse 80% 100% at 80% 0%, oklch(from ${accent} l c h / 0.18), transparent 70%), linear-gradient(180deg,var(--surface-2),var(--bg-2))`,
          }}
        >
          {/* left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: accent, boxShadow: `0 0 14px ${accent}` }}
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-[30px] h-[30px] rounded-[7px] bg-[var(--bg-2)] border border-[var(--border)] text-[var(--text-md)] text-[15px] flex items-center justify-center hover:text-[var(--rose)] hover:border-[oklch(0.74_0.18_5_/_0.5)] transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 mb-2.5">
            <span
              className="inline-flex items-center gap-1.5 font-[var(--font-title)] text-[8px] tracking-[0.14em] font-bold px-2.5 py-[3px] rounded-full border uppercase"
              style={{
                color: accent,
                borderColor: accent,
                background: `oklch(from ${accent} l c h / 0.1)`,
              }}
            >
              {cat.ci} {cat.label}
            </span>
            <span
              className={cn(
                'w-[22px] h-[22px] rounded-[5px] inline-flex items-center justify-center font-[var(--font-title)] text-[11px] font-black',
                RANK_STYLE[goal.rank],
              )}
            >
              {goal.rank}
            </span>
            {!done && (
              <span
                className={cn(
                  'ml-auto font-[var(--font-title)] text-[8px] tracking-[0.14em] font-bold px-2.5 py-[3px] rounded-full border uppercase',
                  priCls,
                )}
              >
                {priLabel}
              </span>
            )}
          </div>

          <div className="font-[var(--font-title)] text-[22px] font-bold tracking-[0.02em] text-[var(--text-hi)] leading-[1.15] pr-9">
            {goal.title}
          </div>

          <div className="flex gap-4 mt-3.5 items-center">
            <div className="relative w-[60px] h-[60px] shrink-0" style={{ color: accent }}>
              <div style={{ transform: 'rotate(-90deg)' }}>
                <ProgressRing value={goal.progress} size={60} stroke={5} />
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center font-[var(--font-title)] text-[16px] font-extrabold"
                style={{ color: accent }}
              >
                {done ? '✓' : pct}
              </div>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-baseline gap-1 font-[var(--font-title)] text-[14px] font-extrabold px-3 py-[5px] rounded-full bg-[var(--bg-2)] border text-[var(--violet)] border-[oklch(0.68_0.22_295_/_0.45)]">
                {goal.xp} <small className="text-[8px] tracking-[0.14em] opacity-70">XP</small>
              </span>
              <span className="inline-flex items-baseline gap-1 font-[var(--font-title)] text-[14px] font-extrabold px-3 py-[5px] rounded-full bg-[var(--bg-2)] border text-[var(--gold)] border-[oklch(0.78_0.16_82_/_0.45)]">
                {goal.coins}{' '}
                <small className="text-[8px] tracking-[0.14em] opacity-70">COINS</small>
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Vision */}
          <div>
            <div className="font-[var(--font-title)] text-[9px] tracking-[0.22em] text-[var(--text-lo)] uppercase mb-2 flex items-center gap-2">
              ◆ &nbsp; The Vision
            </div>
            <p className="text-[12.5px] text-[var(--text-md)] leading-[1.6]">{goal.desc}</p>
          </div>

          {/* Details */}
          <div>
            <div className="font-[var(--font-title)] text-[9px] tracking-[0.22em] text-[var(--text-lo)] uppercase mb-2">
              ▦ &nbsp; Details
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  k: 'Status',
                  v:
                    goal.status === 'completed'
                      ? 'Completed'
                      : goal.status === 'in-progress'
                        ? 'In Progress'
                        : 'Not Started',
                },
                { k: 'Rank', v: goal.rank },
                { k: 'Priority', v: priLabel },
                { k: 'Target', v: goal.targetLabel },
                { k: 'Days Left', v: done ? (goal.completedDate ?? 'Today') : `${goal.daysLeft}d` },
                { k: 'Progress', v: `${pct}%` },
              ].map(({ k, v }) => (
                <div
                  key={k}
                  className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2.5 py-2"
                >
                  <div className="font-[var(--font-title)] text-[7.5px] tracking-[0.16em] text-[var(--text-dim)] uppercase mb-1">
                    {k}
                  </div>
                  <div className="text-[12px] text-[var(--text-hi)] font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          {goal.milestones.length > 0 && (
            <div>
              <div className="font-[var(--font-title)] text-[9px] tracking-[0.22em] text-[var(--text-lo)] uppercase mb-2 flex items-center gap-2">
                ◈ &nbsp; Milestones
                <span className="ml-auto font-[var(--font-code)] text-[var(--text-dim)]">
                  {msDone}/{goal.milestones.length}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {goal.milestones.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-center gap-2.5 px-2 py-2 rounded-[var(--r-sm)] cursor-pointer transition-colors hover:bg-[oklch(1_0_0_/_0.03)]',
                    )}
                    onClick={() => onToggleMilestone(goal.id, m.id)}
                  >
                    <span
                      className={cn(
                        'w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center text-[11px] shrink-0 transition-all duration-200',
                        m.done
                          ? 'border-[currentColor] text-[var(--bg-0)]'
                          : 'border-[var(--border-hi)] bg-[var(--bg-2)] text-transparent',
                      )}
                      style={
                        m.done ? { background: accent, boxShadow: `0 0 8px ${accent}` } : undefined
                      }
                    >
                      {m.done ? '✓' : ''}
                    </span>
                    <span
                      className={cn(
                        'text-[12px]',
                        m.done ? 'text-[var(--text-dim)] line-through' : 'text-[var(--text-md)]',
                      )}
                    >
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategy note */}
          {goal.note && (
            <div
              className="px-3.5 py-3 border-l-2 rounded-r-[8px]"
              style={{ borderLeftColor: accent, background: `oklch(from ${accent} l c h / 0.07)` }}
            >
              <div
                className="font-[var(--font-title)] text-[8px] tracking-[0.24em] mb-1"
                style={{ color: accent }}
              >
                ◆ STRATEGY
              </div>
              <div className="text-[11.5px] text-[var(--text-md)] leading-[1.55] italic">
                {goal.note}
              </div>
            </div>
          )}

          {/* Linked trophy */}
          {goal.linkedTrophy && (
            <div className="font-[var(--font-code)] text-[10px] text-[var(--text-lo)]">
              ✧ Completing this unlocks the{' '}
              <span className="text-[var(--gold)]">{goal.linkedTrophy}</span> trophy
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="font-[var(--font-title)] text-[9px] tracking-[0.22em] text-[var(--text-lo)] uppercase mb-2 flex items-center gap-2">
              ✎ &nbsp; Chronicle · Notes
              <span className="ml-auto font-[var(--font-code)] text-[var(--text-dim)]">
                {notes.length}
              </span>
            </div>

            {/* Add note */}
            <div className="flex flex-col gap-2 mb-3">
              <textarea
                ref={taRef}
                className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-[var(--r-md)] px-3 py-2.5 text-[12px] text-[var(--text-hi)] resize-none min-h-[42px] leading-[1.55] outline-none overflow-hidden placeholder:text-[var(--text-dim)] transition-[border-color,box-shadow] focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_var(--gold-glow)]"
                value={draft}
                placeholder="Log a note — a reflection, a blocker, a small win…"
                onChange={(e) => {
                  setDraft(e.target.value);
                  autoGrow(e.target);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote();
                }}
              />
              <div className="flex items-center gap-2">
                <span className="font-[var(--font-code)] text-[9px] text-[var(--text-dim)]">
                  ⌘ + ⏎ to save
                </span>
                <button
                  type="button"
                  disabled={!draft.trim()}
                  onClick={addNote}
                  className={cn(
                    'ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] font-[var(--font-title)] text-[9px] font-extrabold tracking-[0.14em] uppercase border transition-all duration-200',
                    'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0',
                    noteSaved
                      ? 'bg-[var(--mint)] border-[var(--mint)] text-[#021]'
                      : 'text-[#0a0400] border-[var(--gold)] hover:-translate-y-px hover:shadow-[0_0_20px_var(--gold-glow)]',
                  )}
                  style={
                    noteSaved
                      ? undefined
                      : {
                          background: 'linear-gradient(135deg,var(--gold-2),var(--gold))',
                          boxShadow: '0 0 12px var(--gold-glow)',
                        }
                  }
                >
                  {noteSaved ? '✓ Saved' : '✦ Add Note'}
                </button>
              </div>
            </div>

            {/* Note list */}
            {notes.length === 0 ? (
              <div className="text-center py-4 text-[11px] italic text-[var(--text-dim)]">
                <span className="block text-[22px] opacity-50 mb-1.5">✶</span>
                No entries yet. The chronicle awaits its first line.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    accent={accent}
                    editingId={editingId}
                    editText={editText}
                    onStartEdit={() => {
                      setEditingId(note.id);
                      setEditText(note.text);
                    }}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => {
                      if (editText.trim()) onEditNote(note.id, editText.trim());
                      setEditingId(null);
                    }}
                    onEditTextChange={setEditText}
                    onDelete={() => onDeleteNote(note.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3.5 border-t border-[var(--border)] bg-[var(--bg-2)] flex gap-2.5">
          {done ? (
            <div
              className="flex-1 flex items-center justify-center gap-2 rounded-[9px] py-3 font-[var(--font-title)] text-[12px] font-extrabold tracking-[0.14em] uppercase text-[#021] shadow-[0_0_18px_var(--mint-glow)]"
              style={{ background: 'linear-gradient(135deg,oklch(0.58_0.14_162),var(--mint))' }}
            >
              ✦ Ambition Conquered
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onComplete(goal)}
              className="flex-1 flex items-center justify-center gap-2 rounded-[9px] py-3 font-[var(--font-title)] text-[12px] font-extrabold tracking-[0.16em] uppercase text-[#0a0400] border border-[var(--gold)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_32px_var(--gold-glow)]"
              style={{
                background: 'linear-gradient(135deg,var(--gold-2),var(--gold))',
                boxShadow: '0 0 20px var(--gold-glow), inset 0 0 8px oklch(1 0 0 / 0.2)',
              }}
            >
              <span className="text-[16px]">✦</span> Conquer This Goal
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function NoteCard({
  note,
  accent,
  editingId,
  editText,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditTextChange,
  onDelete,
}: {
  note: Note;
  accent: string;
  editingId: string | null;
  editText: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditTextChange: (v: string) => void;
  onDelete: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const editing = editingId === note.id;
  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      taRef.current.style.height = 'auto';
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 200) + 'px';
    }
  }, [editing]);

  return (
    <div
      className="bg-[var(--bg-2)] border border-[var(--border)] rounded-r-[9px] px-3 py-2.5"
      style={{ borderLeft: `2px solid ${accent}` }}
    >
      {editing ? (
        <>
          <textarea
            ref={taRef}
            className="w-full bg-[var(--bg-3)] border rounded-[7px] px-2.5 py-2 text-[12px] text-[var(--text-hi)] resize-vertical min-h-[54px] outline-none leading-[1.55]"
            style={{ borderColor: accent }}
            value={editText}
            onChange={(e) => {
              onEditTextChange(e.target.value);
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 200) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
          />
          <div className="flex gap-1.5 mt-1.5 justify-end">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-1 text-[9px] font-bold font-[var(--font-title)] tracking-[0.1em] uppercase text-[var(--text-md)] bg-[var(--bg-3)] border border-[var(--border)] rounded-[7px] hover:text-[var(--text-hi)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              className="px-3 py-1 text-[9px] font-bold font-[var(--font-title)] tracking-[0.1em] uppercase text-[#0a0400] rounded-[7px]"
              style={{ background: 'linear-gradient(135deg,var(--gold-2),var(--gold))' }}
            >
              ✓ Save
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-[12px] text-[var(--text-md)] leading-[1.55] whitespace-pre-wrap break-words">
            {note.text}
          </div>
          <div className="flex items-center gap-2.5 mt-2 group">
            <span className="font-[var(--font-code)] text-[9px] text-[var(--text-dim)] tracking-[0.04em]">
              ◷ {note.ts}
              {note.edited && <span className="italic"> · edited</span>}
            </span>
            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={onStartEdit}
                className="w-6 h-6 rounded-[5px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-lo)] text-[11px] flex items-center justify-center hover:text-[var(--gold)] hover:border-[var(--gold)] transition-colors"
              >
                ✎
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="w-6 h-6 rounded-[5px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-lo)] text-[11px] flex items-center justify-center hover:text-[var(--rose)] hover:border-[oklch(0.74_0.18_5_/_0.6)] transition-colors"
              >
                🗑
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────── FX overlays ────────────────────────── */

function RewardPopup({ data, onDone }: { data: RewardData; onDone: () => void }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 2200);
    const t2 = setTimeout(onDone, 2650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  const cat = CAT_MAP[data.cat];
  return (
    <div
      className="fixed left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 z-[1600] pointer-events-none w-[340px] max-w-[90vw] border-[1.5px] border-[var(--gold)] rounded-[var(--r-xl)] px-6 py-6 text-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg,var(--bg-2),var(--bg-1))',
        boxShadow: '0 0 60px var(--gold-glow), 0 30px 70px oklch(0 0 0 / 0.6)',
        animation: out
          ? 'bingo-reward-out 0.4s cubic-bezier(0.16,1,0.3,1) forwards'
          : 'bingo-reward-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
      role="status"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, var(--gold-glow), transparent 60%)',
          opacity: 0.5,
        }}
      />
      <div
        className="relative w-[78px] h-[78px] mx-auto mb-3.5 rounded-full flex items-center justify-center text-[38px]"
        style={{
          color: 'var(--gold)',
          background: 'radial-gradient(circle, var(--gold-glow), oklch(0.78 0.16 82 / 0.05))',
          border: '2px solid var(--gold)',
          boxShadow: '0 0 30px var(--gold-glow)',
          animation: 'bingo-medal-spin 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {cat.ci}
        <div
          className="absolute inset-[-8px] rounded-full border border-dashed border-[oklch(0.78_0.16_82_/_0.4)]"
          style={{ animation: 'bingo-dashed-spin 8s linear infinite' }}
        />
      </div>
      <div className="relative font-[var(--font-title)] text-[9px] tracking-[0.3em] text-[var(--gold)] mb-1.5">
        ✦ &nbsp; AMBITION CONQUERED &nbsp; ✦
      </div>
      <div className="relative font-[var(--font-title)] text-[22px] font-extrabold tracking-[0.04em] leading-[1.1] text-[var(--text-hi)]">
        {data.title}
      </div>
      <div className="relative text-[12px] text-[var(--text-md)] mt-1.5">
        {cat.label} · Rank {data.rank}
      </div>
      <div className="relative flex gap-2.5 justify-center mt-4">
        <span className="inline-flex items-baseline gap-1.5 font-[var(--font-title)] text-[17px] font-extrabold px-4 py-1.5 rounded-full bg-[oklch(0_0_0_/_0.3)] border text-[var(--violet)] border-[oklch(0.68_0.22_295_/_0.5)]">
          +{data.xp} <small className="text-[8px] tracking-[0.16em] opacity-75">XP</small>
        </span>
        <span className="inline-flex items-baseline gap-1.5 font-[var(--font-title)] text-[17px] font-extrabold px-4 py-1.5 rounded-full bg-[oklch(0_0_0_/_0.3)] border text-[var(--gold)] border-[oklch(0.78_0.16_82_/_0.5)]">
          +{data.coins} <small className="text-[8px] tracking-[0.16em] opacity-75">COINS</small>
        </span>
      </div>
    </div>
  );
}

function BingoBannerFX({ data, onDone }: { data: BingoData; onDone: () => void }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 2600);
    const t2 = setTimeout(onDone, 3100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[1700] pointer-events-none flex flex-col items-center justify-center gap-1"
      style={{ animation: out ? 'bingo-fade-out 0.5s ease forwards' : undefined }}
      role="status"
    >
      {/* wave ring */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--gold)]"
        style={{
          width: 10,
          height: 10,
          boxShadow: '0 0 40px var(--gold-glow)',
          animation: 'bingo-wave 1.1s cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      />
      <div
        className="font-[var(--font-title)] font-black tracking-[0.14em] leading-none"
        style={{
          fontSize: 'clamp(64px,16vw,200px)',
          background:
            'linear-gradient(135deg,var(--gold) 0%,oklch(0.85 0.2 60) 30%,var(--violet) 70%,var(--cyan) 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 30px var(--gold-glow))',
          animation: 'bingo-word 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        BINGO!
      </div>
      <div
        className="font-[var(--font-title)] font-semibold tracking-[0.1em] text-[var(--text-hi)] text-center px-5"
        style={{
          fontSize: 'clamp(13px,2vw,19px)',
          textShadow: '0 2px 14px oklch(0 0 0 / 0.8)',
          animation: 'fade-in 0.6s 0.2s ease both',
        }}
      >
        {data.cheer}
      </div>
      <div
        className="font-[var(--font-title)] tracking-[0.28em] uppercase text-[var(--gold)] mt-2"
        style={{ fontSize: 'clamp(11px,1.6vw,14px)', animation: 'fade-in 0.6s 0.3s ease both' }}
      >
        ◆ {data.line} ◆
      </div>
    </div>
  );
}

function AchievementToast({ data, onDone }: { data: AchData; onDone: () => void }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 3400);
    const t2 = setTimeout(onDone, 3850);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className="fixed top-[18px] left-1/2 z-[1650] flex items-center gap-3.5 w-[360px] max-w-[92vw] border border-[var(--gold)] rounded-[var(--r-lg)] px-4 py-3.5"
      style={{
        background: 'linear-gradient(135deg,var(--bg-2),oklch(0.18 0.15 295 / 0.4))',
        boxShadow: '0 0 30px var(--gold-glow), 0 18px 40px oklch(0 0 0 / 0.5)',
        animation: out
          ? 'bingo-ach-out 0.4s cubic-bezier(0.16,1,0.3,1) forwards'
          : 'bingo-ach-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
      role="status"
    >
      <div
        className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-[22px] text-[var(--gold)] border-2 border-[var(--gold)]"
        style={{
          background: 'radial-gradient(circle, var(--gold-glow), transparent 70%)',
          boxShadow: '0 0 16px var(--gold-glow)',
        }}
      >
        ♛
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-[var(--font-title)] text-[8px] tracking-[0.24em] text-[var(--gold)] mb-0.5">
          ✧ &nbsp; TROPHY UNLOCKED
        </div>
        <div className="font-[var(--font-title)] text-[15px] font-bold text-[var(--text-hi)] tracking-[0.02em]">
          {data.name}
        </div>
        <div className="font-[var(--font-code)] text-[10px] text-[var(--violet)] mt-0.5">
          {data.reward}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── BingoView (main) ───────────────────── */

export interface BingoViewProps {
  goals: Goal[];
  streak: number;
  coins: number;
  gems: number;
  onCompleteGoal: (goal: Goal) => void;
  onToggleMilestone: (goalId: string, msId: string) => void;
}

export function BingoView({ goals, streak, onCompleteGoal, onToggleMilestone }: BingoViewProps) {
  /* ── board state ── */
  const [boardGoalIds, setBoardGoalIds] = useState<(string | null)[]>(
    () => loadBoard() ?? Array(16).fill(null),
  );
  const [boardInitialized, setBoardInitialized] = useState(false);

  // Initialize the board from goals once they arrive — validate persisted IDs against
  // current goals, or build fresh. Render-phase init (not an effect) keeps it one-shot.
  if (!boardInitialized && goals.length > 0) {
    setBoardInitialized(true);
    const saved = loadBoard();
    if (saved) {
      // keep IDs that still exist (even if now archived for display)
      const knownIds = new Set(goals.map((g) => g.id));
      setBoardGoalIds(saved.map((id) => (id && knownIds.has(id) ? id : null)));
    } else {
      setBoardGoalIds(buildBoard(goals));
    }
  }

  // Persist board
  useEffect(() => {
    if (!boardInitialized) return;
    try {
      localStorage.setItem(LS_BOARD, JSON.stringify(boardGoalIds));
    } catch {}
  }, [boardGoalIds, boardInitialized]);

  /* ── notes ── */
  const [allNotes, setAllNotes] = useState<AllNotes>(loadNotes);
  useEffect(() => {
    try {
      localStorage.setItem(LS_NOTES, JSON.stringify(allNotes));
    } catch {}
  }, [allNotes]);

  /* ── FX/animation state ── */
  const [dealt, setDealt] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [justDoneId, setJustDoneId] = useState<string | null>(null);
  const [lineWinCells, setLineWinCells] = useState<number[]>([]);
  const [shaking, setShaking] = useState(false);
  const [reward, setReward] = useState<RewardData | null>(null);
  const [bingo, setBingo] = useState<BingoData | null>(null);
  const [ach, setAch] = useState<AchData | null>(null);

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setDealt(true), 200);
    return () => clearTimeout(t);
  }, []);

  /* ── canvas FX ── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const fxRef = useRef<{ confetti(): void; fireworks(n?: number): void } | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const spawn = (
      x: number,
      y: number,
      opts: Partial<{
        count: number;
        spread: number;
        angle: number;
        power: number;
        gravity: number;
        colors: string[];
        upward: boolean;
      }> = {},
    ) => {
      const {
        count = 120,
        spread = Math.PI * 2,
        angle = -Math.PI / 2,
        power = 9,
        gravity = 0.18,
        colors = FX_COLORS,
        upward = false,
      } = opts;
      for (let i = 0; i < count; i++) {
        const a = angle + rand(-spread / 2, spread / 2);
        const v = rand(power * 0.4, power);
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(a) * v + rand(-0.6, 0.6),
          vy: Math.sin(a) * v - (upward ? rand(2, 5) : 0),
          g: gravity,
          size: rand(5, 11),
          color: colors[Math.floor(Math.random() * colors.length)]!,
          rot: rand(0, Math.PI * 2),
          vrot: rand(-0.3, 0.3),
          shape: Math.random() < 0.45 ? 'rect' : Math.random() < 0.7 ? 'circle' : 'streamer',
          life: 1,
          decay: rand(0.006, 0.014),
          wob: rand(0, Math.PI * 2),
          wobs: rand(0.05, 0.13),
        });
      }
      if (!runningRef.current) loop();
    };

    const loop = () => {
      runningRef.current = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]!;
        p.vy += p.g;
        p.vx *= 0.99;
        p.wob += p.wobs;
        p.x += p.vx + Math.cos(p.wob) * 0.6;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life -= p.decay;
        if (p.life <= 0 || p.y > window.innerHeight + 40) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else if (p.shape === 'streamer') {
          ctx.fillRect(-p.size / 4, -p.size, p.size / 2, p.size * 2.2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        runningRef.current = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    fxRef.current = {
      confetti() {
        const W = window.innerWidth,
          H = window.innerHeight;
        spawn(W * 0.5, H * 0.42, { count: 90, spread: Math.PI * 2, power: 11 });
        spawn(0, H, {
          count: 70,
          angle: -Math.PI / 3,
          spread: Math.PI / 3,
          power: 16,
          upward: true,
        });
        spawn(W, H, {
          count: 70,
          angle: -(Math.PI * 2) / 3,
          spread: Math.PI / 3,
          power: 16,
          upward: true,
        });
      },
      fireworks(n = 5) {
        const W = window.innerWidth,
          H = window.innerHeight;
        for (let k = 0; k < n; k++) {
          setTimeout(() => {
            spawn(rand(W * 0.15, W * 0.85), rand(H * 0.18, H * 0.55), {
              count: 80,
              spread: Math.PI * 2,
              power: 13,
              gravity: 0.12,
              colors: [FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)]!, ...FX_COLORS],
            });
          }, k * 260);
        }
      },
    };

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      particlesRef.current = [];
    };
  }, []);

  /* ── derived ── */
  const boardCells = useMemo<(Goal | null)[]>(
    () => boardGoalIds.map((id) => (id ? (goals.find((g) => g.id === id) ?? null) : null)),
    [boardGoalIds, goals],
  );

  const wonLines = useMemo(
    () => BINGO_LINES.filter((l) => l.cells.every((i) => boardCells[i]?.status === 'completed')),
    [boardCells],
  );

  const wonLineIds = useMemo(() => new Set(wonLines.map((l) => l.id)), [wonLines]);

  const stats = useMemo(() => {
    const filled = boardCells.filter(Boolean).length;
    const completed = boardCells.filter((c) => c?.status === 'completed').length;
    const active = boardCells.filter((c) => c?.status === 'in-progress').length;
    const total = filled || 1;
    const avg = Math.round((boardCells.reduce((a, c) => a + (c?.progress ?? 0), 0) / total) * 100);
    const xpEarned = boardCells
      .filter((c) => c?.status === 'completed')
      .reduce((a, c) => a + (c?.xp ?? 0), 0);
    return { filled, completed, active, avg, xpEarned };
  }, [boardCells]);

  /* ── detect newly completed goals ── */
  const prevCompletedIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    const cur = new Set(boardCells.filter((c) => c?.status === 'completed').map((c) => c!.id));
    if (prevCompletedIds.current === null) {
      prevCompletedIds.current = cur;
      return;
    }
    const newIds = [...cur].filter((id) => !prevCompletedIds.current!.has(id));
    if (newIds.length > 0) {
      const goal = goals.find((g) => g.id === newIds[0]);
      if (goal) {
        setJustDoneId(goal.id);
        setTimeout(() => setJustDoneId(null), 950);
        fxRef.current?.confetti();
        setReward({
          title: goal.title,
          cat: goal.cat,
          rank: goal.rank,
          xp: goal.xp,
          coins: goal.coins,
        });
        if (goal.linkedTrophy) {
          setTimeout(
            () => setAch({ name: goal.linkedTrophy!, reward: `+${goal.xp} XP · +${goal.coins} ◉` }),
            650,
          );
        }
      }
    }
    prevCompletedIds.current = cur;
  }, [boardCells, goals]);

  /* ── detect newly won bingo lines ── */
  const prevWonLineIds = useRef<Set<string> | null>(null);
  const shake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 650);
  }, []);

  useEffect(() => {
    if (prevWonLineIds.current === null) {
      prevWonLineIds.current = new Set(wonLines.map((l) => l.id));
      return;
    }
    const newLines = wonLines.filter((l) => !prevWonLineIds.current!.has(l.id));
    if (newLines.length > 0) {
      const flashCells = [...new Set(newLines.flatMap((l) => l.cells))];
      setTimeout(() => {
        setLineWinCells(flashCells);
        setTimeout(() => setLineWinCells([]), 1300);
        fxRef.current?.fireworks(6);
        shake();
        setBingo({
          line: newLines[0]!.label,
          cheer: CHEERS[Math.floor(Math.random() * CHEERS.length)]!,
        });
      }, 950);
    }
    prevWonLineIds.current = new Set(wonLines.map((l) => l.id));
  }, [wonLines, shake]);

  /* ── reset board ── */
  const resetBoard = useCallback(() => {
    const fresh = buildBoard(goals);
    setBoardGoalIds(fresh);
    prevCompletedIds.current = null;
    prevWonLineIds.current = null;
    setSelectedIdx(null);
    setLineWinCells([]);
    setReward(null);
    setBingo(null);
    setAch(null);
    // Re-trigger entrance
    setDealt(false);
    setTimeout(() => setDealt(true), 200);
  }, [goals]);

  /* ── selected goal for detail panel ── */
  const selectedGoal = selectedIdx != null ? (boardCells[selectedIdx] ?? null) : null;

  /* ── note handlers ── */
  const goalNotes = selectedGoal ? (allNotes[selectedGoal.id] ?? []) : [];
  const addNote = useCallback(
    (note: Note) => {
      if (!selectedGoal) return;
      setAllNotes((prev) => ({
        ...prev,
        [selectedGoal.id]: [note, ...(prev[selectedGoal.id] ?? [])],
      }));
    },
    [selectedGoal],
  );
  const editNote = useCallback(
    (noteId: string, text: string) => {
      if (!selectedGoal) return;
      setAllNotes((prev) => ({
        ...prev,
        [selectedGoal.id]: (prev[selectedGoal.id] ?? []).map((n) =>
          n.id === noteId ? { ...n, text, edited: true } : n,
        ),
      }));
    },
    [selectedGoal],
  );
  const deleteNote = useCallback(
    (noteId: string) => {
      if (!selectedGoal) return;
      setAllNotes((prev) => ({
        ...prev,
        [selectedGoal.id]: (prev[selectedGoal.id] ?? []).filter((n) => n.id !== noteId),
      }));
    },
    [selectedGoal],
  );

  return (
    <div
      className="flex flex-col gap-4"
      style={{ animation: shaking ? 'bingo-shake 0.65s cubic-bezier(0.16,1,0.3,1)' : undefined }}
    >
      {/* Canvas FX */}
      <canvas ref={canvasRef} className="fixed inset-0 z-[1500] pointer-events-none" aria-hidden />

      {/* Page header */}
      <div className="flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-[var(--font-title)] text-[8px] tracking-[0.2em] text-[var(--gold)] uppercase mb-1">
            ⊞ &nbsp; THE GLORY BOARD · 2026 &nbsp; ⊞
          </div>
          <h2 className="font-[var(--font-title)] text-[22px] font-black text-[var(--text-hi)] tracking-[0.04em] leading-none mb-1.5">
            Goal Bingo
          </h2>
          <p className="text-[10.5px] text-[var(--text-mid)] leading-[1.55] max-w-[500px]">
            Sixteen ambitions, one board. Conquer goals to daub their cells — complete a full
            <span className="text-[var(--cyan)] font-bold"> row, column, or diagonal</span> to land
            a BINGO.
          </p>
        </div>
        <button
          type="button"
          onClick={resetBoard}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] text-[10px] font-bold text-[var(--text-mid)] font-[var(--font-title)] hover:border-[oklch(0.74_0.17_85_/_0.3)] hover:text-[var(--text-hi)] transition-colors"
        >
          ↺ Reset Board
        </button>
      </div>

      {/* HUD */}
      <div className="grid grid-cols-2 min-[540px]:grid-cols-4 sm:grid-cols-7 gap-2.5">
        <HudTile
          label="Ambitions"
          ico="◈"
          accent="var(--violet)"
          glow="var(--violet-glow)"
          value={stats.filled}
          sub="on the board"
        />
        <HudTile
          label="Conquered"
          ico="✓"
          accent="var(--mint)"
          glow="var(--mint-glow)"
          value={stats.completed}
          of={stats.filled}
          sub="cells daubed"
        />
        <HudTile
          label="Progress"
          ico="◐"
          accent="var(--cyan)"
          glow="var(--cyan-glow)"
          value={stats.avg}
          suffix="%"
          sub="board average"
        />
        <HudTile
          label="Streak"
          ico="✦"
          accent="var(--rose)"
          glow="var(--rose-glow)"
          value={streak}
          suffix="d"
          sub="unbroken"
        />
        <HudTile
          label="XP Earned"
          ico="◆"
          accent="var(--violet)"
          glow="var(--violet-glow)"
          value={stats.xpEarned}
          sub="from conquests"
        />
        <HudTile
          label="Bingo Lines"
          ico="⊞"
          accent="var(--gold)"
          glow="var(--gold-glow)"
          value={wonLineIds.size}
          of={10}
          sub="lines lit"
        />
        <HudTile
          label="Active"
          ico="❖"
          accent="var(--cyan)"
          glow="var(--cyan-glow)"
          value={stats.active}
          sub="in progress"
        />
      </div>

      {/* Board + Aside */}
      <div className="flex flex-col xl:flex-row gap-5 xl:items-start">
        <div className="w-full xl:w-auto shrink-0">
          <BingoBoardGrid
            cells={boardCells}
            dealt={dealt}
            justDoneId={justDoneId}
            lineWinCells={lineWinCells}
            onOpen={setSelectedIdx}
          />
        </div>
        <div className="w-full xl:w-[270px] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3.5">
          <BingoLinesPanel cells={boardCells} wonLineIds={wonLineIds} />
          <BingoLegend />
        </div>
      </div>

      {/* Detail panel */}
      {selectedGoal && (
        <BingoDetailPanel
          goal={selectedGoal}
          notes={goalNotes}
          onClose={() => setSelectedIdx(null)}
          onToggleMilestone={onToggleMilestone}
          onComplete={(goal) => {
            onCompleteGoal(goal);
            setSelectedIdx(null);
          }}
          onAddNote={addNote}
          onEditNote={editNote}
          onDeleteNote={deleteNote}
        />
      )}

      {/* FX overlays */}
      {reward && <RewardPopup data={reward} onDone={() => setReward(null)} />}
      {bingo && <BingoBannerFX data={bingo} onDone={() => setBingo(null)} />}
      {ach && <AchievementToast data={ach} onDone={() => setAch(null)} />}
    </div>
  );
}
