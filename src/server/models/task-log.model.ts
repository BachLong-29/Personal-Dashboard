import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface ITaskLog extends Document {
  _id:       mongoose.Types.ObjectId;
  userId:    mongoose.Types.ObjectId;
  taskId:    mongoose.Types.ObjectId;
  date:      Date;
  note?:     string;
  createdAt: Date;
  updatedAt: Date;
}

const taskLogSchema = new Schema<ITaskLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { timestamps: true },
);

// One log per user per task per day — same pattern as HabitLog
taskLogSchema.index({ userId: 1, taskId: 1, date: 1 }, { unique: true });

// Force re-register in dev to avoid stale schema after hot-reload
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).TaskLog;
}

export const TaskLogModel =
  (mongoose.models.TaskLog as mongoose.Model<ITaskLog>) ??
  mongoose.model<ITaskLog>('TaskLog', taskLogSchema);
