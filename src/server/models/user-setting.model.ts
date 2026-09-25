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

/**
 * End-of-day nudge to write down the cash you spent. Bank spending arrives by
 * itself through the SePay webhook; cash only exists if someone types it in.
 */
export interface ICashLogSettings {
  enabled: boolean;
  /** `HH:MM`, read in the user's own timezone — see `UserSetting.timezone`. */
  time: string;
  /**
   * Finance categories worth chasing. Left unset until the user first saves,
   * which is what lets the defaults be filled in from their own category
   * names rather than hardcoded ids — see `resolveCashLogCategoryIds`.
   */
  categoryIds?: mongoose.Types.ObjectId[];
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
  cashLog: ICashLogSettings;
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

export const DEFAULT_CASH_LOG_SETTINGS: Omit<ICashLogSettings, 'categoryIds'> = {
  enabled: true,
  time: '22:00',
};

const cashLogSchema = new Schema<ICashLogSettings>(
  {
    enabled: { type: Boolean, default: DEFAULT_CASH_LOG_SETTINGS.enabled },
    time: {
      type: String,
      default: DEFAULT_CASH_LOG_SETTINGS.time,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    // No `default: []` on purpose: an empty array has to mean "the user
    // deliberately unticked everything", which is different from "never
    // configured" and must not be overwritten by the defaults.
    categoryIds: { type: [Schema.Types.ObjectId], ref: 'FinanceCategory', default: undefined },
  },
  { _id: false },
);

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
    cashLog: { type: cashLogSchema, default: () => ({}) },
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
