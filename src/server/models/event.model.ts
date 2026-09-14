import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { EventFrequency, EventRecurrence } from '@/types/event';
import type { HabitDay } from '@/types/habit';
import type { TaskColor } from '@/types/task';

const EVENT_COLORS: TaskColor[] = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'];
const EVENT_DAYS: HabitDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const FREQUENCIES: EventFrequency[] = ['weekly', 'monthly'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  /** Absent on an override row — inherited from the series */
  title?: string;
  note?: string;
  tagId?: string;
  color?: TaskColor;
  icon?: string;
  allDay: boolean;
  /** HH:MM — omitted when allDay */
  startTime?: string;
  /** Minutes — omitted when allDay */
  duration?: number;
  /** One-off: the day it happens. Recurring: the day the rule starts. */
  startDate: Date;
  /** Recurring only — omitted means indefinite */
  endDate?: Date;
  /** Omitted means a one-off event */
  recurrence?: EventRecurrence;
  /**
   * Override row — the series whose occurrence this replaces. Mirrors the
   * `habitRef` mechanism a rescheduled habit already uses.
   */
  seriesRef?: mongoose.Types.ObjectId;
  /** Override row — the original occurrence date being replaced */
  overrideDate?: Date;
  cancelled: boolean;
  /** Consumes the day's capacity */
  busy: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recurrenceSchema = new Schema<EventRecurrence>(
  {
    freq: { type: String, enum: FREQUENCIES, required: true },
    days: { type: [String], enum: EVENT_DAYS, default: undefined },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    interval: { type: Number, default: 1, min: 1, max: 12 },
  },
  { _id: false },
);

/** Override rows carry only date/time — every other field lives on the series. */
function isSeriesRow(this: IEvent): boolean {
  return !this.seriesRef;
}

const eventSchema = new Schema<IEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Override rows inherit every display field from their series, so those are
    // required on a series/one-off row only — that is what keeps a moved
    // occurrence from drifting when the series is renamed or recoloured.
    title: { type: String, required: isSeriesRow, trim: true, maxlength: 100 },
    note: { type: String, trim: true, maxlength: 500 },
    tagId: { type: String, required: isSeriesRow },
    color: { type: String, enum: EVENT_COLORS, required: isSeriesRow },
    icon: { type: String, required: isSeriesRow },
    allDay: { type: Boolean, default: false },
    startTime: { type: String, match: [TIME_RE, 'startTime must be in HH:MM (24-hour) format'] },
    duration: { type: Number, min: 1, max: 1440 },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    recurrence: { type: recurrenceSchema, default: undefined },
    seriesRef: { type: Schema.Types.ObjectId, ref: 'Event' },
    overrideDate: { type: Date },
    cancelled: { type: Boolean, default: false },
    busy: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

eventSchema.index({ userId: 1, startDate: 1 });
// Expansion loads every override of the series it is about to generate.
eventSchema.index({ userId: 1, seriesRef: 1, overrideDate: 1 });

// Force re-register in dev to avoid stale schema after hot-reload
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Event;
}

export const EventModel =
  (mongoose.models.Event as mongoose.Model<IEvent>) || mongoose.model<IEvent>('Event', eventSchema);
