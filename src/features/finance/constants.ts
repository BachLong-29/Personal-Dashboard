import type { TaskColor } from '@/types';
import type { WalletType } from '@/types/finance';

/** TaskColor → oklch CSS value (mirrors projects feature's COLOR_CSS). */
export const COLOR_CSS: Record<TaskColor, string> = {
  gold: 'oklch(0.74 0.17 85)',
  mint: 'oklch(0.76 0.14 162)',
  violet: 'oklch(0.66 0.22 295)',
  cyan: 'oklch(0.76 0.16 205)',
  rose: 'oklch(0.72 0.18 5)',
  amber: 'oklch(0.76 0.16 55)',
  blue: 'oklch(0.65 0.18 250)',
};

export const COLOR_OPTIONS: { value: TaskColor; label: string }[] = [
  { value: 'gold', label: 'Gold' },
  { value: 'mint', label: 'Mint' },
  { value: 'violet', label: 'Violet' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'rose', label: 'Rose' },
  { value: 'amber', label: 'Amber' },
  { value: 'blue', label: 'Blue' },
];

export const WALLET_TYPE_OPTIONS: { value: WalletType; label: string; icon: string }[] = [
  { value: 'bank', label: 'Bank', icon: '🏦' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'ewallet', label: 'E-Wallet', icon: '📱' },
];

export const WALLET_ICONS = ['🏦', '💵', '📱', '💳', '🪙', '🐷', '💰', '🏧'];

export const CATEGORY_ICONS = [
  '🍜',
  '🚗',
  '🛍',
  '🧾',
  '🎮',
  '💊',
  '📦',
  '💼',
  '🎁',
  '📥',
  '🏠',
  '✈️',
  '📚',
  '🎓',
  '🐾',
  '☕',
];

export const GOAL_ICONS = ['🎯', '🎓', '🏠', '🚗', '✈️', '💻', '🛟', '💍', '🏝', '🎁'];
