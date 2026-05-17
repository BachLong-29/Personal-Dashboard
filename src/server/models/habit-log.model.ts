import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IHabitLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  habitId: mongoose.Types.ObjectId;
  date: Date;
  done: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const habitLogSchema = new Schema<IHabitLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    habitId: {
      type: Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// One log per user per habit per day
habitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

export const HabitLogModel =
  (mongoose.models.HabitLog as mongoose.Model<IHabitLog>) ??
  mongoose.model<IHabitLog>('HabitLog', habitLogSchema);
