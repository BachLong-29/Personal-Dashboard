import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'sepay' | 'recurring';

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense'];
const TRANSACTION_SOURCES: TransactionSource[] = ['manual', 'sepay', 'recurring'];

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  note?: string;
  date: Date;
  source: TransactionSource;
  sepayTransactionId?: string;
  recurringId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'FinanceCategory',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    date: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      enum: TRANSACTION_SOURCES,
      default: 'manual',
    },
    sepayTransactionId: {
      type: String,
    },
    recurringId: {
      type: Schema.Types.ObjectId,
      ref: 'RecurringTransaction',
    },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, walletId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ sepayTransactionId: 1 }, { unique: true, sparse: true });

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Transaction;
}

export const TransactionModel =
  (mongoose.models.Transaction as mongoose.Model<ITransaction>) ??
  mongoose.model<ITransaction>('Transaction', transactionSchema);
