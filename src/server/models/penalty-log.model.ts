import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IPenaltyUnfinishedItem {
  id: string;
  title: string;
  difficulty: string;
}

export interface IPenaltyLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tier: number;
  status: 'pending' | 'completed';
  triggeredDate: Date;
  unfinished: IPenaltyUnfinishedItem[];
  createdAt: Date;
  updatedAt: Date;
}

const PenaltyLogSchema = new Schema<IPenaltyLog>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    tier: { type: Number, required: true, default: 1, min: 1, max: 4 },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    triggeredDate: { type: Date, required: true, default: () => new Date() },
    unfinished: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        difficulty: { type: String, default: 'C' },
      },
    ],
  },
  { timestamps: true },
);

// Only one pending penalty per user at a time
PenaltyLogSchema.index({ userId: 1, status: 1 });

export const PenaltyLogModel =
  (mongoose.models.PenaltyLog as mongoose.Model<IPenaltyLog>) ??
  mongoose.model<IPenaltyLog>('PenaltyLog', PenaltyLogSchema);
