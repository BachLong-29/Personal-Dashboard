import type { Character, DashboardSettings } from '../types';

import { cn } from '@/libs/utils';

interface CharacterPanelProps {
  char: Character;
  settings: DashboardSettings;
}

export function CharacterPanel({ char, settings }: CharacterPanelProps) {
  const xpPct = (char.xp / char.xpNext) * 100;
  const displayName = settings.characterName || char.name;

  return (
    <div className={cn(panelBase, panelGold, 'shrink-0')}>
      <div className={cornerTL} />
      <div className={cornerTR} />
      <div className={cornerBL} />
      <div className={cornerBR} />
      <div className={panelHeader}>
        <span className={profileLabel}>PROFILE</span>
        <span className="flex-1" />
        <span className={levelLabel}>Lv.{char.level}</span>
      </div>
      <div className={avatarWrap}>
        <div className={halo} />
        <div className={avatarRing}>
          <div className={avatarInner}>🧝‍♀️</div>
          <div className={rankBadge}>{char.rank}</div>
        </div>
      </div>
      <div className={charName}>{displayName}</div>
      <div className={charTitleLine}>◆ {char.title} ◆</div>
      <div className={metaWrap}>
        <div className={metaItem}>
          <div className={metaVal}>{char.level}</div>
          <div className={metaKey}>Level</div>
        </div>
        <div className={metaDivider} />
        <div className={metaItem}>
          <div className={metaVal} style={{ color: 'var(--rose)' }}>
            {char.streak}
          </div>
          <div className={metaKey}>Streak</div>
        </div>
        <div className={metaDivider} />
        <div className={metaItem}>
          <div className={metaVal} style={{ color: 'var(--mint)' }}>
            {char.class}
          </div>
          <div className={metaKey}>Class</div>
        </div>
      </div>
      <div className={xpWrap}>
        <div className={xpLabel}>
          <span>EXP</span>
          <span className={xpValue}>
            {char.xp.toLocaleString()} / {char.xpNext.toLocaleString()}
          </span>
        </div>
        <div className={xpTrack}>
          <div className={xpFill} style={{ width: `${xpPct}%` }} />
        </div>
      </div>
      <div className={statsWrap}>
        {char.stats.map((s) => (
          <div className={statRow} key={s.key}>
            <span className={statKey}>{s.key}</span>
            <div className={statTrack}>
              <div className={statFill} style={{ width: `${s.value}%`, background: s.color }} />
            </div>
            <span className={statVal}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const panelBase =
  "bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] overflow-hidden relative before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)]";

const panelGold =
  'border-[oklch(0.74_0.17_85_/_0.35)] shadow-[0_0_20px_oklch(0.74_0.17_85_/_0.06),inset_0_0_20px_oklch(0.74_0.17_85_/_0.03)]';

const panelHeader =
  'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)]';

const cornerBase = 'absolute w-3 h-3 pointer-events-none border-[var(--gold-dim)]';
const cornerTL = cn(cornerBase, 'top-[5px] left-[5px] border-t-[1.5px] border-l-[1.5px]');
const cornerTR = cn(cornerBase, 'top-[5px] right-[5px] border-t-[1.5px] border-r-[1.5px]');
const cornerBL = cn(cornerBase, 'bottom-[5px] left-[5px] border-b-[1.5px] border-l-[1.5px]');
const cornerBR = cn(cornerBase, 'bottom-[5px] right-[5px] border-b-[1.5px] border-r-[1.5px]');

const profileLabel =
  'text-[9px] text-[var(--gold)] font-[var(--font-title)] font-bold tracking-[0.15em]';
const levelLabel = 'text-[10px] text-[var(--text-mid)]';

const avatarWrap = 'relative flex justify-center px-4 pt-4 pb-2';
const halo =
  'absolute w-[110px] h-[110px] rounded-full bg-[radial-gradient(circle,var(--violet-glow)_0%,transparent_70%)] top-2 left-1/2 -translate-x-1/2 pointer-events-none';
const avatarRing =
  'relative w-[88px] h-[88px] rounded-full bg-[linear-gradient(135deg,var(--gold),var(--violet),var(--gold))] p-0.5 shadow-[0_0_24px_var(--gold-glow),0_0_48px_var(--violet-glow)]';
const avatarInner =
  'w-full h-full rounded-full bg-[var(--panel2)] flex items-center justify-center overflow-hidden text-[36px]';
const rankBadge =
  'absolute -bottom-[2px] -right-[2px] w-6 h-6 bg-[linear-gradient(135deg,var(--gold),#b45309)] rounded-[6px] flex items-center justify-center font-[var(--font-title)] text-[11px] font-black text-[#0a0400] border-[1.5px] border-[var(--panel)] shadow-[0_0_10px_var(--gold-glow)]';

const charName =
  'font-[var(--font-title)] text-[13px] font-bold text-[var(--text-hi)] text-center px-3 pb-0.5 tracking-[0.05em]';
const charTitleLine =
  'text-[10px] text-[var(--violet)] text-center tracking-[0.1em] pb-2 font-medium';

const metaWrap = 'flex justify-center gap-3 px-3 pb-2.5';
const metaItem = 'text-center';
const metaVal = 'font-[var(--font-title)] text-[14px] font-bold text-[var(--gold)]';
const metaKey = 'text-[9px] text-[var(--text-mid)] tracking-[0.1em] uppercase';
const metaDivider = 'w-px bg-[var(--border)] self-stretch';

const xpWrap = 'px-[14px] pb-3';
const xpLabel =
  'flex justify-between text-[9px] text-[var(--text-mid)] tracking-[0.08em] uppercase mb-1';
const xpValue = 'text-[var(--violet)] font-semibold';
const xpTrack =
  'h-[6px] bg-[var(--panel3)] rounded-[3px] overflow-hidden border border-[var(--border)]';
const xpFill =
  "h-full rounded-[3px] bg-[linear-gradient(90deg,var(--violet-dim),var(--violet))] shadow-[0_0_8px_var(--violet-glow)] transition-[width] duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden after:content-[''] after:absolute after:top-0 after:left-[-100%] after:w-[60%] after:h-full after:bg-[linear-gradient(90deg,transparent,oklch(1_0_0_/_0.4),transparent)] after:animate-[shimmer_2.5s_infinite]";

const statsWrap = 'px-[14px] pb-3 flex flex-col gap-1.5';
const statRow = 'flex items-center gap-1.5';
const statKey =
  'text-[9px] font-[var(--font-title)] tracking-[0.1em] text-[var(--text-mid)] w-7 shrink-0';
const statTrack =
  'flex-1 h-[5px] bg-[var(--panel3)] rounded-[3px] overflow-hidden border border-[var(--border)]';
const statFill =
  'h-full rounded-[3px] transition-[width] duration-[600ms] ease-[ease] shadow-[0_0_6px_currentColor]';
const statVal = 'text-[9px] font-bold text-[var(--text-mid)] w-[22px] text-right shrink-0';
