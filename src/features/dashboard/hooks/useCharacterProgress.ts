import { useCallback, useLayoutEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { RANKS, RANK_LEVEL_THRESHOLDS } from '../constants';
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

/** Returns the highest rank the character qualifies for at `level`. */
function resolveRankForLevel(level: number): (typeof RANKS)[number] {
  const sorted = (Object.entries(RANK_LEVEL_THRESHOLDS) as [(typeof RANKS)[number], number][]).sort(
    (a, b) => b[1] - a[1],
  );
  for (const [rank, threshold] of sorted) {
    if (level >= threshold) return rank;
  }
  return 'F';
}

export function useCharacterProgress(
  char: Character,
  setChar: React.Dispatch<React.SetStateAction<Character>>,
  onLevelUp?: (newLevel: number, promotedRank?: string) => void,
) {
  // Always-fresh ref — avoids stale closure without adding char as a callback dep
  const charRef = useRef(char);
  useLayoutEffect(() => {
    charRef.current = char;
  });

  const { mutate: syncToApi } = useMutation({
    mutationFn: (state: GameStatePatch) => apiClient.put('/profile', state).then((r) => r.data),
  });

  // Use after quest / habit / task completion.
  // Handles level-up and rank auto-promotion, then persists to API.
  const awardProgress = useCallback(
    (award: ProgressAward) => {
      const c = charRef.current;
      const newXp = c.xp + award.xp;
      const leveled = newXp >= c.xpNext;

      let newRank = c.rank;
      let promotedRank: string | undefined;

      if (leveled) {
        const newLevel = c.level + 1;
        const qualified = resolveRankForLevel(newLevel);
        const qualIdx = RANKS.indexOf(qualified);
        const curIdx = RANKS.indexOf(c.rank as (typeof RANKS)[number]);
        if (qualIdx > curIdx) {
          newRank = qualified;
          promotedRank = qualified;
        }
      }

      const next: Character = {
        ...c,
        xp: leveled ? newXp - c.xpNext : newXp,
        coins: c.coins + award.coins,
        gems: c.gems + (award.gems ?? 0),
        level: leveled ? c.level + 1 : c.level,
        xpNext: leveled ? Math.round(c.xpNext * 1.3) : c.xpNext,
        rank: newRank,
      };
      setChar(next);
      syncToApi(toGameStatePatch(next));

      if (leveled) onLevelUp?.(next.level, promotedRank);
    },
    [setChar, syncToApi, onLevelUp],
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
