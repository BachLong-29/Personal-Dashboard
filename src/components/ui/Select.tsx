'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: ReactNode;
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  success?: ReactNode;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  labelClassName?: string;
  renderValue?: (option: SelectOption | undefined) => ReactNode;
  renderOption?: (
    option: SelectOption,
    state: { selected: boolean; focused: boolean },
  ) => ReactNode;
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  label,
  helperText,
  error,
  success,
  name,
  id,
  required,
  disabled,
  containerClassName,
  triggerClassName,
  menuClassName,
  optionClassName,
  labelClassName,
  renderValue,
  renderOption,
}: SelectProps) {
  const t = useTranslations('common');
  const reactId = useId();
  const selectId = id ?? reactId;
  const listboxId = `${selectId}-listbox`;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const currentValue = isControlled ? value : internalValue;
  const selectedOption = options.find((option) => option.value === currentValue);
  const enabledOptions = useMemo(() => options.filter((option) => !option.disabled), [options]);

  const [focusedValue, setFocusedValue] = useState<string | undefined>(() =>
    selectedOption?.disabled
      ? enabledOptions[0]?.value
      : (selectedOption?.value ?? enabledOptions[0]?.value),
  );

  const messageId = error
    ? `${selectId}-error`
    : success
      ? `${selectId}-success`
      : helperText
        ? `${selectId}-helper`
        : undefined;

  const state = error ? 'error' : success ? 'success' : 'default';

  // On open, highlight the selected option (or the first enabled one). Render-phase
  // "adjust state on transition" pattern — avoids a setState-in-effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setFocusedValue(
        selectedOption && !selectedOption.disabled
          ? selectedOption.value
          : enabledOptions[0]?.value,
      );
    }
  }

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  // Menu renders in a portal (so it escapes any clipped/overflow-hidden ancestor
  // like GoldPanel) — track the trigger's viewport rect to anchor it there.
  useLayoutEffect(() => {
    if (!open) return;

    const updateRect = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuRect({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    };

    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !focusedValue) return;

    const focusedIndex = options.findIndex((option) => option.value === focusedValue);
    optionRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedValue, open, options]);

  const setValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    setOpen(false);
  };

  const moveFocus = (direction: 1 | -1) => {
    if (enabledOptions.length === 0) return;

    const focusedIndex = enabledOptions.findIndex((option) => option.value === focusedValue);
    const nextIndex =
      focusedIndex === -1
        ? 0
        : (focusedIndex + direction + enabledOptions.length) % enabledOptions.length;

    setFocusedValue(enabledOptions[nextIndex]?.value);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        moveFocus(event.key === 'ArrowDown' ? 1 : -1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (focusedValue) {
          setValue(focusedValue);
        }
        return;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        return;
      default:
        return;
    }
  };

  return (
    <div ref={rootRef} className={cn('flex min-w-0 flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            'flex items-center gap-2 font-title text-t2 uppercase tracking-[0.16em] text-[var(--text-md)]',
            labelClassName,
          )}
        >
          {label}
          {required && <span className="text-[10px] text-[var(--rose)]">*</span>}
        </label>
      )}

      <div className="relative">
        {name && <input type="hidden" name={name} value={currentValue ?? ''} />}

        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          role="combobox"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            'h-[42px] w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-2)] px-4 py-[10px]',
            'flex items-center justify-between gap-3 text-left',
            '[font-family:var(--f-body)] text-[var(--t-3)] text-[var(--text-hi)]',
            'transition-all duration-[180ms] [transition-timing-function:var(--ease-out)]',
            'hover:border-[var(--border-hi)] hover:bg-[var(--bg-3)]',
            'focus:outline-none',
            open &&
              'border-[var(--gold)] bg-[var(--bg-2)] shadow-[var(--sh-3),var(--sh-glow-gold)]',
            disabled && 'cursor-not-allowed opacity-40',
            state === 'error' &&
              'border-[var(--rose)] hover:border-[var(--rose)] shadow-[0_0_0_3px_oklch(0.74_0.18_5_/_0.15)]',
            state === 'success' &&
              'border-[var(--mint)] hover:border-[var(--mint)] shadow-[0_0_0_3px_oklch(0.76_0.14_162_/_0.15)]',
            triggerClassName,
          )}
        >
          <span className={cn('truncate', !selectedOption && 'text-[var(--text-dim)]')}>
            {renderValue
              ? renderValue(selectedOption)
              : (selectedOption?.label ?? placeholder ?? t('select.placeholder'))}
          </span>

          <span
            aria-hidden="true"
            className={cn(
              'shrink-0 text-[var(--text-lo)] transition duration-200',
              open && 'rotate-180 text-[var(--gold)]',
            )}
          >
            <svg viewBox="0 0 10 6" className="h-2.5 w-2.5 fill-current">
              <path d="M5 6 0 0h10L5 6Z" />
            </svg>
          </span>
        </button>

        {open &&
          menuRect &&
          createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={selectId}
              style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
              className={cn(
                'fixed z-[1050] flex max-h-60 flex-col gap-0.5 overflow-y-auto rounded-[var(--r-md)]',
                'border border-[var(--gold)] bg-[var(--bg-2)] p-1 shadow-[var(--sh-3),var(--sh-glow-gold)]',
                menuClassName,
              )}
            >
              {options.map((option, index) => {
                const selected = option.value === currentValue;
                const focused = option.value === focusedValue;

                return (
                  <button
                    key={option.value}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={option.disabled}
                    onMouseEnter={() => !option.disabled && setFocusedValue(option.value)}
                    onClick={() => !option.disabled && setValue(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-[var(--r-sm)] px-3 py-2 text-left text-[var(--t-3)]',
                      'transition-colors duration-[150ms] text-[var(--text-md)]',
                      (focused || selected) && 'bg-[var(--surface-3)]',
                      focused && 'text-[var(--text-hi)]',
                      selected && 'text-[var(--gold)]',
                      option.disabled && 'cursor-not-allowed opacity-40',
                      optionClassName,
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {renderOption ? renderOption(option, { selected, focused }) : option.label}
                    </span>

                    {selected && (
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5 shrink-0 fill-none stroke-current stroke-[1.8]"
                        aria-hidden="true"
                      >
                        <path d="m3 8 3 3 7-7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>,
            document.body,
          )}
      </div>

      {error && (
        <p id={`${selectId}-error`} className="text-t2 text-[var(--rose)]">
          {error}
        </p>
      )}
      {!error && success && (
        <p id={`${selectId}-success`} className="text-t2 text-[var(--mint)]">
          {success}
        </p>
      )}
      {!error && !success && helperText && (
        <p id={`${selectId}-helper`} className="text-t2 text-[var(--text-lo)]">
          {helperText}
        </p>
      )}
    </div>
  );
}
