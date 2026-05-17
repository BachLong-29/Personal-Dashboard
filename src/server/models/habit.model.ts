import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { HabitColor } from '@/types/habit';

export interface IHabit extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  days: number[];
  note?: string;
  tagId: string;
  color: HabitColor;
  icon: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HABIT_COLORS: HabitColor[] = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'];

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
    days: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.length > 0 && v.every((d) => d >= 0 && d <= 6),
        message: 'At least one valid day (0-6) is required',
      },
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

export const HabitModel =
  (mongoose.models.Habit as mongoose.Model<IHabit>) ?? mongoose.model<IHabit>('Habit', habitSchema);
