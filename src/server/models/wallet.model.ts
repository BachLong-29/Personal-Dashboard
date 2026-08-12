import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { TaskColor } from '@/types/task';

export type WalletType = 'bank' | 'cash' | 'ewallet';

const WALLET_TYPES: WalletType[] = ['bank', 'cash', 'ewallet'];
const WALLET_COLORS: TaskColor[] = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'];

export interface IWallet extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  type: WalletType;
  icon: string;
  color: TaskColor;
  currency: string;
  balance: number;
  bankCode?: string;
  bankAccountNumber?: string;
  sepayWebhookSecret?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
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
      enum: WALLET_TYPES,
      required: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      enum: WALLET_COLORS,
      required: true,
    },
    currency: {
      type: String,
      default: 'VND',
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    bankCode: {
      type: String,
      trim: true,
    },
    bankAccountNumber: {
      type: String,
      trim: true,
    },
    sepayWebhookSecret: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

walletSchema.index({ userId: 1, active: 1 });
walletSchema.index({ bankAccountNumber: 1 }, { sparse: true });

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Wallet;
}

export const WalletModel =
  (mongoose.models.Wallet as mongoose.Model<IWallet>) ??
  mongoose.model<IWallet>('Wallet', walletSchema);
