import type {
  MarketRewardCategory,
  MarketRewardCategoryKey,
  MarketRewardCurrency,
  MarketRewardRarity,
} from '../types';

// Filter tabs — reward.cat 'cosmetic' | 'game' | 'booster' | 'quest' all bucket under 'game'
// ("In-Game") here; see the `filtered`/`counts` grouping in MarketPlace.tsx.
export const MARKET_CATEGORIES: { key: MarketRewardCategoryKey; label: string; icon: string }[] = [
  { key: 'all', label: 'All Rewards', icon: '✦' },
  { key: 'real', label: 'Real-World', icon: '📦' },
  { key: 'game', label: 'In-Game', icon: '🎮' },
];

// Each reward's own specific category badge (detail modal) — kept granular even though the
// filter tabs above group them together.
export const MARKET_CATEGORY_LABELS: Record<MarketRewardCategory, string> = {
  real: 'Real-World',
  cosmetic: 'Cosmetics',
  game: 'Artifacts',
  booster: 'Boosters',
  quest: 'New Modes',
};

export const RARITY_LABEL: Record<MarketRewardRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
};

export const CURRENCY_ICON: Record<MarketRewardCurrency, string> = {
  coins: '🪙',
  gems: '💠',
  achievement: '🏆',
};

export const RARITY_COLOR: Record<MarketRewardRarity, string> = {
  common: '#6b7280',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24',
  mythic: '#f472b6',
};
