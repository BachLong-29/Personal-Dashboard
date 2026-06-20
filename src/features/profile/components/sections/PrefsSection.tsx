'use client';

import type { ReactNode } from 'react';
import { Switch } from '@/components/ui';
import type { ProfileFormData, QuestDifficulty } from '@/types/profile';

interface Props {
  form: ProfileFormData;
  onChange: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
}

function PrefRow({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-8 py-4 border-b border-border-lo last:border-b-0">
      <div>
        <div className="[font-family:var(--f-title)] italic text-[15px] text-text-hi">{label}</div>
        <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.14em] uppercase text-text-lo mt-[3px]">
          {hint}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-[3px] bg-bg-2 border border-border rounded-xs p-[2px]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 bg-transparent border-none text-text-md hover:text-gold [font-family:var(--f-title)] text-[16px] cursor-pointer transition-colors"
      >
        −
      </button>
      <span className="w-7 text-center [font-family:var(--f-title)] italic text-[16px] text-text-hi">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 bg-transparent border-none text-text-md hover:text-gold [font-family:var(--f-title)] text-[16px] cursor-pointer transition-colors"
      >
        +
      </button>
    </div>
  );
}

const DIFFICULTIES: { id: QuestDifficulty; label: string }[] = [
  { id: 'gentle', label: 'Gentle' },
  { id: 'rising', label: 'Rising' },
  { id: 'harsh', label: 'Harsh' },
];

function SegRadio({
  value,
  onChange,
}: {
  value: QuestDifficulty;
  onChange: (v: QuestDifficulty) => void;
}) {
  return (
    <div className="flex bg-bg-2 border border-border rounded-xs p-[2px] gap-[2px]">
      {DIFFICULTIES.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={
            value === o.id
              ? 'px-3 py-[5px] rounded-xs bg-gold text-[oklch(15%_0.03_270)] [font-family:var(--f-body)] text-[11px] font-semibold tracking-[0.04em] cursor-pointer border-none'
              : 'px-3 py-[5px] rounded-xs bg-transparent text-text-md [font-family:var(--f-body)] text-[11px] tracking-[0.04em] cursor-pointer border-none hover:text-text-hi transition-colors'
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PrefsSection({ form, onChange }: Props) {
  return (
    <div>
      <PrefRow label="Morning ritual prompt" hint="A small quest waits when you arrive at dawn.">
        <Switch checked={form.morningRitual} onChange={(v) => onChange('morningRitual', v)} />
      </PrefRow>
      <PrefRow label="Nightly review" hint="A pinned reflection at the end of every day.">
        <Switch checked={form.nightlyReview} onChange={(v) => onChange('nightlyReview', v)} />
      </PrefRow>
      <PrefRow label="Streak protection" hint="Free skips per week before the streak breaks.">
        <Stepper
          value={form.streakProtection}
          onChange={(v) => onChange('streakProtection', v)}
          min={0}
          max={3}
        />
      </PrefRow>
      <PrefRow label="Quest difficulty" hint="How fast new quests scale with your level.">
        <SegRadio value={form.questDifficulty} onChange={(v) => onChange('questDifficulty', v)} />
      </PrefRow>
      <PrefRow label="Seasonal rites" hint="Ceremonial side-quests at the start of each season.">
        <Switch checked={form.seasonalRites} onChange={(v) => onChange('seasonalRites', v)} />
      </PrefRow>
      <PrefRow
        label="Auto-reclaim stalled quests"
        hint="Move 90+ day quests into Ruins without prompting."
      >
        <Switch checked={form.autoReclaim} onChange={(v) => onChange('autoReclaim', v)} />
      </PrefRow>
      <PrefRow
        label="Daily working hours"
        hint="How many hours you plan to work each day (used for capacity planning)."
      >
        <div className="flex items-center gap-2">
          <Stepper
            value={Math.round(form.dailyCapacityMinutes / 60)}
            onChange={(h) => onChange('dailyCapacityMinutes', Math.min(1440, Math.max(60, h * 60)))}
            min={1}
            max={24}
          />
          <span className="[font-family:var(--f-mono)] text-[10px] tracking-[0.12em] uppercase text-text-lo">
            h / day
          </span>
        </div>
      </PrefRow>
    </div>
  );
}
