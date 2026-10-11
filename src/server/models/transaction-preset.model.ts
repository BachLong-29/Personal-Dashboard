import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { TransactionType } from '@/types/finance';

export const MAX_TRANSACTION_PRESETS = 4;

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense'];

export interface ITransactionPreset extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  label: string;
  type: TransactionType;
  amount: number;
  walletId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionPresetSchema = new Schema<ITransactionPreset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 16 },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true, min: 1 },
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'FinanceCategory', required: true },
    note: { type: String, trim: true, maxlength: 100 },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).TransactionPreset;
}

export const TransactionPresetModel =
  (mongoose.models.TransactionPreset as mongoose.Model<ITransactionPreset>) ??
  mongoose.model<ITransactionPreset>('TransactionPreset', transactionPresetSchema);
