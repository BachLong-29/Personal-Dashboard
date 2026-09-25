'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';

import { Switch } from '@/components/ui/Switch';
import { cn } from '@/libs/utils';

import type { ScheduleDisplayOptions } from '../../hooks/useScheduleState';

interface Props {
  display: ScheduleDisplayOptions;
  setDisplay: (next: Partial<ScheduleDisplayOptions>) => void;
  /** Only the week grid honours "events only", so only it offers the row. */
  showEventsOnly?: boolean;
}

/** Matches the panel's own width; needed to right-align it from a rect. */
const PANEL_WIDTH = 190;

const ROWS = [
  { key: 'showQuests', glyph: '⚡', label: 'quests' },
  { key: 'showHabits', glyph: '✦', label: 'habits' },
  { key: 'showEvents', glyph: '📅', label: 'events' },
] as const;

/**
 * The three display filters as one control, for widths where three labelled
 * buttons do not fit on a row.
 *
 * The trigger carries the state rather than hiding it: each glyph is lit or
 * dimmed, so "something is filtered out" is still answerable at a glance —
 * which is the whole reason these were not folded into a plain menu. Opening
 * it is only needed to *change* a filter, and then the rows are full width
 * with real labels and real switches, rather than 9px glyphs in a strip.
 */
export function ScheduleDisplayMenu({ display, setDisplay, showEventsOnly }: Props) {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);

  // While "events only" is on the three switches below it do nothing, so they
  // are not what is hiding anything — the mode is.
  const eventsOnly = !!showEventsOnly && display.eventsOnly;
  const hiddenCount = eventsOnly ? 0 : ROWS.filter((row) => !display[row.key]).length;
  const filtering = eventsOnly || hiddenCount > 0;

  const clearAll = () => {
    setDisplay({ showQuests: true, showHabits: true, showEvents: true, eventsOnly: false });
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Portalled: every ancestor from the schedule panel up clips its overflow,
  // so a panel positioned inside this bar is never drawn at all.
  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const box = rootRef.current?.getBoundingClientRect();
      if (!box) return;
      setRect({ top: box.bottom + 6, left: Math.max(8, box.right - PANEL_WIDTH) });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t('scheduleView.display')}
        title={filtering ? t('scheduleView.filtered') : t('scheduleView.display')}
        className={cn(trigger, open && triggerOpen, filtering && triggerFiltered)}
      >
        ⋯
      </button>

      {open &&
        rect &&
        createPortal(
          <div ref={panelRef} style={{ top: rect.top, left: rect.left }} className={panel}>
            <div className={panelHead}>{t('scheduleView.display')}</div>

            {ROWS.map((row) => (
              <div key={row.key} className={cn(rowWrap, eventsOnly && 'opacity-40')}>
                <Switch
                  checked={display[row.key]}
                  disabled={eventsOnly}
                  onChange={(on) => setDisplay({ [row.key]: on })}
                >
                  <span className="text-[12px] text-[var(--text-hi)]">
                    {row.glyph} {t(`scheduleView.${row.label}`)}
                  </span>
                </Switch>
              </div>
            ))}

            {showEventsOnly && (
              <>
                <div className={rule} />
                <div className={rowWrap}>
                  <Switch
                    checked={display.eventsOnly}
                    onChange={(on) => setDisplay({ eventsOnly: on })}
                  >
                    <span className="text-[12px] text-[var(--text-hi)]">
                      ◉ {t('scheduleView.eventsOnly')}
                    </span>
                  </Switch>
                </div>
              </>
            )}

            {filtering && (
              <button type="button" className={showAllBtn} onClick={clearAll}>
                ⚠ {t('scheduleView.showAll')}
                {hiddenCount > 0 ? ` (${hiddenCount})` : ''}
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

// Matches the plain icon buttons beside it, so the three read as one row.
const trigger = cn(
  'flex items-center justify-center rounded border border-[var(--border)] bg-[var(--panel2)]',
  'px-2 py-1 text-[13px] leading-none text-[var(--text-mid)] cursor-pointer transition-colors',
  'hover:text-[var(--text-hi)]',
);
const triggerOpen = 'border-[var(--gold)] text-[var(--gold)]';
/**
 * The trigger no longer spells out which filters are on, so this colour is the
 * only remaining sign that something is being hidden. The panel behind it
 * still carries the count on its "show all" button.
 */
const triggerFiltered = 'border-[var(--warning)] text-[var(--warning)]';

const panel = cn(
  'fixed z-[1050] w-[190px] p-1.5',
  'rounded-[var(--r-md)] border border-[var(--border-hi)] bg-[var(--bg-2)] shadow-[var(--sh-3)]',
);
const panelHead =
  'px-1.5 pb-1.5 text-[9px] font-bold tracking-[0.18em] uppercase text-[var(--text-dim)] font-[var(--font-title)]';
const rowWrap = 'px-1.5 py-1.5';
const rule = 'my-1 h-px bg-[var(--border)]';
const showAllBtn = cn(
  'mt-1 w-full rounded-[var(--r-sm)] border border-[var(--warning)] px-2 py-1.5',
  'text-[10px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)]',
  'bg-[var(--warning)]/10 text-[var(--warning)] cursor-pointer transition-colors hover:bg-[var(--warning)]/20',
);
