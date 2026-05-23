import { cn } from '@/libs/utils';

import {
  DIFF_LIST,
  TASK_CATEGORIES,
  type TaskCat,
  type TaskDiff,
} from '../data/mock';

export type ViewMode = 'day' | 'week' | 'month' | 'all';

interface PageHeaderProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  filterCat: TaskCat | 'all';
  onFilterCat: (c: TaskCat | 'all') => void;
  filterDiff: TaskDiff | 'all';
  onFilterDiff: (d: TaskDiff | 'all') => void;
  splitMode: 'week' | 'month';
  onSplitMode: (m: 'week' | 'month') => void;
  search: string;
  onSearch: (s: string) => void;
  onForge: () => void;
  /** Counts for the subtitle */
  todayDone: number;
  todayTotal: number;
  weekDone: number;
  weekTotal: number;
}

export function PageHeader({
  view,
  onViewChange,
  filterCat,
  onFilterCat,
  filterDiff,
  onFilterDiff,
  splitMode,
  onSplitMode,
  search,
  onSearch,
  onForge,
  todayDone,
  todayTotal,
  weekDone,
  weekTotal,
}: PageHeaderProps) {
  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const yr = now.getFullYear();

  return (
    <div className={headerWrap}>
      {/* ── Title block ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className={tagLine}>✦ &nbsp; CHRONICLE · {monthName} {yr} &nbsp; ✦</div>
        <h1 className={titleText}>Quest Log</h1>
        <p className="text-[10px] mt-0.5">
          <span className="text-[var(--text-hi)] font-semibold">{todayDone}</span>
          <span className="text-[var(--text-lo)]"> of {todayTotal} cleared today · </span>
          <span className="text-[var(--text-hi)] font-semibold">{weekDone}</span>
          <span className="text-[var(--text-lo)]"> of {weekTotal} this week · combo </span>
          <span className="text-[var(--violet)] font-bold">×3</span>
          <span className="text-[var(--text-lo)]"> active until midnight.</span>
        </p>
      </div>

      {/* ── Right: view switch + forge ────────────────────────────────────── */}
      <div className="flex items-center gap-2 ml-auto">
        <ViewSwitch view={view} onChange={onViewChange} />
        <button type="button" className={forgeBtn} onClick={onForge}>
          <span>＋</span> Forge Quest
        </button>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className={filterBar}>
        {/* Realm chips */}
        <FilterGroup label="Realm">
          <Chip
            active={filterCat === 'all'}
            onClick={() => onFilterCat('all')}
          >
            All
          </Chip>
          {TASK_CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={filterCat === c.id}
              activeColor={`var(--${c.color})`}
              onClick={() => onFilterCat(filterCat === c.id ? 'all' : (c.id as TaskCat))}
            >
              <span className="mr-0.5">{c.icon}</span>{c.label}
            </Chip>
          ))}
        </FilterGroup>

        {/* Rank chips */}
        <FilterGroup label="Rank">
          <Chip active={filterDiff === 'all'} onClick={() => onFilterDiff('all')}>Any</Chip>
          {DIFF_LIST.map((d) => (
            <Chip
              key={d}
              active={filterDiff === d}
              activeColor={DIFF_ACTIVE_COLORS[d]}
              onClick={() => onFilterDiff(filterDiff === d ? 'all' : d)}
            >
              {d}
            </Chip>
          ))}
        </FilterGroup>

        {/* Side panel toggle — day view only */}
        {view === 'day' && (
          <FilterGroup label="Side panel" className="ml-auto">
            <div className={segControl}>
              <button
                type="button"
                className={cn(segBtn, splitMode === 'week' && segBtnActive)}
                onClick={() => onSplitMode('week')}
              >
                Week
              </button>
              <button
                type="button"
                className={cn(segBtn, splitMode === 'month' && segBtnActive)}
                onClick={() => onSplitMode('month')}
              >
                Month
              </button>
            </div>
          </FilterGroup>
        )}

        {/* Search */}
        <div className={cn('flex items-center', view !== 'day' && 'ml-auto')}>
          <div className={searchBox}>
            <span className="text-[var(--text-lo)] text-[12px] shrink-0">⌕</span>
            <input
              type="text"
              className={searchInput}
              placeholder="Search quests, tags…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View switch ──────────────────────────────────────────────────────────────

