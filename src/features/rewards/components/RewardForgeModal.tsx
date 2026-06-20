'use client';

import { useState } from 'react';

import { cn } from '@/libs/utils';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import type { CreateRewardPayload, RewardColor, RewardRarity, RewardStatus } from '@/types/reward';
import { RARITIES, STATUSES, REWARD_COLORS, COLOR_VALUES } from '../constants';
import { useCreateReward } from '../hooks/useCreateReward';

interface RewardForgeModalProps {
  onClose: () => void;
  onCreated: (id: string) => void;
}

const DEFAULT: CreateRewardPayload = {
  name: '',
  icon: '◆',
  color: 'gold',
  rarity: 'common',
  status: 'active',
};

export function RewardForgeModal({ onClose, onCreated }: RewardForgeModalProps) {
  const [form, setForm] = useState<CreateRewardPayload>(DEFAULT);
  const [error, setError] = useState('');

  const { mutate: create, isPending } = useCreateReward();

  const setF = <K extends keyof CreateRewardPayload>(k: K, v: CreateRewardPayload[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setError('');
    create(form, {
      onSuccess: (r) => {
        if (r) onCreated(r.id);
        else onClose();
      },
      onError: () => setError('Something went wrong. Please try again.'),
    });
  }

  return (
    <Modal open onClose={onClose} maxWidth="480px" scrollable closeButton>
      <ModalHead tag="Forge" title="✦ Forge New Reward" />
      <ModalBody scrollable>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Icon + Name row */}
          <div className="flex gap-3">
            <div className="shrink-0">
              <FieldLabel>Icon</FieldLabel>
              <input
                className={cn(inp, 'w-14 text-center text-[20px]')}
                value={form.icon ?? ''}
                maxLength={10}
                onChange={(e) => setF('icon', e.target.value || '◆')}
              />
            </div>
            <div className="flex-1">
              <FieldLabel required>Name</FieldLabel>
              <input
                className={inp}
                placeholder="e.g. Aether Crown"
                value={form.name}
                maxLength={100}
                onChange={(e) => setF('name', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              className={cn(inp, 'resize-none h-[60px] leading-[1.5]')}
              placeholder="Short description…"
              value={form.description ?? ''}
              maxLength={500}
              onChange={(e) => setF('description', e.target.value || undefined)}
            />
          </div>

          {/* Rarity + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Rarity</FieldLabel>
              <div className="flex flex-col gap-1">
                {RARITIES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--r-sm)] border text-[10px] cursor-pointer transition-all',
                      form.rarity === r.id
                        ? 'text-[var(--text-hi)]'
                        : 'border-[var(--border)] text-[var(--text-lo)] hover:border-[var(--border-hi)]',
                    )}
                    style={
                      form.rarity === r.id
                        ? { borderColor: r.color, background: r.bg, color: r.color }
                        : undefined
                    }
                    onClick={() => setF('rarity', r.id as RewardRarity)}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: r.color }}
                    />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Status</FieldLabel>
              <div className="flex flex-col gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--r-sm)] border text-[10px] cursor-pointer transition-all',
                      form.status === s.id
                        ? 'border-[var(--border-hi)] bg-[var(--panel2)]'
                        : 'border-[var(--border)] text-[var(--text-lo)] hover:border-[var(--border-hi)]',
                    )}
                    onClick={() => setF('status', s.id as RewardStatus)}
                  >
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <span style={{ color: form.status === s.id ? s.color : undefined }}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <FieldLabel>Accent Color</FieldLabel>
            <div className="flex gap-2.5 flex-wrap">
              {REWARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-all hover:scale-110',
                    form.color === c ? 'scale-110 shadow-[0_0_8px_var(--c)]' : 'border-transparent',
                  )}
                  style={{
                    background: COLOR_VALUES[c],
                    borderColor: form.color === c ? 'white' : undefined,
                    ['--c' as string]: COLOR_VALUES[c],
                  }}
                  onClick={() => setF('color', c as RewardColor)}
                />
              ))}
            </div>
          </div>

          {/* Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Coin Cost</FieldLabel>
              <div className="flex items-center gap-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2.5 py-1.5">
                <span className="text-[var(--gold)] text-[12px]">●</span>
                <input
                  type="number"
                  min={0}
                  className="flex-1 bg-transparent outline-none text-[12px] text-[var(--text-hi)] placeholder:text-[var(--text-dim)] min-w-0"
                  placeholder="0"
                  value={form.coinCost ?? ''}
                  onChange={(e) =>
                    setF('coinCost', e.target.value === '' ? undefined : Number(e.target.value))
                  }
                />
              </div>
            </div>
            <div>
              <FieldLabel>Gem Cost</FieldLabel>
              <div className="flex items-center gap-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2.5 py-1.5">
                <span className="text-[var(--violet)] text-[12px]">◆</span>
                <input
                  type="number"
                  min={0}
                  className="flex-1 bg-transparent outline-none text-[12px] text-[var(--text-hi)] placeholder:text-[var(--text-dim)] min-w-0"
                  placeholder="0"
                  value={form.gemCost ?? ''}
                  onChange={(e) =>
                    setF('gemCost', e.target.value === '' ? undefined : Number(e.target.value))
                  }
                />
              </div>
            </div>
          </div>

          {/* Unlock + Stock */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Min Level</FieldLabel>
              <input
                type="number"
                min={1}
                className={inp}
                placeholder="None"
                value={form.unlockCondition?.minLevel ?? ''}
                onChange={(e) =>
                  setF('unlockCondition', {
                    ...form.unlockCondition,
                    minLevel: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <FieldLabel>Min Rank</FieldLabel>
              <input
                className={inp}
                placeholder="None"
                value={form.unlockCondition?.minRank ?? ''}
                onChange={(e) =>
                  setF('unlockCondition', {
                    ...form.unlockCondition,
                    minRank: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div>
              <FieldLabel hint="blank = ∞">Stock</FieldLabel>
              <input
                type="number"
                min={0}
                className={inp}
                placeholder="∞"
                value={form.stock ?? ''}
                onChange={(e) =>
                  setF('stock', e.target.value === '' ? undefined : Number(e.target.value))
                }
              />
            </div>
          </div>

          {error && (
            <div className="text-[11px] text-[var(--rose)] bg-[oklch(0.72_0.18_5_/_0.1)] border border-[oklch(0.72_0.18_5_/_0.3)] rounded-[var(--r-sm)] px-3 py-2">
              ⚠ {error}
            </div>
          )}
        </form>
      </ModalBody>
      <ModalFoot>
        <button
          type="button"
          className="flex-1 py-2 rounded-[var(--r-sm)] border border-[var(--border)] text-[11px] font-bold text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.08em] cursor-pointer transition-all hover:border-[var(--border-hi)] hover:text-[var(--text-hi)]"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className={cn(
            'flex-[2] py-2 rounded-[var(--r-sm)] text-[11px] font-bold font-[var(--font-title)] tracking-[0.1em] cursor-pointer transition-all text-[#0a0400]',
            'bg-[linear-gradient(135deg,oklch(0.68_0.14_82),oklch(0.78_0.16_82))] shadow-[0_0_12px_oklch(0.74_0.17_85_/_0.35)]',
            'hover:shadow-[0_0_20px_oklch(0.74_0.17_85_/_0.5)]',
            isPending && 'opacity-60 pointer-events-none',
          )}
          onClick={handleSubmit}
        >
          {isPending ? '⏳ Forging…' : '✦ Forge Reward'}
        </button>
      </ModalFoot>
    </Modal>
  );
}

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-1 mb-1.5">
      <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-[var(--text-lo)] font-[var(--font-title)]">
        {children}
      </span>
      {required && <span className="text-[var(--rose)] text-[10px]">*</span>}
      {hint && (
        <span className="ml-auto text-[9px] text-[var(--text-dim)] font-[var(--font-mono)]">
          {hint}
        </span>
      )}
    </div>
  );
}

const inp =
  'w-full bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-[12px] text-[var(--text-hi)] outline-none focus:border-[var(--gold)] focus:shadow-[0_0_0_2px_oklch(0.74_0.17_85_/_0.15)] transition-all placeholder:text-[var(--text-dim)]';
