'use client';

import { cn } from '@/libs/utils';
import type { Reward } from '@/types/reward';
import { RARITY_META, STATUS_META, COLOR_VALUES } from '../constants';

interface RewardTableProps {
  rewards: Reward[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RewardTable({ rewards, selectedId, setSelectedId, onDelete }: RewardTableProps) {
  return (
    <div className="overflow-auto rounded-[var(--r-md)] border border-[var(--border)]">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--panel)]">
            <th className={th}>Item</th>
            <th className={cn(th, 'text-center w-[90px]')}>Rarity</th>
            <th className={th}>Status</th>
            <th className={cn(th, 'text-right w-[80px]')}>Cost</th>
            <th className={cn(th, 'text-right w-[64px]')}>Lv. Req</th>
            <th className={cn(th, 'text-right w-[64px]')}>Stock</th>
            <th className={cn(th, 'text-right w-[100px]')}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rewards.map((r) => {
            const rar  = RARITY_META[r.rarity];
            const stat = STATUS_META[r.status];
            const isSel = r.id === selectedId;

            return (
              <tr
                key={r.id}
                className={cn(
                  'border-b border-[var(--border)] cursor-pointer transition-colors',
                  isSel ? 'bg-[oklch(0.74_0.17_85_/_0.06)]' : 'hover:bg-[var(--panel2)]',
                )}
                onClick={() => setSelectedId(r.id)}
              >
                {/* Name + icon */}
                <td className={td}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-[var(--r-sm)] flex items-center justify-center text-[16px] border shrink-0"
                      style={{
                        borderColor: `${rar.color}55`,
                        background:  rar.bg,
                        color:       COLOR_VALUES[r.color],
                      }}
                    >
                      {r.icon ?? '◆'}
                    </span>
                    <div>
                      <div className="font-semibold text-[var(--text-hi)] truncate max-w-[180px]">{r.name}</div>
                      {r.description && (
                        <div className="text-[9px] text-[var(--text-lo)] truncate max-w-[180px]">{r.description}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Rarity */}
                <td className={cn(td, 'text-center')}>
                  <span
                    className="text-[9px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded border font-[var(--font-title)]"
                    style={{ color: rar.color, borderColor: `${rar.color}55`, background: rar.bg }}
                  >
                    {rar.label}
                  </span>
                </td>

                {/* Status */}
                <td className={td}>
                  <span className="flex items-center gap-1" style={{ color: stat.color }}>
                    <span className="text-[8px]">{stat.icon}</span>
                    <span className="text-[10px]">{stat.label}</span>
                  </span>
                </td>

                {/* Cost */}
                <td className={cn(td, 'text-right font-[var(--font-mono)]')}>
                  {r.gemCost ? (
                    <span className="text-[var(--violet)]">◆ {r.gemCost}</span>
                  ) : r.coinCost ? (
                    <span className="text-[var(--gold)]">● {r.coinCost}</span>
                  ) : (
                    <span className="text-[var(--text-dim)]">—</span>
                  )}
                </td>

                {/* Level req */}
                <td className={cn(td, 'text-right text-[var(--text-lo)] font-[var(--font-mono)]')}>
                  {r.unlockCondition?.minLevel ?? '—'}
                </td>

                {/* Stock */}
                <td className={cn(td, 'text-right text-[var(--text-lo)] font-[var(--font-mono)]')}>
                  {r.stock == null ? '∞' : r.stock}
                </td>

                {/* Actions */}
                <td className={cn(td, 'text-right')}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className={actBtn}
                      title="Edit"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(r.id); }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className={cn(actBtn, 'hover:!text-[var(--rose)]')}
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rewards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-[var(--text-lo)]">
          <div className="text-[32px] opacity-40 mb-2">◇</div>
          <div className="font-[var(--font-title)] text-[12px] tracking-[0.18em] uppercase">No rewards found</div>
          <div className="text-[10px] mt-1">Adjust your filters or forge a new reward.</div>
        </div>
      )}
    </div>
  );
}

const th = 'px-3 py-2.5 text-left text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] font-[var(--font-title)] whitespace-nowrap';
const td = 'px-3 py-2.5 text-[11px] text-[var(--text-mid)]';
const actBtn = 'w-6 h-6 flex items-center justify-center rounded text-[10px] text-[var(--text-lo)] hover:text-[var(--text-hi)] hover:bg-[var(--panel)] border border-transparent hover:border-[var(--border)] transition-all';
