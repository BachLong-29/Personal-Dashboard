import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  /** ref FinanceCategory (type='expense'); undefined = overall spending budget */
  categoryId?: mongoose.Types.ObjectId;
  /** First month this budget applies to — "YYYY-MM" */
  month: string;
  limit: number;
  /** When true, this budget also applies to every month after `month` that has no override. */
  recurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'FinanceCategory',
      // optional — undefined means the overall (all-expense) budget for the month
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },
    limit: {
      type: Number,
      required: true,
      min: 1,
    },
    recurring: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// One budget per (category, month) — including the overall budget, where a
// missing categoryId is indexed as null by MongoDB, so this still enforces
// "at most one overall budget per month".
budgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Budget;
}

export const BudgetModel =
  (mongoose.models.Budget as mongoose.Model<IBudget>) ??
  mongoose.model<IBudget>('Budget', budgetSchema);
