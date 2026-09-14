import type { HabitDay } from './habit';
import type { TaskColor } from './task';

export type EventFrequency = 'weekly' | 'monthly';

export interface EventRecurrence {
  freq: EventFrequency;
  /** Required when freq is 'weekly'. */
  days?: HabitDay[];
  /** 1–31, required when freq is 'monthly'. */
  dayOfMonth?: number;
  /** 1 = every week/month, 2 = every other one, … */
  interval: number;
}

export interface EventDTO {
  id: string;
  userId: string;
  title: string;
  note?: string;
  tagId: string;
  color: TaskColor;
  icon: string;
  allDay: boolean;
  /** HH:MM — absent when allDay */
  startTime?: string;
  /** Minutes — absent when allDay */
  duration?: number;
  /** One-off: the day it happens. Recurring: the day the rule starts. */
  startDate: string;
  /** Recurring only — absent means indefinite */
  endDate?: string;
  /** Absent means a one-off event */
  recurrence?: EventRecurrence;
  /** Override row only — the series this replaces one occurrence of */
  seriesRef?: string;
  /** Override row only — the original occurrence date being replaced */
  overrideDate?: string;
  cancelled: boolean;
  /** Consumes the day's capacity */
  busy: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One expanded occurrence of an event on a concrete day. */
export interface EventOccurrence {
  /** `event:<eventId>:<date>` */
  id: string;
  eventId: string;
  title: string;
  note?: string;
  tagId: string;
  color: TaskColor;
  icon: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM — null when all-day */
  startTime: string | null;
  /** Minutes — 0 when all-day */
  duration: number;
  allDay: boolean;
  busy: boolean;
  /** True when this occurrence came from an override row */
  isOverride: boolean;
  /** The series it overrides, when isOverride */
  seriesId?: string;
  /** True when the underlying event repeats */
  recurring: boolean;
}

export interface CreateEventPayload {
  title: string;
  note?: string;
  tagId: string;
  color: TaskColor;
  icon: string;
  allDay?: boolean;
  startTime?: string;
  duration?: number;
  startDate: string;
  endDate?: string;
  recurrence?: EventRecurrence;
  busy?: boolean;
}

export interface UpdateEventPayload {
  title?: string;
  /** null clears the note */
  note?: string | null;
  tagId?: string;
  color?: TaskColor;
  icon?: string;
  allDay?: boolean;
  startTime?: string | null;
  duration?: number | null;
  startDate?: string;
  /** null makes the rule indefinite */
  endDate?: string | null;
  /** null turns a series back into a one-off */
  recurrence?: EventRecurrence | null;
  busy?: boolean;
  active?: boolean;
}

/** Cancel or move a single occurrence of a series. */
export interface EventOverridePayload {
  /** The original occurrence date being overridden */
  date: string;
  /** True cancels the occurrence; otherwise the fields below move it */
  cancelled?: boolean;
  /** New day — defaults to `date` when only the time moves */
  newDate?: string;
  startTime?: string;
  duration?: number;
}
