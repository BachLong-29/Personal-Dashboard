import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { TaskColor, TaskStatus } from '@/types/task';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  note?: string;
  tagId: string;
  color: TaskColor;
  icon: string;
  status: TaskStatus;
  /** Estimated duration in minutes */
  duration?: number;
  startDate: Date;
  /** Optional — undefined means open-ended / point-in-time */
  endDate?: Date;
  dependencies: mongoose.Types.ObjectId[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TASK_COLORS: TaskColor[] = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'];
const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'pending', 'waiting', 'done'];

const taskSchema = new Schema<ITask>(
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
      enum: TASK_COLORS,
      required: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'todo',
    },
    duration: {
      type: Number,
      min: 1,
      max: 1440,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      // optional — no required: true
    },
    dependencies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

taskSchema.index({ userId: 1, startDate: 1 });
taskSchema.index({ userId: 1, active: 1 });

// Force re-register in dev to avoid stale schema after hot-reload
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Task;
}

export const TaskModel =
  (mongoose.models.Task as mongoose.Model<ITask>) ?? mongoose.model<ITask>('Task', taskSchema);
