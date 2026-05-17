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
  startDate: Date;
  endDate: Date;
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
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

taskSchema.index({ userId: 1, startDate: 1, endDate: 1 });
taskSchema.index({ userId: 1, active: 1 });

export const TaskModel =
  (mongoose.models.Task as mongoose.Model<ITask>) ?? mongoose.model<ITask>('Task', taskSchema);
