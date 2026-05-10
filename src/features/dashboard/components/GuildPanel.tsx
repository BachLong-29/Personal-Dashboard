import type { GuildMember } from '../types';

import { cn } from '@/libs/utils';

const GUILD_MEMBERS: GuildMember[] = [
  { name: 'Zephyr Cole', level: 31, avatar: '🧙‍♂️', online: true },
  { name: 'Nova Kim', level: 28, avatar: '🧝‍♀️', online: true },
  { name: 'Rein Ashford', level: 19, avatar: '⚔️', online: false },
  { name: 'Luna Vale', level: 22, avatar: '🌙', online: true },
];

const onlineCount = GUILD_MEMBERS.filter((m) => m.online).length;

export function GuildPanel() {
  return (
    <div className={cn(panelBase, guildPanel)}>
      <div className={panelHeader}>
        <span className={panelHeaderTitle}>Guild ◆ Aetheria</span>
        <span className={onlineCountLabel}>{onlineCount} Online</span>
      </div>
      <div className={guildList}>
        {GUILD_MEMBERS.map((m, i) => (
          <div key={i} className={guildMember}>
            <div className={guildAvatar}>{m.avatar}</div>
            <span className={guildName}>{m.name}</span>
            <span className={guildLevel}>Lv.{m.level}</span>
            <div className={m.online ? guildOnline : guildOffline} />
          </div>
        ))}
      </div>
    </div>
  );
}

const panelBase =
  "bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] overflow-hidden relative before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)]";

const panelHeader = 'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)]';
const panelHeaderTitle =
  'font-[var(--font-title)] text-[10px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase flex-1';

const guildPanel = 'flex-1 min-h-[120px]';
const onlineCountLabel = 'text-[9px] text-[var(--mint)]';

const guildList = 'px-3 py-2 flex flex-col gap-1.5';
const guildMember =
  'flex items-center gap-2 px-2 py-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)]';
const guildAvatar =
  'w-7 h-7 rounded-full flex items-center justify-center text-[14px] bg-[var(--panel3)] border border-[var(--border)] shrink-0';
const guildName = 'text-[11px] font-semibold flex-1 text-[var(--text-hi)]';
const guildLevel = 'text-[9px] text-[var(--gold)] font-[var(--font-title)] font-bold';
const guildOnline = 'w-1.5 h-1.5 rounded-full bg-[var(--mint)] shadow-[0_0_6px_var(--mint)] shrink-0';
const guildOffline = 'w-1.5 h-1.5 rounded-full bg-[var(--text-lo)] shrink-0';
