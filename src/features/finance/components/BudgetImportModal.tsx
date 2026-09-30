'use client';

import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { cn } from '@/libs/utils';
import type { ImportBudgetRow } from '@/types';

import { parseBudgetSheet, type SheetRow } from '../budget-csv';
import { currentMonthKey } from '../utils';
import { useBudgets } from '../hooks/useBudgets';
import { useFinanceCategories } from '../hooks/useFinanceCategories';
import { useImportBudgets } from '../hooks/useImportBudgets';
import { useTransactions } from '../hooks/useTransactions';
import { MonthStepper } from './MonthStepper';

interface Props {
  open: boolean;
  onClose: () => void;
  /** The month the budget page is showing — the fallback when the sheet has none. */
  defaultMonth: string;
}

type RowState = 'match' | 'conflict' | 'new' | 'overall' | 'skip' | 'error';

interface PreviewRow {
  key: string;
  sheet: SheetRow;
  state: RowState;
  categoryId?: string;
  recurring: boolean;
}

function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}₫`;
}

/** First and last day of a `YYYY-MM`, as the transaction filter wants them. */
function monthBounds(month: string): [string, string] {
  const [year = 0, mo = 1] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, mo, 0)).getUTCDate();
  return [`${month}-01`, `${month}-${String(lastDay).padStart(2, '0')}`];
}

/**
 * Read a budget sheet and write a month of budgets from it.
 *
 * Everything is parsed in the browser so the preview answers instantly. That
 * matters more than it sounds: the preview is the only thing standing between
 * a mistyped separator and a budget a thousand times too small, and a preview
 * that costs a round trip per keystroke is a preview nobody reads.
 */
export function BudgetImportModal({ open, onClose, defaultMonth }: Props) {
  const [text, setText] = useState('');
  const [monthOverride, setMonthOverride] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  // Which month the reader has agreed to recalculate. Held as the month rather
  // than a boolean so switching months withdraws the consent by itself.
  const [ackedMonth, setAckedMonth] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useFinanceCategories('expense');
  const importBudgets = useImportBudgets();

  const sheet = useMemo(() => parseBudgetSheet(text), [text]);
  // The sheet wins when it carries a month; otherwise the screen decides.
  const month = sheet.month ?? monthOverride ?? defaultMonth;
  const sheetRecurring = sheet.recurring ?? true;

  const { data: existingBudgets = [] } = useBudgets(month);

  // Importing does not touch a single transaction — `spent` is derived, never
  // stored. What moves is the yardstick: limits set now recompute this month's
  // percentages and its report, and the "budget exceeded" notice fires only
  // once per budget per month, so tightening a limit mid-month can pass in
  // silence. So the reader has to say yes to it rather than merely be told:
  // adjusting on purpose stays possible, drifting into it does not.
  const [monthStart, monthEnd] = monthBounds(month);
  const { data: monthTransactions = [] } = useTransactions({ from: monthStart, to: monthEnd });

  const preview = useMemo<PreviewRow[]>(() => {
    const byName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]));
    const budgetedIds = new Set(
      existingBudgets.filter((b) => b.categoryId).map((b) => b.categoryId as string),
    );

    // Last line wins for a category named twice: a sheet edited by hand tends
    // to correct itself further down rather than further up.
    const lastByName = new Map<string, SheetRow>();
    for (const row of sheet.rows) {
      if (!row.isOverall) lastByName.set(row.name.trim().toLowerCase(), row);
    }

    return sheet.rows.map((row) => {
      const key = `${row.line}`;
      const recurring = row.recurring ?? sheetRecurring;
      const name = row.name.trim().toLowerCase();

      if (row.error) return { key, sheet: row, state: 'error' as const, recurring };
      if (row.amount === null) return { key, sheet: row, state: 'skip' as const, recurring };
      if (row.isOverall) return { key, sheet: row, state: 'overall' as const, recurring };
      if (lastByName.get(name) !== row) {
        return { key, sheet: row, state: 'skip' as const, recurring };
      }

      const match = byName.get(name);
      if (!match) return { key, sheet: row, state: 'new' as const, recurring };

      return {
        key,
        sheet: row,
        state: budgetedIds.has(match.id) ? ('conflict' as const) : ('match' as const),
        categoryId: match.id,
        recurring,
      };
    });
  }, [sheet, categories, existingBudgets, sheetRecurring]);

  // A sheet can carry a month of its own, so the page's "no budgets in the
  // past" rule has to be enforced here too — the Import button being disabled
  // on a past month only covers the month the page is showing.
  const isPastMonth = month < currentMonthKey();

  const conflicts = preview.filter((p) => p.state === 'conflict');
  const txCount = monthTransactions.length;
  const needsAck = txCount > 0;
  const acked = ackedMonth === month;
  const willWrite = preview.filter(
    (p) =>
      p.state === 'match' ||
      p.state === 'new' ||
      p.state === 'overall' ||
      (p.state === 'conflict' && accepted.has(p.key)),
  );

  const handleFile = async (file: File) => setText(await file.text());

  const submit = () => {
    const rows: ImportBudgetRow[] = willWrite
      .filter((p) => p.state !== 'overall')
      .map((p) => ({
        categoryId: p.categoryId,
        name: p.sheet.name,
        icon: p.sheet.icon,
        limit: p.sheet.amount ?? 0,
        recurring: p.recurring,
      }));

    const overallRow = willWrite.find((p) => p.state === 'overall');

    importBudgets.mutate(
      {
        month,
        rows,
        overall: overallRow
          ? { limit: overallRow.sheet.amount ?? 0, recurring: overallRow.recurring }
          : undefined,
      },
      {
        onSuccess: () => {
          setText('');
          setAccepted(new Set());
          setAckedMonth(null);
          onClose();
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="720px">
      <ModalHead title="Import budgets" />
      <ModalBody>
        <div className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={'Paste a table, or choose a file\n1\t🏠 Home\t5.000k'}
            className={textarea}
          />

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
              Choose CSV
            </Button>

            <span className="text-[11px] text-[var(--text-lo)]">Month</span>
            <MonthStepper
              month={month}
              onChange={(m) => setMonthOverride(m)}
              className={sheet.month ? 'pointer-events-none opacity-50' : undefined}
            />
            {sheet.month && (
              <span className="text-[10px] text-[var(--text-lo)]">from the sheet</span>
            )}
          </div>

          {preview.length > 0 && (
            <div className="max-h-[42vh] overflow-y-auto rounded-[var(--r-sm)] border border-[var(--border)]">
              {preview.map((p) => (
                <div key={p.key} className={row}>
                  <span className="w-[52px] shrink-0">
                    {p.state === 'conflict' ? (
                      <label className="flex cursor-pointer items-center gap-1 text-[10px] text-[var(--warning)]">
                        <input
                          type="checkbox"
                          checked={accepted.has(p.key)}
                          onChange={(e) => {
                            const next = new Set(accepted);
                            if (e.target.checked) next.add(p.key);
                            else next.delete(p.key);
                            setAccepted(next);
                          }}
                        />
                        over
                      </label>
                    ) : (
                      <span className={cn('text-[10px]', STATE_TONE[p.state])}>
                        {STATE_LABEL[p.state]}
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--text-hi)]">
                    {p.sheet.icon ? `${p.sheet.icon} ` : ''}
                    {p.sheet.name}
                  </span>

                  <span className="shrink-0 text-[12px] tabular-nums text-[var(--text-mid)]">
                    {p.sheet.error ?? (p.sheet.amount === null ? '—' : formatVnd(p.sheet.amount))}
                  </span>

                  <span className="w-[42px] shrink-0 text-right text-[10px] text-[var(--text-lo)]">
                    {p.state === 'skip' || p.state === 'error'
                      ? ''
                      : p.recurring
                        ? 'repeat'
                        : 'once'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isPastMonth && (
            <p className="text-[11px] text-[var(--rose)]">
              ⚠ {month} is in the past — budgets can only be set from this month on.
            </p>
          )}

          {conflicts.length > 0 && (
            <p className="text-[11px] text-[var(--warning)]">
              ⚠ {conflicts.length} already have a budget for {month}. Tick the ones to overwrite.
            </p>
          )}
        </div>
      </ModalBody>
      <ModalFoot>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <span className="text-[11px] text-[var(--text-lo)] sm:mr-auto">
            {willWrite.length} of {preview.length} lines will be written
          </span>
          <Button variant="ghost" onClick={onClose} className="w-full justify-center sm:w-auto">
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={willWrite.length === 0 || isPastMonth || importBudgets.isPending}
            // A month with spending already in it gets asked a second time.
            onClick={() => {
              if (!needsAck) return submit();
              setAckedMonth(null);
              setConfirming(true);
            }}
            className="w-full justify-center sm:w-auto"
          >
            {importBudgets.isPending ? '…' : `Import ${willWrite.length}`}
          </Button>
        </div>
      </ModalFoot>

      <Modal open={confirming} onClose={() => setConfirming(false)} maxWidth="420px">
        <ModalHead
          title={
            <>
              <span className="text-[var(--warning)]">⚠</span> This month is already under way
            </>
          }
        />
        <ModalBody>
          <div className="flex flex-col gap-3">
            <p className="text-[12px] leading-relaxed text-[var(--text-mid)]">
              {month} already has {txCount} transaction{txCount === 1 ? '' : 's'}. Setting limits
              now recalculates this month&rsquo;s percentages and its report, and a &ldquo;budget
              exceeded&rdquo; notice fires only once per month — so tightening a limit now can pass
              unnoticed.
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[var(--text-hi)]">
              <input
                type="checkbox"
                checked={acked}
                onChange={(e) => setAckedMonth(e.target.checked ? month : null)}
              />
              I understand — import anyway
            </label>
          </div>
        </ModalBody>
        <ModalFoot>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => setConfirming(false)}
              className="w-full justify-center sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!acked || importBudgets.isPending}
              onClick={() => {
                setConfirming(false);
                submit();
              }}
              className="w-full justify-center sm:w-auto"
            >
              {importBudgets.isPending ? '…' : `Import ${willWrite.length}`}
            </Button>
          </div>
        </ModalFoot>
      </Modal>
    </Modal>
  );
}

const STATE_LABEL: Record<RowState, string> = {
  match: '✓',
  conflict: '',
  new: '+ new',
  overall: 'total',
  skip: 'skip',
  error: '!',
};

const STATE_TONE: Record<RowState, string> = {
  match: 'text-[var(--mint)]',
  conflict: 'text-[var(--warning)]',
  new: 'text-[var(--cyan)]',
  overall: 'text-[var(--gold)]',
  skip: 'text-[var(--text-dim)]',
  error: 'text-[var(--rose)]',
};

const textarea = cn(
  'w-full resize-none rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-2)]',
  'px-3 py-2.5 font-[var(--f-mono)] text-[12px] text-[var(--text-hi)]',
  'placeholder:text-[var(--text-dim)] focus:border-[var(--gold)] focus:outline-none',
);

const row = cn(
  'flex items-center gap-2 border-b border-[var(--border)] px-2.5 py-1.5 last:border-b-0',
);
