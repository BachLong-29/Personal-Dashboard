import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IGoalContribution extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  goalId: mongoose.Types.ObjectId;
  /** Positive = money put in, negative = taken back out. */
  amount: number;
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const goalContributionSchema = new Schema<IGoalContribution>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'FinanceGoal', required: true, index: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

goalContributionSchema.index({ userId: 1, goalId: 1, date: -1 });

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).GoalContribution;
}

export const GoalContributionModel =
  (mongoose.models.GoalContribution as mongoose.Model<IGoalContribution>) ??
  mongoose.model<IGoalContribution>('GoalContribution', goalContributionSchema);
