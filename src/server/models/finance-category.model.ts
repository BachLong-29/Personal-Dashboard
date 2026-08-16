import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { TaskColor } from '@/types/task';

export type FinanceCategoryType = 'income' | 'expense';

const FINANCE_CATEGORY_TYPES: FinanceCategoryType[] = ['income', 'expense'];
const FINANCE_CATEGORY_COLORS: TaskColor[] = [
  'gold',
  'mint',
  'violet',
  'cyan',
  'rose',
  'amber',
  'blue',
];

export interface IFinanceCategory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  type: FinanceCategoryType;
  icon: string;
  color: TaskColor;
  /** Keywords matched (case-insensitive, substring) against incoming bank-sync transaction
   * content to auto-assign this category — see the SePay webhook handler. */
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const financeCategorySchema = new Schema<IFinanceCategory>(
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
      maxlength: 50,
    },
    type: {
      type: String,
      enum: FINANCE_CATEGORY_TYPES,
      required: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      enum: FINANCE_CATEGORY_COLORS,
      required: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

financeCategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).FinanceCategory;
}

export const FinanceCategoryModel =
  (mongoose.models.FinanceCategory as mongoose.Model<IFinanceCategory>) ??
  mongoose.model<IFinanceCategory>('FinanceCategory', financeCategorySchema);
