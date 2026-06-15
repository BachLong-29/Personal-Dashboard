import type { MarketRewardCategoryKey, MarketRewardCurrency, MarketRewardRarity } from '../types';

export const MARKET_CATEGORIES: { key: MarketRewardCategoryKey; label: string; icon: string }[] = [
  { key: 'all', label: 'All Rewards', icon: '✦' },
  { key: 'real', label: 'Real-World', icon: '📦' },
  { key: 'cosmetic', label: 'Cosmetics', icon: '🎨' },
  { key: 'game', label: 'Artifacts', icon: '⚔️' },
  { key: 'booster', label: 'Boosters', icon: '⚡' },
  { key: 'quest', label: 'New Modes', icon: '🗺️' },
];

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
