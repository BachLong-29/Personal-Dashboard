'use client';

import { cn } from '@/libs/utils';
import type { Reward } from '@/types/reward';
import type { UpdateRewardPayload, RewardRarity, RewardStatus, RewardColor } from '@/types/reward';
import {
  RARITIES,
  STATUSES,
  REWARD_COLORS,
  COLOR_VALUES,
  RARITY_META,
  STATUS_META,
} from '../constants';

type InspMode = 'edit' | 'preview';

interface RewardInspectorProps {
  reward: Reward | null;
  draft: Reward | null;
  setDraft: (fn: (prev: Reward) => Reward) => void;
  mode: InspMode;
  setMode: (m: InspMode) => void;
  dirty: boolean;
  publishing: boolean;
  onPublish: () => void;
  onDiscard: () => void;
  /** Mobile only — the inspector renders full-screen there, so it needs its own way back. */
  onClose?: () => void;
}

export function RewardInspector({
  reward,
  draft,
  setDraft,
  mode,
  setMode,
  dirty,
  publishing,
  onPublish,
  onDiscard,
  onClose,
}: RewardInspectorProps) {
  if (!draft || !reward) {
    return (
      <aside className={inspBase}>
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-[var(--text-lo)]">
          <div className="text-[28px] opacity-30">◆</div>
          <div className="font-[var(--font-title)] text-[11px] tracking-[0.14em]">
            SELECT A REWARD
          </div>
        </div>
      </aside>
    );
  }

  const rar = RARITY_META[draft.rarity];
  const setF = <K extends keyof UpdateRewardPayload>(k: K, v: UpdateRewardPayload[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <aside
      className={inspBase}
      style={{ ['--rar-color' as string]: rar.color, ['--rar-glow' as string]: rar.glow }}
    >
      {/* Header */}
      <div className={inspHead}>
        {onClose && (
          <button
            type="button"
            className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] text-[12px] text-[var(--text-lo)] transition-all hover:border-[var(--border-hi)] hover:text-[var(--text-hi)] lg:hidden"
            onClick={onClose}
            aria-label="Back to list"
          >
            ‹
          </button>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--text-lo)] font-[var(--font-title)]">
            Forge Editor
          </div>
          <div className="text-[9px] text-[var(--text-dim)] font-[var(--font-mono)] truncate">
            {draft.id}
          </div>
        </div>
        <div className={modeToggle}>
          <button
            type="button"
            className={cn(modeBtn, mode === 'edit' && modeBtnActive)}
            onClick={() => setMode('edit')}
          >
            Edit
          </button>
          <button
            type="button"
            className={cn(modeBtn, mode === 'preview' && modeBtnActive)}
            onClick={() => setMode('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Live preview card */}
      <div
        className={previewWrap}
        style={{
          borderColor: `${rar.color}55`,
          background: `radial-gradient(ellipse 120% 80% at 50% 0%, ${rar.bg} 0%, transparent 70%)`,
        }}
      >
        <div className="text-[8px] font-bold tracking-[0.18em] uppercase text-[var(--text-lo)] font-[var(--font-title)] mb-1.5">
          PREVIEW · LIVE
        </div>
        <span
          className="text-[9px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded border font-[var(--font-title)] mb-2"
          style={{ color: rar.color, borderColor: `${rar.color}55`, background: rar.bg }}
        >
          {rar.label}
        </span>
        <div className="text-[42px] leading-none my-2 drop-shadow-lg">{draft.icon ?? '◆'}</div>
        <div className="font-[var(--font-title)] text-[14px] font-bold text-[var(--text-hi)] tracking-[0.04em] text-center truncate px-4">
          {draft.name || '—'}
        </div>
        <div className="text-[9px] text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.1em] mt-0.5">
          {rar.label} · Tier {rar.tier}
        </div>
      </div>

      {/* Scrollable form / preview */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'edit' ? (
          <div className={form}>
            {/* Name */}
            <Field label="Name" required hint={`${(draft.name ?? '').length}/100`}>
              <input
                className={input}
                value={draft.name}
                maxLength={100}
                onChange={(e) => setF('name', e.target.value)}
              />
            </Field>

            {/* Icon */}
            <Field label="Icon" hint="emoji">
              <input
                className={cn(input, 'text-[20px]')}
                value={draft.icon ?? ''}
                maxLength={10}
                onChange={(e) => setF('icon', e.target.value || null)}
                placeholder="◆"
              />
            </Field>

            {/* Description */}
            <Field label="Description">
              <textarea
                className={cn(input, 'resize-none h-[54px] leading-[1.5]')}
                value={draft.description ?? ''}
                maxLength={500}
                onChange={(e) => setF('description', e.target.value || null)}
              />
            </Field>

            {/* Rarity */}
            <Field label="Rarity" required>
              <div className="flex flex-wrap gap-1.5">
                {RARITIES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={cn(
                      rarPickBtn,
                      draft.rarity === r.id &&
                        'border-[var(--rar-pick-c)] !text-[var(--rar-pick-c)] bg-[var(--rar-pick-bg)]',
                    )}
                    style={{
                      ['--rar-pick-c' as string]: r.color,
                      ['--rar-pick-bg' as string]: r.bg,
                    }}
                    onClick={() => setF('rarity', r.id as RewardRarity)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Status */}
            <Field label="Status">
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={cn(
                      statPickBtn,
                      draft.status === s.id &&
                        'border-[var(--stat-c)] bg-[oklch(from_var(--stat-c)_l_c_h_/_0.1)]',
                    )}
                    style={{ ['--stat-c' as string]: s.color }}
                    onClick={() => setF('status', s.id as RewardStatus)}
                  >
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* Color */}
            <Field label="Accent Color">
              <div className="flex gap-2 flex-wrap">
                {REWARD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                      draft.color === c
                        ? 'scale-110 border-white shadow-[0_0_8px_var(--c)]'
                        : 'border-transparent',
                    )}
                    style={{
                      background: COLOR_VALUES[c],
                      ['--c' as string]: COLOR_VALUES[c],
                    }}
                    onClick={() => setF('color', c as RewardColor)}
                  />
                ))}
              </div>
            </Field>

            {/* Cost */}
            <Field label="Cost">
              <div className="grid grid-cols-2 gap-2">
                <div className={costInput}>
                  <span className="text-[var(--gold)]">●</span>
                  <span className="text-[9px] text-[var(--text-lo)]">Coins</span>
                  <input
                    type="number"
                    className={cn(input, 'flex-1 min-w-0 h-6 px-1 text-[11px]')}
                    min={0}
                    value={draft.coinCost ?? ''}
                    onChange={(e) =>
                      setF('coinCost', e.target.value === '' ? null : Number(e.target.value))
                    }
                    placeholder="—"
                  />
                </div>
                <div className={costInput}>
                  <span className="text-[var(--violet)]">◆</span>
                  <span className="text-[9px] text-[var(--text-lo)]">Gems</span>
                  <input
                    type="number"
                    className={cn(input, 'flex-1 min-w-0 h-6 px-1 text-[11px]')}
                    min={0}
                    value={draft.gemCost ?? ''}
                    onChange={(e) =>
                      setF('gemCost', e.target.value === '' ? null : Number(e.target.value))
                    }
                    placeholder="—"
                  />
                </div>
              </div>
            </Field>

            {/* Unlock condition */}
            <Field label="Unlock Condition">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className={subLabel}>Min Level</div>
                  <input
                    type="number"
                    className={input}
                    min={1}
                    value={draft.unlockCondition?.minLevel ?? ''}
                    onChange={(e) =>
                      setF('unlockCondition', {
                        ...draft.unlockCondition,
                        minLevel: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="None"
                  />
                </div>
                <div>
                  <div className={subLabel}>Min Rank</div>
                  <input
                    className={input}
                    value={draft.unlockCondition?.minRank ?? ''}
                    onChange={(e) =>
                      setF('unlockCondition', {
                        ...draft.unlockCondition,
                        minRank: e.target.value || undefined,
                      })
                    }
                    placeholder="None"
                  />
                </div>
              </div>
            </Field>

            {/* Stock */}
            <Field label="Stock" hint="blank = unlimited">
              <input
                type="number"
                className={input}
                min={0}
                value={draft.stock ?? ''}
                onChange={(e) =>
                  setF('stock', e.target.value === '' ? null : Number(e.target.value))
                }
                placeholder="∞"
              />
            </Field>
          </div>
        ) : (
          /* Preview mode — show full card details */
          <div className={form}>
            <PreviewRow
              label="Rarity"
              value={RARITY_META[draft.rarity].label}
              color={RARITY_META[draft.rarity].color}
            />
            <PreviewRow
              label="Status"
              value={STATUS_META[draft.status].label}
              color={STATUS_META[draft.status].color}
            />
            <PreviewRow
              label="Coins"
              value={draft.coinCost != null ? `● ${draft.coinCost}` : '—'}
              color="var(--gold)"
            />
            <PreviewRow
              label="Gems"
              value={draft.gemCost != null ? `◆ ${draft.gemCost}` : '—'}
              color="var(--violet)"
            />
            <PreviewRow label="Stock" value={draft.stock != null ? String(draft.stock) : '∞'} />
            {draft.unlockCondition?.minLevel && (
              <PreviewRow label="Min Level" value={`Lv. ${draft.unlockCondition.minLevel}`} />
            )}
            {draft.unlockCondition?.minRank && (
              <PreviewRow label="Min Rank" value={draft.unlockCondition.minRank} />
            )}
            {draft.description && (
              <div className="mt-2 px-3 py-2 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)]">
                <div className={subLabel}>Description</div>
                <p className="text-[11px] text-[var(--text-mid)] leading-[1.5] mt-1">
                  {draft.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className={inspFoot}>
        <button type="button" className={footGhost} disabled={!dirty} onClick={onDiscard}>
          Reset
        </button>
        <button
          type="button"
          className={cn(footPrimary, publishing && 'opacity-60 pointer-events-none')}
          onClick={onPublish}
        >
          {publishing ? '⏳ Forging…' : '✦ Forge & Save'}
        </button>
      </div>
    </aside>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--text-lo)] font-[var(--font-title)]">
          {label}
        </span>
        {required && <span className="text-[var(--rose)] text-[10px]">*</span>}
        {hint && (
          <span className="ml-auto text-[9px] text-[var(--text-dim)] font-[var(--font-mono)]">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function PreviewRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] font-[var(--font-title)]">
        {label}
      </span>
      <span
        className="text-[11px] font-semibold font-[var(--font-mono)]"
        style={{ color: color ?? 'var(--text-hi)' }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inspBase =
  'w-full lg:w-[260px] h-full shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--panel)] overflow-hidden';
const inspHead =
  'flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)] shrink-0';

const modeToggle =
  'flex bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] p-0.5';
const modeBtn =
  'px-2.5 py-[3px] rounded-[4px] text-[9px] font-bold tracking-[0.08em] uppercase text-[var(--text-lo)] font-[var(--font-title)] transition-all cursor-pointer';
const modeBtnActive = '!bg-[var(--panel)] !text-[var(--text-hi)] shadow-sm';

const previewWrap =
  'flex flex-col items-center py-4 px-3 border-b border-[var(--border)] bg-[var(--panel2)] shrink-0';

const form = 'px-3 py-3';
const input =
  'w-full bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-[12px] text-[var(--text-hi)] outline-none focus:border-[var(--gold)] focus:shadow-[0_0_0_2px_oklch(0.74_0.17_85_/_0.15)] transition-all placeholder:text-[var(--text-dim)]';
const subLabel =
  'text-[9px] font-bold tracking-[0.14em] uppercase text-[var(--text-dim)] font-[var(--font-title)] mb-1';

const rarPickBtn =
  'px-2 py-1 rounded-[var(--r-sm)] border border-[var(--border)] text-[9px] font-bold tracking-[0.1em] uppercase font-[var(--font-title)] text-[var(--text-lo)] cursor-pointer transition-all hover:border-[var(--rar-pick-c)] hover:text-[var(--rar-pick-c)]';

const statPickBtn =
  'flex items-center gap-1.5 px-2 py-1 rounded-[var(--r-sm)] border border-[var(--border)] text-[9px] font-medium text-[var(--text-lo)] cursor-pointer transition-all hover:border-[var(--stat-c)] hover:text-[var(--text-hi)]';

const costInput =
  'flex items-center gap-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2 py-1';

const inspFoot = 'flex items-center gap-2 px-3 py-2.5 border-t border-[var(--border)] shrink-0';
const footGhost =
  'flex-1 py-[7px] rounded-[var(--r-sm)] border border-[var(--border)] text-[10px] font-bold text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.1em] cursor-pointer transition-all hover:border-[var(--border-hi)] hover:text-[var(--text-hi)] disabled:opacity-30 disabled:pointer-events-none';
const footPrimary =
  'flex-[2] py-[7px] rounded-[var(--r-sm)] text-[10px] font-bold font-[var(--font-title)] tracking-[0.1em] cursor-pointer transition-all text-[#0a0400] shadow-[0_0_12px_var(--rar-glow)]' +
  ' bg-[linear-gradient(135deg,var(--gold-2,oklch(0.68_0.14_82)),var(--gold,oklch(0.78_0.16_82)))]' +
  ' hover:shadow-[0_0_20px_var(--rar-glow)]';
