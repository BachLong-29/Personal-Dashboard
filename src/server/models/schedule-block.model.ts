import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { ScheduleBlockSource, ScheduleBlockStatus } from '@/types/schedule-block';

const SOURCE_TYPES: ScheduleBlockSource[] = ['task', 'quest'];
const STATUSES: ScheduleBlockStatus[] = ['planned', 'done', 'missed'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface IScheduleBlock extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sourceType: ScheduleBlockSource;
  sourceId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  duration: number;
  status: ScheduleBlockStatus;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleBlockSchema = new Schema<IScheduleBlock>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: SOURCE_TYPES,
      required: true,
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [TIME_RE, 'startTime must be in HH:MM (24-hour) format'],
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 1440,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'planned',
    },
  },
  { timestamps: true },
);

scheduleBlockSchema.index({ userId: 1, date: 1 });
scheduleBlockSchema.index({ userId: 1, sourceType: 1, sourceId: 1 });

// Force re-register in dev to avoid stale schema after hot-reload
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).ScheduleBlock;
}

export const ScheduleBlockModel =
  (mongoose.models.ScheduleBlock as mongoose.Model<IScheduleBlock>) ??
  mongoose.model<IScheduleBlock>('ScheduleBlock', scheduleBlockSchema);
