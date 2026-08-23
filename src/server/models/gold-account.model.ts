import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

/**
 * One gold holding per user — not a list. Quantity is entered the way people actually say it
 * ("2 cây 5 chỉ"): a whole-"cây" (lượng, 10 chỉ) count and a leftover "chỉ" count, kept as two
 * separate fields rather than pre-summed.
 */
export interface IGoldAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  quantityChi: number;
  quantityCay: number;
  createdAt: Date;
  updatedAt: Date;
}

const goldAccountSchema = new Schema<IGoldAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    quantityChi: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantityCay: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).GoldAccount;
}

export const GoldAccountModel =
  (mongoose.models.GoldAccount as mongoose.Model<IGoldAccount>) ??
  mongoose.model<IGoldAccount>('GoldAccount', goldAccountSchema);
