export type HabitColor = 'gold' | 'mint' | 'violet' | 'cyan' | 'rose' | 'amber' | 'blue';

/** String-based day-of-week identifier */
export type HabitDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** A group of days that share the same scheduled time */
export interface HabitScheduleEntry {
  days: HabitDay[];
  /** 24-hour time string e.g. "19:00" — required */
  time: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  /** Each entry represents days that share a start time */
  schedule: HabitScheduleEntry[];
  /** Optional estimated duration in minutes */
  duration?: number;
  note?: string;
  tagId: string;
  color: HabitColor;
  icon: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  done: boolean;
  completedAt?: string;
}

export interface CreateHabitPayload {
  name: string;
  schedule: HabitScheduleEntry[];
  duration?: number;
  note?: string;
  tagId: string;
  color: HabitColor;
  icon: string;
}

export interface UpdateHabitPayload {
  name?: string;
  schedule?: HabitScheduleEntry[];
  duration?: number;
  note?: string;
  tagId?: string;
  color?: HabitColor;
  icon?: string;
  active?: boolean;
}

export interface UpsertHabitLogPayload {
  habitId: string;
  date: string;
  done: boolean;
}
