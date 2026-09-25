export type QuestDifficulty = 'gentle' | 'rising' | 'harsh';

export interface HeroStats {
  discipline: number;
  wisdom: number;
  endurance: number;
  composition: number;
  serenity: number;
}

export interface UserProfileData {
  id: string;
  userId: string;
  heroName: string;
  title: string;
  handle: string;
  pronouns: string;
  region: string;
  sigil: string;
  motto: string;
  classId: string;
  companionId: string;
  accent: string;
  stats: HeroStats;
  statPool: number;
  primaryFocus: string[];
  badges: string[];
  joined: string;
  level: number;
  xp: number;
  xpNext: number;
  streak: number;
  coins: number;
  gems: number;
  rank: string;
  updatedAt: string;
}

export interface UserSettingData {
  id: string;
  userId: string;
  morningRitual: boolean;
  nightlyReview: boolean;
  streakProtection: number;
  questDifficulty: QuestDifficulty;
  seasonalRites: boolean;
  autoReclaim: boolean;
  language: string;
  timezone: string;
  theme: 'dark' | 'light' | 'system';
  compactMode: boolean;
  dailyCapacityMinutes: number;
  cashLogEnabled: boolean;
  /** `HH:MM`, read in `timezone`. */
  cashLogTime: string;
  /** Finance category ids; the server fills the defaults until first saved. */
  cashLogCategoryIds: string[];
  updatedAt: string;
}

export interface CombinedProfileResponse {
  profile: UserProfileData;
  settings: UserSettingData;
}

export interface ProfileFormData {
  heroName: string;
  title: string;
  handle: string;
  pronouns: string;
  region: string;
  sigil: string;
  motto: string;
  classId: string;
  companionId: string;
  accent: string;
  stats: HeroStats;
  statPool: number;
  primaryFocus: string[];
  badges: string[];
  morningRitual: boolean;
  nightlyReview: boolean;
  streakProtection: number;
  questDifficulty: QuestDifficulty;
  seasonalRites: boolean;
  autoReclaim: boolean;
  dailyCapacityMinutes: number;
  timezone: string;
  cashLogEnabled: boolean;
  cashLogTime: string;
  cashLogCategoryIds: string[];
}

export const DEFAULT_PROFILE_FORM: ProfileFormData = {
  heroName: '',
  title: '',
  handle: '',
  pronouns: 'they / them',
  region: '',
  sigil: '✦',
  motto: '',
  classId: 'scribe',
  companionId: 'fox',
  accent: 'amber',
  stats: {
    discipline: 6,
    wisdom: 6,
    endurance: 5,
    composition: 7,
    serenity: 6,
  },
  statPool: 30,
  primaryFocus: ['mind', 'craft'],
  badges: [],
  morningRitual: true,
  nightlyReview: true,
  streakProtection: 1,
  questDifficulty: 'rising',
  seasonalRites: true,
  autoReclaim: false,
  dailyCapacityMinutes: 600,
  timezone: 'UTC',
  cashLogEnabled: true,
  cashLogTime: '22:00',
  cashLogCategoryIds: [],
};

export function mergeProfileToForm(
  profile: UserProfileData,
  settings: UserSettingData,
): ProfileFormData {
  return {
    heroName: profile.heroName,
    title: profile.title,
    handle: profile.handle,
    pronouns: profile.pronouns,
    region: profile.region,
    sigil: profile.sigil,
    motto: profile.motto,
    classId: profile.classId,
    companionId: profile.companionId,
    accent: profile.accent,
    stats: { ...profile.stats },
    statPool: profile.statPool,
    primaryFocus: [...profile.primaryFocus],
    badges: [...profile.badges],
    morningRitual: settings.morningRitual,
    nightlyReview: settings.nightlyReview,
    streakProtection: settings.streakProtection,
    questDifficulty: settings.questDifficulty,
    seasonalRites: settings.seasonalRites,
    autoReclaim: settings.autoReclaim,
    dailyCapacityMinutes: settings.dailyCapacityMinutes,
    timezone: settings.timezone,
    cashLogEnabled: settings.cashLogEnabled,
    cashLogTime: settings.cashLogTime,
    cashLogCategoryIds: [...settings.cashLogCategoryIds],
  };
}
