'use client';

import { useRef, useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

import { Icon } from '@/components/common/Icon';
import { isUploadedIcon } from '@/components/common/icon-registry';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { useCategories } from '@/features/dashboard/hooks/useCategories';
import { COLOR_CSS, COLOR_OPTIONS } from '@/features/projects/constants';
import { apiClient } from '@/libs/axios';
import { cn } from '@/libs/utils';
import type { ApiResponse, EventDTO, EventFrequency, TaskColor } from '@/types';
import type { HabitDay } from '@/types/habit';

import {
  DAY_ORDER,
  DEFAULT_EVENT_ICON,
  ICON_UPLOAD_MAX_BYTES,
  ICON_UPLOAD_TYPES,
  WEEKDAYS,
} from '../constants';
import { useCreateEvent, useUpdateEvent } from '../hooks/useEvents';

/** `startDate` travels as a plain "YYYY-MM-DD" string, so convert at the edges. */
function toDateString(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

type FormErrors = Partial<Record<'title' | 'tagId' | 'startDate' | 'time' | 'days', string>>;

interface Props {
  open: boolean;
  onClose: () => void;
  /** When set the modal edits this rule instead of creating one. */
  event?: EventDTO | null;
}

export function EventFormModal({ open, onClose, event }: Props) {
  const isEdit = Boolean(event);
  const { data: categories = [] } = useCategories();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const saving = createEvent.isPending || updateEvent.isPending;

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [tagId, setTagId] = useState('');
  const [color, setColor] = useState<TaskColor>('violet');
  const [icon, setIcon] = useState(DEFAULT_EVENT_ICON);
  const [showPicker, setShowPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [repeats, setRepeats] = useState(false);
  const [freq, setFreq] = useState<EventFrequency>('weekly');
  const [days, setDays] = useState<HabitDay[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [interval, setIntervalValue] = useState('1');
  const [busy, setBusy] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveFailed, setSaveFailed] = useState(false);

  // Reload the draft whenever the modal opens — no effect needed, this runs
  // during render only on the open/close edge.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(event?.title ?? '');
      setNote(event?.note ?? '');
      setTagId(event?.tagId ?? '');
      setColor(event?.color ?? 'violet');
      setIcon(event?.icon ?? DEFAULT_EVENT_ICON);
      setShowPicker(false);
      setUploadError(null);
      setAllDay(event?.allDay ?? false);
      setStartTime(event?.startTime ?? '09:00');
      setDuration(event?.duration ? String(event.duration) : '60');
      setStartDate(event?.startDate ?? toDateString(new Date()));
      setEndDate(event?.endDate ?? '');
      setRepeats(Boolean(event?.recurrence));
      setFreq(event?.recurrence?.freq ?? 'weekly');
      setDays(event?.recurrence?.days ?? []);
      setDayOfMonth(String(event?.recurrence?.dayOfMonth ?? 1));
      setIntervalValue(String(event?.recurrence?.interval ?? 1));
      setBusy(event?.busy ?? true);
      setErrors({});
      setSaveFailed(false);
    }
  }

  // Same limits the upload route enforces — fail here rather than round-trip.
  async function handleIconFile(file: File) {
    if (!ICON_UPLOAD_TYPES.includes(file.type)) {
      setUploadError('Use a JPG, PNG, WebP or GIF.');
      return;
    }
    if (file.size > ICON_UPLOAD_MAX_BYTES) {
      setUploadError('Image must be under 5 MB.');
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post<ApiResponse<{ url: string }>>(
        '/upload/attachment',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setIcon(data.data.url);
      setShowPicker(false);
    } catch {
      setUploadError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  function toggleDay(day: HabitDay) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
    clearError('days');
  }

  /** Mirrors the zod schema in src/app/api/v1/events/route.ts — keep in sync. */
  function validate(): FormErrors {
    const found: FormErrors = {};
    if (!title.trim()) found.title = 'Title is required';
    if (!tagId) found.tagId = 'Category is required';
    if (!startDate) found.startDate = 'Start date is required';
    if (!allDay && (!startTime || !Number(duration))) found.time = 'Time and length are required';
    if (repeats && freq === 'weekly' && days.length === 0) found.days = 'Pick at least one day';
    return found;
  }

  async function handleSave() {
    const found = validate();
    setErrors(found);
    setSaveFailed(false);
    if (Object.values(found).some(Boolean)) return;

    const recurrence = repeats
      ? {
          freq,
          interval: Math.max(1, Number(interval) || 1),
          ...(freq === 'weekly'
            ? { days: DAY_ORDER.filter((d) => days.includes(d)) }
            : { dayOfMonth: Math.min(31, Math.max(1, Number(dayOfMonth) || 1)) }),
        }
      : undefined;

    const shared = {
      title: title.trim(),
      tagId,
      color,
      icon,
      allDay,
      startTime: allDay ? undefined : startTime,
      duration: allDay ? undefined : Number(duration),
      startDate,
      busy,
    };

    try {
      if (isEdit && event) {
        await updateEvent.mutateAsync({
          id: event.id,
          ...shared,
          note: note.trim() || null,
          startTime: allDay ? null : startTime,
          duration: allDay ? null : Number(duration),
          endDate: recurrence && endDate ? endDate : null,
          recurrence: recurrence ?? null,
        });
      } else {
        await createEvent.mutateAsync({
          ...shared,
          note: note.trim() || undefined,
          endDate: recurrence && endDate ? endDate : undefined,
          recurrence,
        });
      }
      onClose();
    } catch {
      // Keep the draft on screen — closing here would throw the form away.
      setSaveFailed(true);
    }
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Modal open={open} onClose={onClose} maxWidth="480px" scrollable>
      <ModalHead tag="SCHEDULE" title={isEdit ? '📅 Edit Event' : '📅 New Event'} />
      <ModalBody scrollable className="flex flex-col gap-4">
        <Field label="Icon">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              disabled={saving || uploading}
              aria-expanded={showPicker}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-[var(--r-sm)] border text-[22px] transition-all',
                showPicker
                  ? 'border-[var(--gold)] shadow-[0_0_10px_oklch(0.74_0.17_85_/_0.3)]'
                  : 'border-[var(--border)] hover:border-[var(--border-hi)]',
              )}
            >
              <Icon icon={icon} />
            </button>
            <Button
              size="sm"
              variant="ghost"
              disabled={saving || uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? '…' : 'Upload image'}
            </Button>
            {isUploadedIcon(icon) && (
              <Button
                size="sm"
                variant="ghost"
                disabled={saving || uploading}
                onClick={() => setIcon(DEFAULT_EVENT_ICON)}
              >
                Reset
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={ICON_UPLOAD_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                // Reset so picking the same file twice still fires a change.
                e.target.value = '';
                if (file) handleIconFile(file);
              }}
            />
          </div>
          {uploadError && (
            <p role="alert" className="text-[10px] text-[var(--rose)]">
              {uploadError}
            </p>
          )}
          {showPicker && (
            <div className="relative z-50 mt-1">
              <Picker
                data={data}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
                perLine={9}
                onEmojiSelect={(emoji: { native: string }) => {
                  setIcon(emoji.native);
                  setShowPicker(false);
                }}
              />
            </div>
          )}
        </Field>

        <Field label="Title" required error={errors.title}>
          <Input
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError('title');
            }}
            placeholder="e.g. Team standup"
            disabled={saving}
          />
        </Field>

        <Field label="Note">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything worth remembering…"
            disabled={saving}
          />
        </Field>

        <Field label="Category" required error={errors.tagId}>
          <Select
            options={categoryOptions}
            value={tagId}
            onValueChange={(v) => {
              setTagId(v);
              clearError('tagId');
            }}
            placeholder="Pick a category"
            disabled={saving}
          />
        </Field>

        {/* Seven swatches need the full width — halved they wrap onto two rows. */}
        <Field label="Colour">
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-label={opt.label}
                aria-pressed={color === opt.value}
                onClick={() => setColor(opt.value)}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-transform',
                  color === opt.value
                    ? 'scale-110 border-[var(--text-hi)]'
                    : 'border-transparent hover:scale-105',
                )}
                style={{ background: COLOR_CSS[opt.value] }}
              />
            ))}
          </div>
        </Field>

        <Field label={repeats ? 'Starts on' : 'Date'} required error={errors.startDate}>
          <DatePicker
            value={startDate ? parseDateString(startDate) : null}
            onChange={(d) => {
              setStartDate(toDateString(d));
              clearError('startDate');
            }}
            disabled={saving}
          />
        </Field>

        <Switch checked={allDay} onChange={setAllDay} disabled={saving}>
          All day
        </Switch>

        {!allDay && (
          <Field label="Time" error={errors.time}>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  clearError('time');
                }}
                disabled={saving}
              />
              <Input
                type="number"
                min={1}
                max={1440}
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  clearError('time');
                }}
                placeholder="Minutes"
                disabled={saving}
              />
            </div>
          </Field>
        )}

        <Switch checked={repeats} onChange={setRepeats} disabled={saving}>
          Repeats
        </Switch>

        {repeats && (
          <div className="flex flex-col gap-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg-2)] p-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Frequency">
                <Select
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                  value={freq}
                  onValueChange={(v) => setFreq(v as EventFrequency)}
                  disabled={saving}
                />
              </Field>
              <Field label={freq === 'weekly' ? 'Every N weeks' : 'Every N months'}>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={interval}
                  onChange={(e) => setIntervalValue(e.target.value)}
                  disabled={saving}
                />
              </Field>
            </div>

            {freq === 'weekly' ? (
              <Field label="On days" required error={errors.days}>
                <div className="flex gap-1">
                  {WEEKDAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      aria-label={d.value}
                      aria-pressed={days.includes(d.value)}
                      onClick={() => toggleDay(d.value)}
                      disabled={saving}
                      className={cn(
                        'flex-1 rounded-[var(--r-sm)] border py-1.5 text-[11px] font-bold transition-colors',
                        days.includes(d.value)
                          ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.15)] text-[var(--gold)]'
                          : 'border-[var(--border)] text-[var(--text-lo)] hover:text-[var(--text-mid)]',
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </Field>
            ) : (
              <Field label="Day of month">
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  disabled={saving}
                />
                <p className="mt-1 text-[10px] text-[var(--text-lo)]">
                  A day past the end of a month lands on its last day.
                </p>
              </Field>
            )}

            <Field label="Ends on">
              <DatePicker
                value={endDate ? parseDateString(endDate) : null}
                onChange={(d) => setEndDate(toDateString(d))}
                onClear={() => setEndDate('')}
                placeholder="Never"
                disabled={saving}
              />
            </Field>
          </div>
        )}

        <Switch checked={busy} onChange={setBusy} disabled={saving}>
          Takes up my time
        </Switch>
        <p className="-mt-2 text-[10px] text-[var(--text-lo)]">
          Off keeps it on the calendar without spending the day&apos;s capacity.
        </p>

        {saveFailed && (
          <p role="alert" className="text-[11px] text-[var(--rose)]">
            ✕ Could not save the event. Try again.
          </p>
        )}
      </ModalBody>
      <ModalFoot>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? '…' : isEdit ? 'Save Changes' : 'Create Event'}
        </Button>
      </ModalFoot>
    </Modal>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-mid)] [font-family:var(--f-title)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--rose)]">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-[10px] leading-tight text-[var(--rose)]">
          {error}
        </p>
      )}
    </div>
  );
}
