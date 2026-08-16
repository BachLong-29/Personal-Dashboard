'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

import { type TaskDiff } from '../data/mock';

export type ViewMode = 'day' | 'all';

// Max number of category chips shown before collapsing into "+N more"
const VISIBLE_LIMIT = 5;

// Color palette cycled by category index (API categories have no color field)
const CHIP_COLORS = [
  'var(--gold)',
  'var(--mint)',
  'var(--violet)',
  'var(--cyan)',
  'var(--rose)',
  'var(--amber)',
  'var(--blue)',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  /** API categories — id used for filtering, name displayed */
  categories: { id: string; name: string }[];
  filterCat: string;
  onFilterCat: (c: string) => void;
  filterDiff: TaskDiff | 'all';
  onFilterDiff: (d: TaskDiff | 'all') => void;
  splitMode: 'week' | 'month';
  onSplitMode: (m: 'week' | 'month') => void;
  search: string;
  onSearch: (s: string) => void;
  onForge: () => void;
  onAddTask: () => void;
  todayDone: number;
  todayTotal: number;
  weekDone: number;
  weekTotal: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PageHeader({
  view,
  onViewChange,
  categories,
  filterCat,
  onFilterCat,
  splitMode,
  onSplitMode,
  search,
  onSearch,
  onForge,
  onAddTask,
  todayDone,
  todayTotal,
  weekDone,
  weekTotal,
}: PageHeaderProps) {
  const t = useTranslations('tasks');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const yr = now.getFullYear();

  const visibleCats = categories.slice(0, VISIBLE_LIMIT);
  const moreCats = categories.slice(VISIBLE_LIMIT);
  const moreHasActive = moreCats.some((c) => c.id === filterCat);

  // Close the "More" dropdown when clicking outside
  useEffect(() => {
    if (!moreOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [moreOpen]);

  return (
    <div className={headerWrap}>
      {/* ── Title block ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className={tagLine}>
          ✦ &nbsp; CHRONICLE · {monthName} {yr} &nbsp; ✦
        </div>
        <h1 className={titleText}>{t('pageHeader.title')}</h1>
        <p className="hidden sm:block text-[10px] mt-0.5">
          <span className="text-[var(--text-hi)] font-semibold">{todayDone}</span>
          <span className="text-[var(--text-lo)]">
            {t('pageHeader.todayProgress', { total: todayTotal })}
          </span>
          <span className="text-[var(--text-hi)] font-semibold">{weekDone}</span>
          <span className="text-[var(--text-lo)]">
            {t('pageHeader.weekProgress', { total: weekTotal })}
          </span>
        </p>
      </div>

      {/* ── Right: view switch + actions ─────────────────────────────────── */}
      <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
        <ViewSwitch view={view} onChange={onViewChange} />
        <button type="button" className={addTaskBtn} onClick={onAddTask}>
          <span>＋</span> <span className="hidden sm:inline">{t('pageHeader.addTask')}</span>
        </button>
        <button type="button" className={forgeBtn} onClick={onForge}>
          <span>＋</span> <span className="hidden sm:inline">{t('pageHeader.forgeQuest')}</span>
        </button>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className={filterBar}>
        {/* Realm chips — API categories */}
        <FilterGroup label="Realm">
          <Chip active={filterCat === 'all'} onClick={() => onFilterCat('all')}>
            {t('pageHeader.all')}
          </Chip>

          {visibleCats.map((c, i) => (
            <Chip
              key={c.id}
              active={filterCat === c.id}
              activeColor={CHIP_COLORS[i % CHIP_COLORS.length]}
              onClick={() => onFilterCat(filterCat === c.id ? 'all' : c.id)}
            >
              {c.name}
            </Chip>
          ))}

          {/* "+N more" collapse button */}
          {moreCats.length > 0 && (
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                className={cn(chipBase, moreHasActive && chipActive)}
                onClick={() => setMoreOpen((v) => !v)}
              >
                {moreHasActive ? '✓ ' : ''}+{moreCats.length}
              </button>

              {moreOpen && (
                <div className={morePanel}>
                  <span className={morePanelTitle}>{t('pageHeader.moreCategories')}</span>
                  {moreCats.map((c, i) => {
                    const color = CHIP_COLORS[(i + VISIBLE_LIMIT) % CHIP_COLORS.length];
                    const active = filterCat === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={cn(moreItem, active && moreItemActive)}
                        style={active ? { color } : undefined}
                        onClick={() => {
                          onFilterCat(active ? 'all' : c.id);
                          setMoreOpen(false);
                        }}
                      >
                        {active && <span className="mr-1 opacity-70">✓</span>}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
                {t('pageHeader.week')}
              </button>
              <button
                type="button"
                className={cn(segBtn, splitMode === 'month' && segBtnActive)}
                onClick={() => onSplitMode('month')}
              >
                {t('pageHeader.month')}
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
              placeholder={t('pageHeader.searchPlaceholder')}
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
  // 'day' temporarily hidden — 'all' is the only view for now.
  // { id: 'day', glyph: '◐', label: 'day' },
  { id: 'all', glyph: '≡', label: 'all' },
];

function ViewSwitch({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const t = useTranslations('tasks');

  if (VIEW_META.length <= 1) return null;

  return (
    <div className="flex bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] overflow-hidden">
      {VIEW_META.map((v) => (
        <button
          key={v.id}
          type="button"
          className={cn(vsBtnBase, view === v.id && vsBtnActive)}
          onClick={() => onChange(v.id)}
        >
          {v.glyph} <span>{t(`pageHeader.view.${v.label}`)}</span>
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
      style={active && activeColor ? { borderColor: activeColor, color: activeColor } : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const headerWrap =
  'bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] px-3 md:px-4 pt-3 pb-3 flex flex-wrap gap-2 shrink-0';

const tagLine =
  'text-[8px] tracking-[0.18em] text-[var(--gold)] font-[var(--font-title)] font-bold opacity-70';
const titleText =
  'text-[22px] font-black text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.05em] leading-none';

const addTaskBtn =
  'flex items-center gap-1.5 px-3 py-1.5 bg-[oklch(0.76_0.16_205_/_0.1)] border border-[oklch(0.76_0.16_205_/_0.35)] text-[var(--cyan)] text-[9px] font-bold font-[var(--font-title)] tracking-[0.08em] rounded-[var(--r-sm)] hover:bg-[oklch(0.76_0.16_205_/_0.18)] hover:border-[oklch(0.76_0.16_205_/_0.55)] transition-all duration-150';

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
  'flex items-center gap-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2 py-1 w-full sm:w-[160px]';
const searchInput =
  'flex-1 bg-transparent text-[10px] text-[var(--text-hi)] placeholder:text-[var(--text-lo)] outline-none min-w-0';

// More panel dropdown
const morePanel =
  'absolute left-0 top-full mt-1 z-50 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] shadow-xl min-w-[160px] py-1.5 flex flex-col';
const morePanelTitle =
  'text-[7px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] px-3 pb-1 font-[var(--font-title)]';
const moreItem =
  'text-left px-3 py-1.5 text-[9px] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)] transition-colors cursor-pointer font-[var(--font-title)] tracking-[0.04em]';
const moreItemActive = '!text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.06)]';
