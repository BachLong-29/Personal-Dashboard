import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type GoldType = 'sjc' | 'doji' | 'pnj' | '24k' | 'vngsjc';

const GOLD_TYPES: GoldType[] = ['sjc', 'doji', 'pnj', '24k', 'vngsjc'];

export interface IGoldPriceSnapshot extends Document {
  _id: mongoose.Types.ObjectId;
  goldType: GoldType;
  name: string;
  buyPrice: number;
  sellPrice: number;
  source: string;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const goldPriceSnapshotSchema = new Schema<IGoldPriceSnapshot>(
  {
    goldType: {
      type: String,
      enum: GOLD_TYPES,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    buyPrice: {
      type: Number,
      required: true,
    },
    sellPrice: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    fetchedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).GoldPriceSnapshot;
}

export const GoldPriceSnapshotModel =
  (mongoose.models.GoldPriceSnapshot as mongoose.Model<IGoldPriceSnapshot>) ??
  mongoose.model<IGoldPriceSnapshot>('GoldPriceSnapshot', goldPriceSnapshotSchema);
