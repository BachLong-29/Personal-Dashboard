import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { TaskColor } from '@/types/task';

export type ProjectStatus = 'active' | 'completed' | 'archived';
export type ProjectPriority = 'high' | 'medium' | 'low';

const PROJECT_COLORS: TaskColor[] = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'];
const PROJECT_STATUSES: ProjectStatus[] = ['active', 'completed', 'archived'];
const PROJECT_PRIORITIES: ProjectPriority[] = ['high', 'medium', 'low'];

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color: TaskColor;
  icon: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: Date;
  deadline?: Date;
  /** XP awarded when the project is completed */
  xp: number;
  /** Coins awarded when the project is completed */
  coins: number;
  completedDate?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
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
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    color: {
      type: String,
      enum: PROJECT_COLORS,
      required: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'active',
    },
    priority: {
      type: String,
      enum: PROJECT_PRIORITIES,
      default: 'medium',
    },
    startDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    coins: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedDate: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

projectSchema.index({ userId: 1, active: 1 });
projectSchema.index({ userId: 1, status: 1 });

// Force re-register in dev to avoid stale schema after hot-reload
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Project;
}

export const ProjectModel =
  (mongoose.models.Project as mongoose.Model<IProject>) ??
  mongoose.model<IProject>('Project', projectSchema);
