'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { Icon } from '@/components/common/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { NoData } from '@/components/ui/NoData';
import { SkelBlock } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import DashboardTopbar from '@/features/dashboard/components/layout/DashboardTopbar';
import { useCategories } from '@/features/dashboard/hooks/useCategories';
import type { Character } from '@/features/dashboard/types';
import { buildEmptyChar, profileToCharacter } from '@/features/dashboard/utils/character.utils';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { todayISO } from '@/features/tasks/utils/date.utils';
import { COLOR_CSS } from '@/features/projects/constants';
import { cn } from '@/libs/utils';
import type { EventDTO } from '@/types';

import { DAY_ORDER, DAY_SHORT } from '../constants';
import { useDeleteEvent, useEventOccurrences, useEvents, useUpdateEvent } from '../hooks/useEvents';
import { isEventLive, LIVE_TICK_MS } from '../utils/live';
import { EventFormModal } from './EventFormModal';

/** "Every 2 weeks · Mon, Wed · 09:00" — one line that says when it happens. */
function scheduleLabel(event: EventDTO): string {
  const time = event.allDay ? 'All day' : (event.startTime ?? '');
  const rule = event.recurrence;

  if (!rule) return [event.startDate, time].filter(Boolean).join(' · ');

  const every =
    rule.interval > 1
      ? `Every ${rule.interval} ${rule.freq === 'weekly' ? 'weeks' : 'months'}`
      : rule.freq === 'weekly'
        ? 'Weekly'
        : 'Monthly';

  const when =
    rule.freq === 'weekly'
      ? DAY_ORDER.filter((d) => rule.days?.includes(d))
          .map((d) => DAY_SHORT[d])
          .join(', ')
      : `Day ${rule.dayOfMonth}`;

  return [every, when, time].filter(Boolean).join(' · ');
}

