import { cn } from '@/libs/utils';

export interface SpinnerRingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface DotLoaderProps {
  className?: string;
}

export function SpinnerRing({ size = 'md', className }: SpinnerRingProps) {
  return (
    <div
      className={cn(
        'rounded-full border-[var(--border)] border-t-[var(--gold)] animate-spin',
        size === 'sm' && 'w-4 h-4 border-2',
        size === 'md' && 'w-7 h-7 border-[2.5px]',
        size === 'lg' && 'w-10 h-10 border-[3px]',
        className,
      )}
      style={{ borderStyle: 'solid' }}
    />
  );
}

export function DotLoader({ className }: DotLoaderProps) {
  return (
    <div className={cn('inline-flex gap-1', className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] [animation:dot-bounce_1.2s_ease-in-out_infinite]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] [animation:dot-bounce_1.2s_ease-in-out_infinite_0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] [animation:dot-bounce_1.2s_ease-in-out_infinite_0.3s]" />
    </div>
  );
}

export function Loading({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <SpinnerRing />
      <DotLoader />
    </div>
  );
}
