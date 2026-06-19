import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type QuestDifficultyEnum = 'gentle' | 'rising' | 'harsh';
export type ThemeEnum = 'dark' | 'light' | 'system';
export type ScheduleModeEnum = 'strict' | 'flexible';

/** Schedule-engine tuning knobs */
export interface IScheduleSettings {
  /** Available work minutes per day (capacity planning) */
  dailyCapacityMinutes: number;
  /** Minimum break between two items before a soft-conflict warning */
  minBreakMinutes: number;
  /** Drag-to-out-of-range behaviour in week view */
  scheduleMode: ScheduleModeEnum;
  /** Minutes before a habit occurrence to remind */
  habitReminderLead: number;
  /** Minutes before a quest block to remind */
  questReminderLead: number;
  /** Days before a due date to warn */
  deadlineWarningDays: number;
}

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
  schedule: IScheduleSettings;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SCHEDULE_SETTINGS: IScheduleSettings = {
  dailyCapacityMinutes: 600,
  minBreakMinutes: 15,
  scheduleMode: 'flexible',
  habitReminderLead: 15,
  questReminderLead: 30,
  deadlineWarningDays: 1,
};

const userSettingSchema = new Schema<IUserSetting>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    morningRitual: { type: Boolean, default: true },
    nightlyReview: { type: Boolean, default: true },
    streakProtection: { type: Number, default: 1, min: 0, max: 3 },
    questDifficulty: {
      type: String,
      enum: ['gentle', 'rising', 'harsh'] satisfies QuestDifficultyEnum[],
      default: 'rising',
    },
    seasonalRites: { type: Boolean, default: true },
    autoReclaim: { type: Boolean, default: false },
    language: { type: String, default: 'en', trim: true },
    timezone: { type: String, default: 'UTC', trim: true },
    theme: {
      type: String,
      enum: ['dark', 'light', 'system'] satisfies ThemeEnum[],
      default: 'dark',
    },
    compactMode: { type: Boolean, default: false },
    schedule: {
      dailyCapacityMinutes: { type: Number, default: 600, min: 60, max: 1440 },
      minBreakMinutes: { type: Number, default: 15, min: 0, max: 240 },
      scheduleMode: {
        type: String,
        enum: ['strict', 'flexible'] satisfies ScheduleModeEnum[],
        default: 'flexible',
      },
      habitReminderLead: { type: Number, default: 15, min: 0, max: 240 },
      questReminderLead: { type: Number, default: 30, min: 0, max: 240 },
      deadlineWarningDays: { type: Number, default: 1, min: 0, max: 14 },
    },
  },
  { timestamps: true },
);

export const UserSettingModel =
  (mongoose.models.UserSetting as mongoose.Model<IUserSetting>) ??
  mongoose.model<IUserSetting>('UserSetting', userSettingSchema);
