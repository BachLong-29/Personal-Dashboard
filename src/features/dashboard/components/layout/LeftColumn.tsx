import { memo } from 'react';

import type { Character, DashboardSettings } from '../../types';
import { AchievementsPanel } from '../character/AchievementsPanel';
import { CharacterPanel } from '../character/CharacterPanel';

interface Props {
  char: Character;
  settings: DashboardSettings;
}

export const LeftColumn = memo(function LeftColumn({ char, settings }: Props) {
  return (
    <>
      <CharacterPanel char={char} settings={settings} />
      <AchievementsPanel />
    </>
  );
});
