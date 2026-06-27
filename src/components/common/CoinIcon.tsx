import { cn } from '@/libs/utils/cn';

/**
 * Gold coin icon — masks public/icons/GiTwoCoins.svg and tints it with the
 * system gold. Sizes to 1em by default so it flows inline like the 🪙 emoji it
 * replaces; pass a `className` (e.g. `w-[14px] h-[14px]` or a color) to override.
 */
export function CoinIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block w-[1em] h-[1em] shrink-0 align-[-0.125em] bg-[var(--gold)]',
        '[mask:url(/icons/GiTwoCoins.svg)_center/contain_no-repeat]',
        '[-webkit-mask:url(/icons/GiTwoCoins.svg)_center/contain_no-repeat]',
        className,
      )}
    />
  );
}
