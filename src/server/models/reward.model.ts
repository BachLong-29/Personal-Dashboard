import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { RewardColor, RewardRarity, RewardStatus, RewardUnlockCondition } from '@/types/reward';

export interface IReward extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  icon?: string;
  color: RewardColor;
  rarity: RewardRarity;
  status: RewardStatus;
  coinCost?: number;
  gemCost?: number;
  unlockCondition?: RewardUnlockCondition;
  /** Available stock — undefined means unlimited */
  stock?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const REWARD_COLORS: RewardColor[] = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'];
const REWARD_RARITIES: RewardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const REWARD_STATUSES: RewardStatus[] = ['active', 'inactive', 'limited', 'sold_out'];

const unlockConditionSchema = new Schema<RewardUnlockCondition>(
  {
    minLevel: { type: Number, min: 1 },
    minRank: { type: String, trim: true },
  },
  { _id: false },
);

const rewardSchema = new Schema<IReward>(
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
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    icon: {
      type: String,
      trim: true,
      maxlength: 10,
    },
    color: {
      type: String,
      enum: REWARD_COLORS,
      required: true,
      default: 'gold',
    },
    rarity: {
      type: String,
      enum: REWARD_RARITIES,
      required: true,
      default: 'common',
    },
    status: {
      type: String,
      enum: REWARD_STATUSES,
      required: true,
      default: 'active',
    },
    coinCost: {
      type: Number,
      min: 0,
    },
    gemCost: {
      type: Number,
      min: 0,
    },
    unlockCondition: {
      type: unlockConditionSchema,
    },
    stock: {
      type: Number,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

rewardSchema.index({ userId: 1, rarity: 1 });
rewardSchema.index({ userId: 1, status: 1 });
rewardSchema.index({ userId: 1, active: 1 });

// Force re-register in dev to avoid stale schema after hot-reload
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Reward;
}

export const RewardModel =
  (mongoose.models.Reward as mongoose.Model<IReward>) ??
  mongoose.model<IReward>('Reward', rewardSchema);