export function EventsPage() {
  // ── Character snapshot for the shared app topbar — same pattern as RewardManagement ──
  const { data: profileData } = useProfile();
  const charInitialized = useRef(false);
  const [char, setChar] = useState<Character>(() => buildEmptyChar());
  useEffect(() => {
    const profile = profileData?.profile;
    if (!profile || charInitialized.current) return;
    setChar(profileToCharacter(profile));
    charInitialized.current = true;
  }, [profileData]);
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const { data: events = [], isLoading, isError, refetch } = useEvents();
  const { data: categories = [] } = useCategories();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [editing, setEditing] = useState<EventDTO | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<EventDTO | null>(null);

  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  // ── Which of these is on right now? ────────────────────────────────────────
  // Asked of today's expanded occurrences rather than worked out from the rule
  // here: the server already handles intervals, overrides and skipped dates,
  // and a second implementation of that would drift from the first.
  const reduceMotion = useReducedMotion();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), LIVE_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const today = todayISO();
  const { data: todayOccurrences = [] } = useEventOccurrences(today, today);
  const liveIds = useMemo(
    () =>
      new Set(todayOccurrences.filter((occ) => isEventLive(occ, now)).map((occ) => occ.eventId)),
    [todayOccurrences, now],
  );

  // The empty state carries its own centred CTA — two of the same button on an
  // otherwise blank page is noise, so the header one stands down for it.
  const isEmpty = !isLoading && !isError && events.length === 0;

  // Whatever is on right now goes to the top — it is the only row with
  // anything to do about it. Then repeating rules, the backbone of the week.
  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          Number(liveIds.has(b.id)) - Number(liveIds.has(a.id)) ||
          Number(Boolean(b.recurrence)) - Number(Boolean(a.recurrence)) ||
          a.startDate.localeCompare(b.startDate),
      ),
    [events, liveIds],
  );

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(event: EventDTO) {
    setEditing(event);
    setShowForm(true);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg)]">
      <DashboardTopbar char={char} dateStr={dateStr} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Header — stacked below sm so the title is never overrun */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 sm:flex-1">
            <div className="text-[9px] tracking-[0.3em] text-[var(--gold)] [font-family:var(--f-title)]">
              SCHEDULE
            </div>
            <h1 className="truncate text-[22px] font-bold tracking-[0.03em] text-[var(--text-hi)] [font-family:var(--f-title)]">
              Events
            </h1>
          </div>
          {!isEmpty && (
            <Button
              variant="primary"
              onClick={openCreate}
              className="w-full justify-center sm:w-auto"
            >
              ＋ New Event
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkelBlock key={i} className="h-[68px] w-full" />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <NoData
            icon="⚠"
            title="Could not load events"
            message="Something went wrong reaching the server."
            action={
              <Button variant="ghost" onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <NoData
            icon="📅"
            title="No events yet"
            message="Meetings, classes, appointments — anything that takes hours out of your week."
            action={
              <Button variant="primary" onClick={openCreate}>
                ＋ New Event
              </Button>
            }
          />
        )}

        {!isLoading && !isError && sorted.length > 0 && (
          <div className="flex flex-col gap-2">
            {sorted.map((event, i) => {
              const live = liveIds.has(event.id);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.22 }}
                  className={cn(
                    'flex flex-col gap-3 rounded-[var(--r-md)] border border-[var(--border)]',
                    'bg-[var(--panel)] p-3 transition-colors hover:border-[var(--border-hi)]',
                    'sm:flex-row sm:items-center sm:gap-4',
                    // `relative overflow-hidden` so the sweep below is clipped
                    // to the card. No outer glow: stacked down a list it bled
                    // into its neighbours.
                    live && 'relative overflow-hidden border-[var(--rose)]',
                  )}
                  style={{
                    borderLeft: `3px solid ${COLOR_CSS[event.color]}`,
                    opacity: event.paused ? 0.55 : 1,
                    // Glow in the event's own colour rather than the marker's
                    // red: it echoes the stripe already down the left edge, so
                    // the card reads as one thing lit up, not two colours
                    // arguing.
                    boxShadow: live
                      ? `0 0 18px color-mix(in oklch, ${COLOR_CSS[event.color]} 40%, transparent)`
                      : undefined,
                  }}
                >
                  {/* A light passing over the card, borrowed from the active
                    quest banner: motion says "now" where a static glow only
                    said "look here". Transform-only, so it costs no layout. */}
                  {live && !reduceMotion && (
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-0 w-[60%]"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.07), transparent)',
                      }}
                      animate={{ x: ['-120%', '220%'] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                    />
                  )}

                  {/* Identity — icon rides beside the title instead of claiming
                    its own line, which is what made the card so tall. */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center text-[18px]',
                        'rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg-2)]',
                      )}
                    >
                      <Icon icon={event.icon} />
                    </span>

                    <div className="min-w-0">
                      <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-[13px] font-semibold text-[var(--text-hi)]">
                          {event.title}
                        </span>
                        {/* The meta line below already reads "Weekly · Tue · 11:00"
                          against a plain date, so the glyph is a marker, not a
                          label — and a one-off needs no badge to say so. */}
                        {event.recurrence && (
                          <span
                            className="shrink-0 text-[12px] leading-none text-[var(--violet)]"
                            title="Repeats"
                            aria-label="Repeats"
                          >
                            ↻
                          </span>
                        )}
                        {!event.busy && <Badge variant="mint">Free</Badge>}
                        {live && (
                          <span className={livePill}>
                            <motion.span
                              className="block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--rose)]"
                              animate={reduceMotion ? undefined : { opacity: [1, 0.25, 1] }}
                              transition={
                                reduceMotion
                                  ? undefined
                                  : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                              }
                            />
                            Live
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-[var(--text-lo)]">
                        {scheduleLabel(event)}
                        {event.tagId && categoryName.has(event.tagId)
                          ? ` · ${categoryName.get(event.tagId)}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {/* Controls — a rule separates them on a phone, where they sit
                    under the title rather than beside it. */}
                  <div
                    className={cn(
                      'flex shrink-0 items-center justify-between gap-3',
                      'border-t border-[var(--border)] pt-3',
                      'sm:justify-end sm:border-t-0 sm:pt-0',
                    )}
                  >
                    {/* The label is the whole point: a bare switch left people
                      asking whether it deleted the event. */}
                    <Switch
                      checked={!event.paused}
                      disabled={updateEvent.isPending}
                      onChange={(on) => updateEvent.mutate({ id: event.id, paused: !on })}
                    >
                      <span className="text-[10px] tracking-[0.08em] text-[var(--text-lo)] uppercase">
                        {event.paused ? 'Off' : 'On'}
                      </span>
                    </Switch>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={rowIconBtn}
                        onClick={() => openEdit(event)}
                        title="Edit event"
                        aria-label="Edit event"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className={cn(rowIconBtn, rowIconBtnDanger)}
                        onClick={() => setDeleting(event)}
                        title="Delete event"
                        aria-label="Delete event"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <EventFormModal open={showForm} onClose={() => setShowForm(false)} event={editing} />

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} maxWidth="380px">
        <ModalHead
          title={
            <>
              <span className="text-[var(--rose)]">⚠</span> Delete Event
            </>
          }
        />
        <ModalBody>
          <p className="text-[12px] leading-relaxed text-[var(--text-mid)]">
            Delete <strong className="text-[var(--text-hi)]">{deleting?.title}</strong>?
            {deleting?.recurrence
              ? ' Every occurrence leaves the calendar, including the ones you moved.'
              : ''}
          </p>
        </ModalBody>
        <ModalFoot>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => setDeleting(null)}
              disabled={deleteEvent.isPending}
              className="w-full justify-center sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteEvent.isPending}
              onClick={async () => {
                if (!deleting) return;
                await deleteEvent.mutateAsync(deleting.id);
                setDeleting(null);
              }}
              className="w-full justify-center sm:w-auto"
            >
              {deleteEvent.isPending ? '…' : 'Delete'}
            </Button>
          </div>
        </ModalFoot>
      </Modal>
    </div>
  );
}

// ── Row controls ──────────────────────────────────────────────────────────────

/**
 * Red, not gold: gold already means "selected" throughout this app, and an
 * on-air marker has to say something the rest of the page never says.
 */
const livePill = cn(
  'flex shrink-0 items-center gap-1 rounded-full border border-[var(--rose)]',
  'bg-[var(--rose)]/10 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.1em] uppercase',
  'text-[var(--rose)] [font-family:var(--f-title)]',
);

const rowIconBtn = cn(
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)]',
  'border border-[var(--border)] text-[13px] text-[var(--text-mid)]',
  'transition-colors hover:border-[var(--border-hi)] hover:text-[var(--text-hi)]',
);

const rowIconBtnDanger = 'hover:border-[oklch(0.72_0.18_5_/_0.45)] hover:text-[var(--rose)]';
