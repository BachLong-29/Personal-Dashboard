import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { HabitColor, HabitDay } from '@/types/habit';

const HABIT_COLORS: HabitColor[] = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'];
const HABIT_DAYS: HabitDay[]     = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface IHabitScheduleEntry {
  days: HabitDay[];
  time: string;
}

export interface IHabit extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  schedule: IHabitScheduleEntry[];
  duration?: number;
  note?: string;
  tagId: string;
  color: HabitColor;
  icon: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleEntrySchema = new Schema<IHabitScheduleEntry>(
  {
    days: {
      type: [String],
      enum: HABIT_DAYS,
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'Each schedule entry must have at least one day',
      },
    },
    time: {
      type: String,
      required: true,
      match: [TIME_RE, 'Time must be in HH:MM (24-hour) format'],
    },
  },
  { _id: false },
);

const habitSchema = new Schema<IHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    schedule: {
      type: [scheduleEntrySchema],
      required: true,
      validate: {
        validator: (v: IHabitScheduleEntry[]) => v.length > 0,
        message: 'At least one schedule entry is required',
      },
    },
    duration: {
      type: Number,
      min: 1,
      max: 1440,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    tagId: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      enum: HABIT_COLORS,
      required: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

habitSchema.index({ userId: 1, active: 1 });

// Force re-register in dev to avoid stale schema after hot-reload
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Habit;
}

export const HabitModel =
  (mongoose.models.Habit as mongoose.Model<IHabit>) ?? mongoose.model<IHabit>('Habit', habitSchema);
