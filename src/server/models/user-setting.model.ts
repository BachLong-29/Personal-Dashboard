import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type QuestDifficultyEnum = 'gentle' | 'rising' | 'harsh';
export type ThemeEnum = 'dark' | 'light' | 'system';

export interface IUserSetting extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  morningRitual: boolean;
  nightlyReview: boolean;
  streakProtection: number;
  questDifficulty: QuestDifficultyEnum;
  seasonalRites: boolean;
  autoReclaim: boolean;
  language: string;
  timezone: string;
  theme: ThemeEnum;
  compactMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSettingSchema = new Schema<IUserSetting>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    morningRitual:    { type: Boolean, default: true },
    nightlyReview:    { type: Boolean, default: true },
    streakProtection: { type: Number,  default: 1, min: 0, max: 3 },
    questDifficulty: {
      type: String,
      enum: ['gentle', 'rising', 'harsh'] satisfies QuestDifficultyEnum[],
      default: 'rising',
    },
    seasonalRites: { type: Boolean, default: true },
    autoReclaim:   { type: Boolean, default: false },
    language:      { type: String, default: 'en', trim: true },
    timezone:      { type: String, default: 'UTC', trim: true },
    theme: {
      type: String,
      enum: ['dark', 'light', 'system'] satisfies ThemeEnum[],
      default: 'dark',
    },
    compactMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const UserSettingModel =
  (mongoose.models.UserSetting as mongoose.Model<IUserSetting>) ??
  mongoose.model<IUserSetting>('UserSetting', userSettingSchema);
