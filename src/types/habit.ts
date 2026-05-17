export type HabitColor = 'gold' | 'mint' | 'violet' | 'cyan' | 'rose' | 'amber' | 'blue';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  days: number[];
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
  days: number[];
  note?: string;
  tagId: string;
  color: HabitColor;
  icon: string;
}

export interface UpdateHabitPayload {
  name?: string;
  days?: number[];
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
