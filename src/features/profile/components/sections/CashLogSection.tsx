'use client';

import { Switch } from '@/components/ui';
import { useFinanceCategories } from '@/features/finance/hooks/useFinanceCategories';
import { cn } from '@/libs/utils';
import type { ProfileFormData } from '@/types/profile';

import { PrefRow } from './PrefRow';

interface Props {
  form: ProfileFormData;
  onChange: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
}

/** What this device thinks the zone is — offered, never imposed. */
function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * The end-of-day nudge to write down cash spending.
 *
 * Bank spending arrives on its own through the SePay webhook; cash only exists
 * once someone types it in, which is what this is here to remember.
 */
export function CashLogSection({ form, onChange }: Props) {
  const { data: categories = [] } = useFinanceCategories('expense');
  const detected = deviceTimeZone();

  const toggleCategory = (id: string) => {
    const next = form.cashLogCategoryIds.includes(id)
      ? form.cashLogCategoryIds.filter((c) => c !== id)
      : [...form.cashLogCategoryIds, id];
    onChange('cashLogCategoryIds', next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PrefRow label="Remind me to log cash" hint="A nudge in the bell at the end of the day.">
          <Switch checked={form.cashLogEnabled} onChange={(on) => onChange('cashLogEnabled', on)} />
        </PrefRow>

        <PrefRow label="Remind at" hint="Your local time, from the zone below.">
          <input
            type="time"
            value={form.cashLogTime}
            onChange={(e) => onChange('cashLogTime', e.target.value)}
            className={timeInput}
            aria-label="Reminder time"
          />
        </PrefRow>

        {/* The reminder hour is meaningless without this, and the field has sat
            at its 'UTC' default since it was added — nothing ever read it
            before. Offering the device's zone is the difference between a
            22:00 reminder and a 05:00 one. */}
        <PrefRow label="Time zone" hint="What “22:00” means for you.">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={form.timezone}
              onChange={(e) => onChange('timezone', e.target.value)}
              className={cn(timeInput, 'w-[190px]')}
              aria-label="Time zone"
            />
            {form.timezone !== detected && (
              <button
                type="button"
                onClick={() => onChange('timezone', detected)}
                className={useBtn}
              >
                Use {detected}
              </button>
            )}
          </div>
        </PrefRow>
      </div>

      <div>
        <div className="[font-family:var(--f-mono)] mb-3 text-[9px] tracking-[0.16em] text-text-lo uppercase">
          Chase these categories · {form.cashLogCategoryIds.length} selected
        </div>

        {categories.length === 0 ? (
          <p className="text-[12px] text-text-lo">No expense categories yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => {
              const active = form.cashLogCategoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCategory(c.id)}
                  className={cn(tile, active ? tileActive : tileIdle)}
                >
                  <span className="text-[16px] leading-none">{c.icon}</span>
                  <span className="truncate [font-family:var(--f-title)] text-[13px] italic">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-text-lo">
          Only categories with no cash spending recorded that day are listed in the reminder — a day
          you already wrote everything down stays quiet.
        </p>
      </div>
    </div>
  );
}

const timeInput = cn(
  'rounded-xs border border-border bg-bg-2 px-3 py-2 text-[13px] text-text-hi',
  'focus:border-gold focus:outline-none',
);

const useBtn = cn(
  '[font-family:var(--f-mono)] shrink-0 rounded-xs border border-border px-2 py-1.5',
  'text-[9px] tracking-[0.1em] text-text-md uppercase transition-colors hover:border-gold hover:text-gold',
);

const tile = cn(
  'flex items-center gap-2 rounded-xs border p-3 text-left',
  'transition-all duration-[200ms] hover:-translate-y-[1px]',
);
const tileActive = 'border-gold bg-bg-3 text-text-hi shadow-[0_0_0_1px_var(--gold)]';
const tileIdle = 'border-border bg-bg-1 text-text-md hover:border-gold';
