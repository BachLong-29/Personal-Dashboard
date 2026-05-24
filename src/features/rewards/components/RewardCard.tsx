'use client';

import { cn } from '@/libs/utils';
import type { Reward } from '@/types/reward';
import { RARITY_META, STATUS_META, COLOR_VALUES } from '../constants';

interface RewardCardProps {
  reward: Reward;
  selected?: boolean;
  onSelect: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function RewardCard({ reward, selected, onSelect, onDuplicate, onDelete }: RewardCardProps) {
  const rar = RARITY_META[reward.rarity];
  const stat = STATUS_META[reward.status];
  const accentColor = COLOR_VALUES[reward.color];

  const isLegendary = reward.rarity === 'legendary';
  const isEpic      = reward.rarity === 'epic';

  return (
    <div
      className={cn(cardBase, selected && cardSelected)}
      style={{
        ['--rar-color' as string]: rar.color,
        ['--rar-glow' as string]:  rar.glow,
        ['--accent' as string]:    accentColor,
        borderColor: selected ? rar.color : undefined,
        boxShadow: selected ? `0 0 0 1px ${rar.color}, 0 4px 24px ${rar.glow}` : undefined,
      }}
      onClick={onSelect}
    >
      {/* Legendary corner accents */}
      {(isLegendary || isEpic) && (
        <>
          <span className={cornerTL} style={{ borderColor: rar.color }} />
          <span className={cornerTR} style={{ borderColor: rar.color }} />
          <span className={cornerBL} style={{ borderColor: rar.color }} />
          <span className={cornerBR} style={{ borderColor: rar.color }} />
        </>
      )}

      {/* Rarity tag */}
      <div
        className={rarTag}
        style={{ color: rar.color, borderColor: `${rar.color}55`, background: rar.bg }}
      >
        {rar.label}
      </div>

      {/* Status badge */}
      <div
        className={statBadge}
        style={{ color: stat.color }}
      >
        <span className="text-[8px]">{stat.icon}</span>
        {stat.label}
      </div>

      {/* Art area */}
      <div className={artWrap} style={{ background: `radial-gradient(circle, ${rar.glow} 0%, transparent 70%)` }}>
        <span className={artGlyph}>{reward.icon ?? '◆'}</span>
      </div>

      {/* Body */}
      <div className={bodyWrap}>
        <div className={rewardName}>{reward.name}</div>
        {reward.description && (
          <div className={rewardDesc}>{reward.description}</div>
        )}

        <div className={footRow}>
          {reward.status === 'sold_out' || reward.status === 'inactive' ? (
            <div className={priceLock} style={{ color: 'var(--text-dim)' }}>
              {reward.status === 'sold_out' ? '✕ SOLD OUT' : '○ INACTIVE'}
            </div>
          ) : reward.gemCost ? (
            <div className={priceGems}>
              <span>◆</span> {reward.gemCost}
            </div>
          ) : reward.coinCost ? (
            <div className={priceCoins}>
              <span>●</span> {reward.coinCost}
            </div>
          ) : (
            <div className={priceLock} style={{ color: 'var(--text-dim)' }}>◇ FREE</div>
          )}

          <div className={metaRow}>
            {reward.unlockCondition?.minLevel && (
              <span className={metaChip}>Lv.{reward.unlockCondition.minLevel}</span>
            )}
            {reward.stock != null && (
              <span className={metaChip}>{reward.stock} left</span>
            )}
          </div>
        </div>
      </div>

      {/* Hover actions */}
      <div className={actionsRow}>
        <button type="button" className={actionBtn} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          Edit
        </button>
        {onDuplicate && (
          <button type="button" className={actionBtn} onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            Clone
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className={cn(actionBtn, 'hover:!text-[var(--rose)]')}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardBase =
  'group relative flex flex-col overflow-hidden rounded-[var(--r-md)] bg-[var(--panel2)] border border-[var(--border)] cursor-pointer transition-all duration-200 hover:border-[var(--rar-color)] hover:shadow-[0_2px_20px_var(--rar-glow)]';

const cardSelected =
  'border-[var(--rar-color)]';

const cornerBase =
  'absolute w-2.5 h-2.5 pointer-events-none border-[1.5px]';
const cornerTL = cn(cornerBase, 'top-[5px] left-[5px] border-r-0 border-b-0');
const cornerTR = cn(cornerBase, 'top-[5px] right-[5px] border-l-0 border-b-0');
const cornerBL = cn(cornerBase, 'bottom-[5px] left-[5px] border-r-0 border-t-0');
const cornerBR = cn(cornerBase, 'bottom-[5px] right-[5px] border-l-0 border-t-0');

const rarTag =
  'absolute top-2 left-2 text-[8px] font-bold tracking-[0.12em] uppercase px-1.5 py-0.5 rounded border font-[var(--font-title)]';
const statBadge =
  'absolute top-2 right-2 flex items-center gap-1 text-[8px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)]';

const artWrap =
  'flex items-center justify-center h-[72px] shrink-0 mt-5';
const artGlyph =
  'text-[36px] leading-none drop-shadow-[0_0_12px_var(--rar-glow)] filter';

const bodyWrap  = 'flex-1 flex flex-col gap-1 px-2.5 pb-2';
const rewardName = 'text-[12px] font-bold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.03em] truncate';
const rewardDesc = 'text-[10px] text-[var(--text-lo)] leading-[1.4] line-clamp-2';

const footRow   = 'flex items-center justify-between mt-auto pt-1.5';
const priceGems  = 'flex items-center gap-1 text-[11px] font-bold text-[var(--violet)] font-[var(--font-title)]';
const priceCoins = 'flex items-center gap-1 text-[11px] font-bold text-[var(--gold)] font-[var(--font-title)]';
const priceLock  = 'text-[9px] font-bold tracking-[0.1em] uppercase font-[var(--font-title)]';

const metaRow  = 'flex items-center gap-1 ml-auto';
const metaChip = 'text-[9px] font-[var(--font-mono)] text-[var(--text-lo)] bg-[var(--panel)] border border-[var(--border)] rounded px-1 py-0.5';

const actionsRow =
  'absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[var(--panel2)/90] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 border-t border-[var(--border)]';
const actionBtn =
  'text-[9px] font-bold tracking-[0.08em] uppercase text-[var(--text-lo)] hover:text-[var(--text-hi)] font-[var(--font-title)] px-2 py-0.5 rounded border border-transparent hover:border-[var(--border)] transition-all';
