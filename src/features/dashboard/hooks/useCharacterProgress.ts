import { useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { Character } from '../types';

interface ProgressAward {
  xp: number;
  coins: number;
  gems?: number;
}

interface GameStatePatch {
  level: number;
  xp: number;
  xpNext: number;
  streak: number;
  coins: number;
  gems: number;
  rank: string;
}

function toGameStatePatch(c: Character): GameStatePatch {
  return {
    level: c.level,
    xp: c.xp,
    xpNext: c.xpNext,
    streak: c.streak,
    coins: c.coins,
    gems: c.gems,
    rank: c.rank,
  };
}

export function useCharacterProgress(
  char: Character,
  setChar: React.Dispatch<React.SetStateAction<Character>>,
) {
  // Always-fresh ref — avoids stale closure without adding char as a callback dep
  const charRef = useRef(char);
  charRef.current = char;

  const { mutate: syncToApi } = useMutation({
    mutationFn: (state: GameStatePatch) =>
      apiClient.put('/profile', state).then((r) => r.data),
  });

  // Use after quest / habit / task completion.
  // Handles level-up automatically and persists to API.
  const awardProgress = useCallback(
    (award: ProgressAward) => {
      const c = charRef.current;
      const newXp = c.xp + award.xp;
      const leveled = newXp >= c.xpNext;
      const next: Character = {
        ...c,
        xp: leveled ? newXp - c.xpNext : newXp,
        coins: c.coins + award.coins,
        gems: c.gems + (award.gems ?? 0),
        level: leveled ? c.level + 1 : c.level,
        xpNext: leveled ? Math.round(c.xpNext * 1.3) : c.xpNext,
      };
      setChar(next);
      syncToApi(toGameStatePatch(next));
    },
    [setChar, syncToApi],
  );

  // Use for penalties and other arbitrary char mutations.
  // Accepts a pure updater function and persists the result to API.
  const applyGamePatch = useCallback(
    (updater: (prev: Character) => Character) => {
      const next = updater(charRef.current);
      setChar(next);
      syncToApi(toGameStatePatch(next));
    },
    [setChar, syncToApi],
  );

  return { awardProgress, applyGamePatch };
}
