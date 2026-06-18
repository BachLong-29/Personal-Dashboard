'use client';

import { Input } from '@/components/ui';
import { cn } from '@/libs/utils';
import type { ProfileFormData } from '@/types/profile';
import { AvatarUpload } from '../AvatarUpload';

interface Props {
  form: ProfileFormData;
  onChange: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
}

function FieldCounter({ current, max }: { current: number; max: number }) {
  return (
    <div className="text-right [font-family:var(--f-mono)] text-[9px] tracking-[0.16em] text-text-lo">
      {current} / {max}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  max,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max?: number;
  rows?: number;
}) {
  const textareaCls = cn(
    'w-full rounded-md border border-border bg-bg-2 px-4 py-[10px]',
    '[font-family:var(--f-title)] italic text-[16px] text-text-hi',
    'placeholder:text-text-dim resize-y',
    'transition-all duration-[180ms]',
    'hover:border-border-hi hover:bg-bg-3',
    'focus:border-gold focus:bg-bg-2 focus:outline-none',
    'focus:shadow-[0_0_0_3px_oklch(0.78_0.16_82/0.15),0_0_24px_var(--gold-glow)]',
  );
  return (
    <div className="flex flex-col gap-1.5">
      <label className="[font-family:var(--f-mono)] text-[10px] tracking-[0.2em] uppercase text-text-md">
        {label}
      </label>
      <textarea
        className={textareaCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={max}
      />
      {max && <FieldCounter current={value.length} max={max} />}
    </div>
  );
}

export function IdentitySection({ form, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <AvatarUpload />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Input
            label="Hero name"
            value={form.heroName}
            onChange={(e) => onChange('heroName', e.target.value)}
            placeholder="Wayfarer Ines"
            maxLength={40}
            className="[font-family:var(--f-title)] italic text-[16px]"
          />
          <FieldCounter current={form.heroName.length} max={40} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Cartographer of the Fourth Light"
            maxLength={60}
            className="[font-family:var(--f-title)] italic text-[16px]"
          />
          <FieldCounter current={form.title.length} max={60} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Input
            label="Handle"
            value={form.handle}
            onChange={(e) => onChange('handle', e.target.value)}
            placeholder="@ines.atlas"
            maxLength={24}
            className="font-mono text-[13px]"
          />
          <FieldCounter current={form.handle.length} max={24} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Input
            label="Pronouns"
            value={form.pronouns}
            onChange={(e) => onChange('pronouns', e.target.value)}
            placeholder="she / they"
            maxLength={24}
            className="[font-family:var(--f-title)] italic"
          />
          <FieldCounter current={form.pronouns.length} max={24} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Input
            label="Region"
            value={form.region}
            onChange={(e) => onChange('region', e.target.value)}
            placeholder="Hollow Tide · East"
            maxLength={40}
          />
          <FieldCounter current={form.region.length} max={40} />
        </div>
      </div>

      <div className="grid grid-cols-[80px_1fr] gap-4">
        <div className="flex flex-col gap-1.5">
          <Input
            label="Sigil"
            value={form.sigil}
            onChange={(e) => onChange('sigil', e.target.value.slice(0, 1))}
            placeholder="✦"
            maxLength={1}
            className="text-center font-mono text-[20px]"
          />
        </div>
        <TextareaField
          label="Motto"
          value={form.motto}
          onChange={(v) => onChange('motto', v)}
          placeholder="A line you can return to."
          max={120}
          rows={2}
        />
      </div>
    </div>
  );
}
