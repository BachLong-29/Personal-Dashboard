import Link from 'next/link';

import type { Character } from '../types';
import { cn } from '@/libs/utils';

interface DashboardTopbarProps {
  char: Character;
  dateStr: string;
  onEndDay: () => void;
}

const DashboardTopbar = (props: DashboardTopbarProps) => {
  const { char, dateStr, onEndDay } = props;

  const topBar =
    'flex items-center gap-3 px-5 py-2.5 bg-[var(--panel)] border-b border-[var(--border)] shrink-0 z-10';

  const topBarLogo =
    'font-[var(--font-title)] text-[18px] font-black tracking-[0.12em] bg-gradient-to-r from-[var(--gold)] to-[var(--violet)] bg-clip-text text-transparent mr-2';

  const currencyPill =
    'flex items-center gap-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[20px] py-1 pr-3 pl-2 text-[12px] font-semibold text-[var(--text-hi)] cursor-default';

  const currencyIcon = 'text-[14px]';
  const gems = '!border-[oklch(0.66_0.22_295_/_0.4)]';
  const coins = '!border-[oklch(0.74_0.17_85_/_0.4)]';

  const dateLabel = 'text-[11px] text-[var(--text-mid)] tracking-[0.08em] font-[var(--font-title)]';

  const streakPill =
    'flex items-center gap-[5px] bg-[oklch(0.74_0.17_85_/_0.1)] border border-[oklch(0.74_0.17_85_/_0.3)] rounded-[20px] px-[10px] py-1 text-[11px] font-bold text-[var(--gold)] font-[var(--font-title)] tracking-[0.05em]';

  const penaltyTrigger =
    'inline-flex items-center gap-[6px] bg-[oklch(0.62_0.24_22_/_0.1)] border border-[oklch(0.62_0.24_22_/_0.4)] text-[oklch(0.85_0.18_22)] px-[11px] py-[5px] rounded-[var(--r-sm)] text-[10px] font-[var(--font-title)] tracking-[0.12em] font-bold cursor-pointer transition-all duration-200 ml-1 hover:bg-[oklch(0.62_0.24_22_/_0.2)] hover:shadow-[0_0_12px_var(--danger-glow)]';

  return (
    <div className={cn(topBar)}>
      <span className={cn(topBarLogo)}>{char.name}</span>
      <span className="text-[var(--gold)] text-[8px] opacity-50">◆</span>
      <div className={cn(currencyPill, gems)}>
        <span className={currencyIcon}>💠</span>
        <span>{char.gems}</span>
      </div>
      <div className={cn(currencyPill, coins)}>
        <span className={currencyIcon}>🪙</span>
        <span>{char.coins}</span>
      </div>
      <div className="flex-1" />
      <button
        className={penaltyTrigger}
        onClick={onEndDay}
        title="Trigger penalty for unfinished quests"
      >
        ⚠ END DAY
      </button>
      <div className={dateLabel}>{dateStr}</div>
      <Link href="/vault" className={cn(streakPill, 'no-underline cursor-pointer')}>
        ✦ Vault
      </Link>
      <div className={streakPill}>🔥 {char.streak} Day Streak</div>
    </div>
  );
};

export default DashboardTopbar;
