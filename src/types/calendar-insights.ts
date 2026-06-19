export type ConflictType = 'hard' | 'soft';
export type CapacityStatus = 'normal' | 'tight' | 'overloaded';

export interface ConflictEndpoint {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleConflict {
  type: ConflictType;
  date: string;
  a: ConflictEndpoint;
  b: ConflictEndpoint;
  /** Gap in minutes — present for soft conflicts */
  gap?: number;
}

export interface DayCapacity {
  date: string;
  plannedMinutes: number;
  availableMinutes: number;
  loadPct: number;
  status: CapacityStatus;
}

export interface CalendarInsights {
  conflicts: ScheduleConflict[];
  capacity: DayCapacity[];
}
