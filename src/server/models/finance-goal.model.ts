import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { TaskColor } from '@/types/task';

export type FinanceGoalStatus = 'active' | 'completed' | 'archived';

const GOAL_STATUSES: FinanceGoalStatus[] = ['active', 'completed', 'archived'];
const GOAL_COLORS: TaskColor[] = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'];

export interface IFinanceGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  icon: string;
  color: TaskColor;
  targetAmount: number;
  /** Deadline for reaching `targetAmount`; without it there's no pace to fall behind. */
  targetDate?: Date;
  status: FinanceGoalStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const financeGoalSchema = new Schema<IFinanceGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    icon: { type: String, required: true, trim: true },
    color: { type: String, enum: GOAL_COLORS, default: 'gold' },
    targetAmount: { type: Number, required: true, min: 1 },
    targetDate: { type: Date },
    status: { type: String, enum: GOAL_STATUSES, default: 'active' },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

financeGoalSchema.index({ userId: 1, status: 1 });

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).FinanceGoal;
}

export const FinanceGoalModel =
  (mongoose.models.FinanceGoal as mongoose.Model<IFinanceGoal>) ??
  mongoose.model<IFinanceGoal>('FinanceGoal', financeGoalSchema);
