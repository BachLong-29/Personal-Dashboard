'use client';

import { useEffect } from 'react';

interface LevelUpToastProps {
  level: number;
  rank?: string;
  onDone: () => void;
}

export function LevelUpToast({ level, rank, onDone }: LevelUpToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="level-up-toast">
      <span className="level-up-toast__star">★</span>
      <div className="level-up-toast__body">
        <span className="level-up-toast__title">LEVEL UP</span>
        <span className="level-up-toast__level">Level {level}</span>
        {rank && <span className="level-up-toast__rank">Rank {rank} Unlocked!</span>}
      </div>
      <span className="level-up-toast__star">★</span>
    </div>
  );
}
