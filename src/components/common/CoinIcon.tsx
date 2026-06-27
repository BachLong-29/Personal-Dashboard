import { cn } from '@/libs/utils/cn';
import { Icon } from './Icon';

/**
 * Gold coin icon — masks public/icons/GiTwoCoins.svg and tints it with the
 * system gold. Sizes to 1em by default so it flows inline like the 🪙 emoji it
 * replaces; pass a `className` (e.g. `w-[14px] h-[14px]` or a color) to override.
 */
export function CoinIcon({ className }: { className?: string }) {
  return <Icon icon="coins" className={cn('text-[var(--gold)]', className)} />;
}
