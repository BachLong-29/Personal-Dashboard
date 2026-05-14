import { cn } from '@/libs/utils';

export interface SkeletonProps {
  className?: string;
}

export interface SkelLineProps {
  width?: '40' | '70' | '100';
  className?: string;
}

export interface SkelBlockProps {
  className?: string;
}

export interface SkelCircleProps {
  className?: string;
}

// const shimmer =
//   'bg-[length:200%_100%] animate-[skel-shimmer_1.4s_linear_infinite]';

export function SkelLine({ width = '100', className }: SkelLineProps) {
  return (
    <div
      className={cn(
        'h-3 mb-2 rounded-[var(--r-sm)]',
        'bg-gradient-to-r from-[var(--bg-3)] via-[var(--bg-4)] to-[var(--bg-3)] bg-[length:200%_100%]',
        '[animation:skel-shimmer_1.4s_linear_infinite]',
        width === '70' && 'w-[70%]',
        width === '40' && 'w-[40%]',
        width === '100' && 'w-full',
        className,
      )}
    />
  );
}

export function SkelBlock({ className }: SkelBlockProps) {
  return (
    <div
      className={cn(
        'w-full h-20 rounded-[var(--r-sm)]',
        'bg-gradient-to-r from-[var(--bg-3)] via-[var(--bg-4)] to-[var(--bg-3)] bg-[length:200%_100%]',
        '[animation:skel-shimmer_1.4s_linear_infinite]',
        className,
      )}
    />
  );
}

export function SkelCircle({ className }: SkelCircleProps) {
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full shrink-0',
        'bg-gradient-to-r from-[var(--bg-3)] via-[var(--bg-4)] to-[var(--bg-3)] bg-[length:200%_100%]',
        '[animation:skel-shimmer_1.4s_linear_infinite]',
        className,
      )}
    />
  );
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--r-sm)]',
        'bg-gradient-to-r from-[var(--bg-3)] via-[var(--bg-4)] to-[var(--bg-3)] bg-[length:200%_100%]',
        '[animation:skel-shimmer_1.4s_linear_infinite]',
        className,
      )}
    />
  );
}
