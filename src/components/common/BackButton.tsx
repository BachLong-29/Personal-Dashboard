'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';

/**
 * Sends the reader back a step in their own history.
 *
 * Uses the plain router rather than the localised one: this walks the browser's
 * history stack, which already holds whatever locale they arrived with.
 */
export function BackButton({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <Button variant="ghost" size="lg" onClick={() => router.back()}>
      {children}
    </Button>
  );
}