const VIEW_META: Array<{ id: ViewMode; glyph: string; label: string }> = [
  { id: 'day',   glyph: '◐', label: 'DAY'   },
  { id: 'week',  glyph: '◧', label: 'WEEK'  },
  { id: 'month', glyph: '▦', label: 'MONTH' },
  { id: 'all',   glyph: '≡', label: 'ALL'   },
];

function ViewSwitch({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] overflow-hidden">
      {VIEW_META.map((v) => (
        <button
          key={v.id}
          type="button"
          className={cn(vsBtnBase, view === v.id && vsBtnActive)}
          onClick={() => onChange(v.id)}
        >
          {v.glyph} <span>{v.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Filter group ─────────────────────────────────────────────────────────────

function FilterGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      <span className="text-[8px] tracking-[0.12em] text-[var(--text-lo)] font-[var(--font-title)] font-bold">
        {label}
      </span>
      {children}
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

interface ChipProps {
  active: boolean;
  activeColor?: string;
  onClick: () => void;
  children: React.ReactNode;
}

function Chip({ active, activeColor, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(chipBase, active && chipActive)}
      style={
        active && activeColor
          ? { borderColor: activeColor, color: activeColor }
          : undefined
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const headerWrap =
  'bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] px-4 pt-3 pb-3 flex flex-wrap gap-2 shrink-0';

const tagLine =
  'text-[8px] tracking-[0.18em] text-[var(--gold)] font-[var(--font-title)] font-bold opacity-70';
const titleText =
  'text-[22px] font-black text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.05em] leading-none';

const forgeBtn =
  'flex items-center gap-1.5 px-3 py-1.5 bg-[oklch(0.74_0.17_85_/_0.12)] border border-[oklch(0.74_0.17_85_/_0.4)] text-[var(--gold)] text-[9px] font-bold font-[var(--font-title)] tracking-[0.08em] rounded-[var(--r-sm)] hover:bg-[oklch(0.74_0.17_85_/_0.2)] hover:border-[oklch(0.74_0.17_85_/_0.6)] transition-all duration-150';

const filterBar =
  'w-full flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border)] mt-1';

const chipBase =
  'text-[8px] font-bold px-2 py-1 rounded-[var(--r-sm)] border border-[var(--border)] text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.06em] transition-all duration-150 hover:text-[var(--text-hi)] hover:border-[oklch(0.74_0.17_85_/_0.3)] cursor-pointer';
const chipActive =
  '!border-[oklch(0.74_0.17_85_/_0.5)] !text-[var(--gold)] !bg-[oklch(0.74_0.17_85_/_0.08)]';

const vsBtnBase =
  'flex items-center gap-1 px-3 py-1.5 text-[9px] font-bold text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.1em] transition-colors hover:text-[var(--text-hi)] hover:bg-[var(--panel)]';
const vsBtnActive =
  '!text-[var(--gold)] !bg-[oklch(0.74_0.17_85_/_0.1)] border-r border-[oklch(0.74_0.17_85_/_0.2)]';

const segControl =
  'flex bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] overflow-hidden';
const segBtn =
  'px-2.5 py-1 text-[8px] font-bold text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.06em] transition-colors hover:text-[var(--text-hi)]';
const segBtnActive = '!text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)]';

const searchBox =
  'flex items-center gap-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2 py-1 w-[160px]';
const searchInput =
  'flex-1 bg-transparent text-[10px] text-[var(--text-hi)] placeholder:text-[var(--text-lo)] outline-none min-w-0';

const DIFF_ACTIVE_COLORS: Record<string, string> = {
  S: 'var(--gold)',
  A: 'var(--rose)',
  B: 'var(--violet)',
  C: 'var(--cyan)',
  D: 'var(--mint)',
};
