import { findClass } from '@/constants/hero-data';
import type { UserProfileData } from '@/types';

import type { Character } from '../types';

export function buildEmptyChar(): Character {
  return {
    name: '',
    title: '',
    level: 1,
    rank: 'E',
    class: '',
    streak: 0,
    xp: 0,
    xpNext: 1000,
    coins: 0,
    gems: 0,
    stats: [
      { key: 'DIS', value: 0, color: 'var(--gold)' },
      { key: 'WIS', value: 0, color: 'var(--violet)' },
      { key: 'END', value: 0, color: 'var(--mint)' },
      { key: 'COM', value: 0, color: 'var(--cyan)' },
      { key: 'SER', value: 0, color: 'var(--rose)' },
    ],
  };
}

export function profileToCharacter(profile: UserProfileData): Character {
  const heroClass = findClass(profile.classId);
  const scale = (v: number) => Math.round((v / Math.max(profile.statPool, 1)) * 100);
  return {
    name: profile.heroName || 'Hero',
    title: profile.title,
    level: profile.level,
    rank: profile.rank || 'E',
    class: heroClass.name,
    streak: profile.streak,
    xp: profile.xp ?? 0,
    xpNext: profile.xpNext ?? 0,
    coins: profile.coins ?? 0,
    gems: profile.gems ?? 0,
    stats: [
      { key: 'DIS', value: scale(profile.stats.discipline), color: 'var(--gold)' },
      { key: 'WIS', value: scale(profile.stats.wisdom), color: 'var(--violet)' },
      { key: 'END', value: scale(profile.stats.endurance), color: 'var(--mint)' },
      { key: 'COM', value: scale(profile.stats.composition), color: 'var(--cyan)' },
      { key: 'SER', value: scale(profile.stats.serenity), color: 'var(--rose)' },
    ],
  };
}
