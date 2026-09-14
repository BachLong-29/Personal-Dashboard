'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NoData } from '@/components/ui/NoData';
import { SkelBlock } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import DashboardTopbar from '@/features/dashboard/components/layout/DashboardTopbar';
import { useCategories } from '@/features/dashboard/hooks/useCategories';
import type { Character } from '@/features/dashboard/types';
import { buildEmptyChar, profileToCharacter } from '@/features/dashboard/utils/character.utils';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { COLOR_CSS } from '@/features/projects/constants';
import { cn } from '@/libs/utils';
import type { EventDTO } from '@/types';

import { DAY_ORDER, DAY_SHORT } from '../constants';
import { useDeleteEvent, useEvents, useUpdateEvent } from '../hooks/useEvents';
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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  // The empty state carries its own centred CTA — two of the same button on an
  // otherwise blank page is noise, so the header one stands down for it.
  const isEmpty = !isLoading && !isError && events.length === 0;

  // Repeating rules first — they are the backbone of the week.
  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          Number(Boolean(b.recurrence)) - Number(Boolean(a.recurrence)) ||
          a.startDate.localeCompare(b.startDate),
      ),
    [events],
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
            {sorted.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.22 }}
                className={cn(
                  'flex flex-col gap-3 rounded-[var(--r-md)] border border-[var(--border)]',
                  'bg-[var(--panel)] p-3 transition-colors hover:border-[var(--border-hi)]',
                  'sm:flex-row sm:items-center',
                )}
                style={{ borderLeft: `3px solid ${COLOR_CSS[event.color]}` }}
              >
                <span className="shrink-0 text-[20px] leading-none">{event.icon}</span>

                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-[13px] font-semibold text-[var(--text-hi)]">
                      {event.title}
                    </span>
                    {event.recurrence ? (
                      <Badge variant="violet">↻ Repeats</Badge>
                    ) : (
                      <Badge variant="cyan">Once</Badge>
                    )}
                    {!event.busy && <Badge variant="mint">Free</Badge>}
                  </div>
                  <p className="truncate text-[11px] text-[var(--text-lo)]">
                    {scheduleLabel(event)}
                    {event.tagId && categoryName.has(event.tagId)
                      ? ` · ${categoryName.get(event.tagId)}`
                      : ''}
                  </p>
                </div>

                {confirmDelete === event.id ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[10px] text-[var(--rose)]">Delete?</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleteEvent.isPending}
                      onClick={async () => {
                        await deleteEvent.mutateAsync(event.id);
                        setConfirmDelete(null);
                      }}
                      className="text-[var(--rose)]"
                    >
                      Yes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
                      No
                    </Button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      checked={event.active}
                      disabled={updateEvent.isPending}
                      onChange={(active) => updateEvent.mutate({ id: event.id, active })}
                    />
                    <Button size="sm" variant="ghost" onClick={() => openEdit(event)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDelete(event.id)}
                      className="text-[var(--rose)]"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <EventFormModal open={showForm} onClose={() => setShowForm(false)} event={editing} />
    </div>
  );
}
