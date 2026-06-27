'use client';

import { useEffect } from 'react';

import { CoinIcon } from '@/components/common/CoinIcon';

interface XPToastProps {
  xp: number;
  coins: number;
  onDone: () => void;
}

export function XPToast({ xp, coins, onDone }: XPToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="xp-toast">
      <span>⚡</span>
      <span>+{xp} XP</span>
      <span style={{ color: 'var(--gold)', fontSize: 11 }}>
        +{coins} <CoinIcon />
      </span>
      <span style={{ color: 'var(--text-mid)', fontSize: 10, marginLeft: 4 }}>Quest Complete!</span>
    </div>
  );
}
