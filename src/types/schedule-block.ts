export type ScheduleBlockSource = 'task' | 'quest';
export type ScheduleBlockStatus = 'planned' | 'done' | 'missed';

export interface ScheduleBlock {
  id: string;
  userId: string;
  sourceType: ScheduleBlockSource;
  sourceId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM (24-hour) */
  startTime: string;
  /** Duration in minutes */
  duration: number;
  status: ScheduleBlockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleBlockPayload {
  sourceType: ScheduleBlockSource;
  sourceId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  startTime: string;
  /** Minutes */
  duration: number;
}

export interface UpdateScheduleBlockPayload {
  date?: string;
  startTime?: string;
  duration?: number;
  status?: ScheduleBlockStatus;
}

/** Derived progress numbers attached to a task response. */
export interface TaskProgress {
  /** Sum of all blocks' duration (minutes) */
  plannedMinutes: number;
  /** Sum of done blocks' duration (minutes) */
  completedMinutes: number;
  /** completedMinutes / task.duration as a 0–100 integer, null when no estimate */
  progressPct: number | null;
}
