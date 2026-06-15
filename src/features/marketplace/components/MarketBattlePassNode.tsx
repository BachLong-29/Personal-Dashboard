import { cn } from '@/libs/utils';

import { RARITY_COLOR } from '../constants';
import type { MarketBattlePassNode as MarketBattlePassNodeData } from '../types';

interface MarketBattlePassNodeProps {
  node: MarketBattlePassNodeData;
}

export function MarketBattlePassNode({ node }: MarketBattlePassNodeProps) {
  return (
    <div
      className={cn(bpNode, node.claimed && bpNodeClaimed, node.current && bpNodeCurrent)}
      style={{ color: RARITY_COLOR[node.rarity] }}
      role="button"
      tabIndex={0}
    >
      <div className={cn(bpNodeLv, node.current && bpNodeLvCurrent)}>LV {node.lv}</div>
      <div className={bpNodeIcon}>{node.icon}</div>
      <div className={bpNodeName}>{node.reward}</div>
    </div>
  );
}

const bpNode =
  'shrink-0 w-[110px] bg-[var(--panel2)] border-[1.5px] border-[var(--border)] rounded-[10px] px-2 py-3 text-center cursor-pointer transition-all duration-200 relative hover:-translate-y-[3px] hover:border-[var(--gold)]';
const bpNodeClaimed =
  'bg-[linear-gradient(180deg,oklch(0.4_0.15_145_/_0.15),var(--panel2))] border-[oklch(0.6_0.18_145_/_0.4)] after:content-[\"✓\"] after:absolute after:top-[6px] after:right-[6px] after:w-[18px] after:h-[18px] after:rounded-full after:bg-[oklch(0.6_0.18_145)] after:text-white after:text-[10px] after:flex after:items-center after:justify-center after:font-bold';
const bpNodeCurrent =
  'bg-[linear-gradient(180deg,oklch(0.5_0.18_85_/_0.2),var(--panel2))] border-[var(--gold)] shadow-[0_0_24px_var(--gold-glow)] -translate-y-1 scale-[1.05] z-[2] before:content-[\"YOU\"] before:absolute before:top-[-10px] before:left-1/2 before:-translate-x-1/2 before:font-[var(--font-title)] before:text-[9px] before:tracking-[0.15em] before:bg-[var(--gold)] before:text-[#0a0400] before:px-2 before:py-0.5 before:rounded-[4px] before:font-bold';
const bpNodeLv =
  'font-[var(--font-title)] text-[10px] tracking-[0.15em] text-[var(--text-mid)] mb-1.5';
const bpNodeLvCurrent = 'text-[var(--gold)]';
const bpNodeIcon =
  'w-[50px] h-[50px] mx-auto mb-1.5 rounded-[12px] flex items-center justify-center text-[26px] bg-[var(--panel3)] border border-[currentColor]';
const bpNodeName =
  'text-[10px] font-semibold text-[var(--text-hi)] whitespace-nowrap overflow-hidden text-ellipsis';
