export type CalendarSource = 'habit' | 'quest' | 'task' | 'event';
export type CalendarStatus = 'planned' | 'done' | 'missed';

export interface CalendarItem {
  /** Stable id: `block:<blockId>` or `<sourceType>:<sourceId>:<date>` */
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, null = all-day / deadline-only */
  startTime: string | null;
  /** HH:MM, null when startTime is null */
  endTime: string | null;
  /** Duration in minutes, 0 for all-day items */
  duration: number;
  status: CalendarStatus;
  sourceType: CalendarSource;
  sourceId: string;
  icon: string;
  color: string;
  meta?: {
    blockId?: string;
    deadline?: boolean;
    /** Event only — the occurrence replaces one from a recurring series */
    isOverride?: boolean;
    /** Event only — false when the event does not consume the day's capacity */
    busy?: boolean;
  };
}
