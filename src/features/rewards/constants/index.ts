import type { RewardColor, RewardRarity, RewardStatus } from '@/types/reward';

// ─── Rarity metadata ──────────────────────────────────────────────────────────

export interface RarityMeta {
  id: RewardRarity;
  label: string;
  tier: number;
  color: string;
  glow: string;
  bg: string;
}

export const RARITY_META: Record<RewardRarity, RarityMeta> = {
  common: {
    id: 'common',
    label: 'Common',
    tier: 1,
    color: 'oklch(0.72 0.04 240)',
    glow:  'oklch(0.72 0.04 240 / 0.35)',
    bg:    'oklch(0.72 0.04 240 / 0.08)',
  },
  uncommon: {
    id: 'uncommon',
    label: 'Uncommon',
    tier: 2,
    color: 'oklch(0.76 0.14 162)',
    glow:  'oklch(0.76 0.14 162 / 0.4)',
    bg:    'oklch(0.76 0.14 162 / 0.08)',
  },
  rare: {
    id: 'rare',
    label: 'Rare',
    tier: 3,
    color: 'oklch(0.76 0.16 205)',
    glow:  'oklch(0.76 0.16 205 / 0.45)',
    bg:    'oklch(0.76 0.16 205 / 0.08)',
  },
  epic: {
    id: 'epic',
    label: 'Epic',
    tier: 4,
    color: 'oklch(0.68 0.22 295)',
    glow:  'oklch(0.68 0.22 295 / 0.55)',
    bg:    'oklch(0.68 0.22 295 / 0.08)',
  },
  legendary: {
    id: 'legendary',
    label: 'Legendary',
    tier: 5,
    color: 'oklch(0.82 0.17 82)',
    glow:  'oklch(0.82 0.17 82 / 0.7)',
    bg:    'oklch(0.82 0.17 82 / 0.1)',
  },
};

export const RARITIES: RarityMeta[] = [
  RARITY_META.common,
  RARITY_META.uncommon,
  RARITY_META.rare,
  RARITY_META.epic,
  RARITY_META.legendary,
];

// ─── Status metadata ──────────────────────────────────────────────────────────

export interface StatusMeta {
  id: RewardStatus;
  label: string;
  color: string;
  bg: string;
  icon: string;
}

export const STATUS_META: Record<RewardStatus, StatusMeta> = {
  active:   { id: 'active',   label: 'Active',    color: 'var(--mint)',     bg: 'oklch(0.76 0.14 162 / 0.1)', icon: '●' },
  inactive: { id: 'inactive', label: 'Inactive',  color: 'var(--text-lo)', bg: 'transparent',                 icon: '○' },
  limited:  { id: 'limited',  label: 'Limited',   color: 'var(--rose)',     bg: 'oklch(0.72 0.18 5 / 0.1)',   icon: '✦' },
  sold_out: { id: 'sold_out', label: 'Sold Out',  color: 'var(--text-dim)', bg: 'transparent',                icon: '✕' },
};

export const STATUSES: StatusMeta[] = Object.values(STATUS_META);

// ─── Color metadata ───────────────────────────────────────────────────────────

export const COLOR_VALUES: Record<RewardColor, string> = {
  gold:   'oklch(0.74 0.17 85)',
  mint:   'oklch(0.76 0.14 162)',
  violet: 'oklch(0.66 0.22 295)',
  cyan:   'oklch(0.76 0.16 205)',
  rose:   'oklch(0.72 0.18 5)',
  amber:  'oklch(0.76 0.16 55)',
  blue:   'oklch(0.65 0.18 250)',
};

export const REWARD_COLORS: RewardColor[] = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'];

// ─── Sort options ─────────────────────────────────────────────────────────────

export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Recent' },
  { value: 'rarity',    label: 'Rarity' },
  { value: 'coinCost',  label: 'Coin Cost' },
  { value: 'gemCost',   label: 'Gem Cost' },
  { value: 'name',      label: 'Name' },
] as const;
