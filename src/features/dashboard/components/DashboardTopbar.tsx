import Link from 'next/link';

import type { Character } from '../types';

interface DashboardTopbarProps {
  char: Character;
  dateStr: string;
  onEndDay: () => void;
}

export function DashboardTopbar({ char, dateStr, onEndDay }: DashboardTopbarProps) {
  return (
    <div className="topbar">
      <span className="topbar-logo">AETHERIA</span>
      <span className="topbar-diamond">◆</span>
      <div className="currency-pill gems">
        <span className="icon">💠</span>
        <span>{char.gems}</span>
      </div>
      <div className="currency-pill coins">
        <span className="icon">🪙</span>
        <span>{char.coins}</span>
      </div>
      <div className="topbar-spacer" />
      <button className="penalty-trigger-btn" onClick={onEndDay} title="Trigger penalty for unfinished quests">
        ⚠ END DAY
      </button>
      <div className="topbar-date">{dateStr}</div>
      <Link href="/vault" className="topbar-streak" style={{ textDecoration: 'none', cursor: 'pointer' }}>
        ✦ Vault
      </Link>
      <div className="topbar-streak">🔥 {char.streak} Day Streak</div>
    </div>
  );
}
