import type { HabitDay } from '@/types/habit';

/** Seed for a new event — the form picks anything from the emoji picker. */
export const DEFAULT_EVENT_ICON = '📅';

export const WEEKDAYS: { value: HabitDay; label: string }[] = [
  { value: 'mon', label: 'M' },
  { value: 'tue', label: 'T' },
  { value: 'wed', label: 'W' },
  { value: 'thu', label: 'T' },
  { value: 'fri', label: 'F' },
  { value: 'sat', label: 'S' },
  { value: 'sun', label: 'S' },
];

/** Ordered the way the weekday picker shows them. */
export const DAY_ORDER: HabitDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_SHORT: Record<HabitDay, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};
