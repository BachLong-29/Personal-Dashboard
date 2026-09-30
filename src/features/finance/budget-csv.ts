import type { FinanceCategory } from '@/types';

/**
 * A budget sheet: one line per spending category, an amount, and optionally
 * whether it repeats. Written by hand, pasted from a note, or downloaded from
 * the template button and filled in.
 */

export interface SheetRow {
  /** 1-based line in the source text, so an error can point at it. */
  line: number;
  /** Leading emoji, if the name carried one — becomes the icon of a new category. */
  icon?: string;
  name: string;
  /** null when the cell was blank, which means "no budget for this one". */
  amount: number | null;
  /** undefined when the cell was blank — the sheet or the screen decides. */
  recurring?: boolean;
  /** The "Tổng"/"Total" line, which becomes the month's overall budget. */
  isOverall: boolean;
  error?: string;
}

export interface ParsedSheet {
  /** From a `Month, 2026-10` header line, if the sheet carried one. */
  month?: string;
  /** From a `Recurring, yes` header line. */
  recurring?: boolean;
  rows: SheetRow[];
}

const MONTH_RE = /^\d{4}-\d{2}$/;
/** Matches a total line in either language, after normalising. */
const TOTAL_RE = /^(tổng|tong|total|sum)$/;
/** A leading pictograph, which the template writes in front of every name. */
const LEADING_ICON_RE = /^(\p{Extended_Pictographic}️?)\s*/u;

const TRUE_WORDS = new Set(['yes', 'y', 'true', '1', 'x', '✓', 'có', 'co']);
const FALSE_WORDS = new Set(['no', 'n', 'false', '0', '-', 'không', 'khong']);

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Money as people actually write it: `5000k`, `5.000k`, `5,000k` and `5000000`
 * are all five million. Both separators are thousands marks here — Vietnamese
 * writing uses the dot for that — so they are simply removed, and a trailing
 * `k` multiplies by a thousand.
 *
 * Returns `null` for a blank cell and throws for anything it cannot read,
 * because a number it guessed at is worse than a line the reader must fix.
 */
export function parseAmount(raw: string): number | null {
  const text = raw
    .trim()
    .replace(/[₫đ]|vnd/gi, '')
    .trim();
  if (text === '') return null;

  const thousands = /k$/i.test(text);
  const digits = (thousands ? text.slice(0, -1) : text).replace(/[.,\s]/g, '');

  if (!/^\d+$/.test(digits)) throw new Error(`Cannot read "${raw.trim()}" as an amount`);

  const amount = Number(digits) * (thousands ? 1000 : 1);
  if (amount < 1) throw new Error('Amount must be at least 1');

  return amount;
}

function parseFlag(raw: string): boolean | undefined {
  const value = normalise(raw);
  if (value === '') return undefined;
  if (TRUE_WORDS.has(value)) return true;
  if (FALSE_WORDS.has(value)) return false;
  return undefined;
}

/** One CSV line into cells, honouring quotes. Tab-separated text skips this. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }

  cells.push(cell);
  return cells;
}

function splitLine(line: string): string[] {
  // A pasted table is tab-separated; the template is comma-separated. Deciding
  // per line rather than per file lets one paste mix the two.
  return line.includes('\t') ? line.split('\t') : splitCsvLine(line);
}

/** True for the `#  Khoản chi  Số tiền` row the template writes above the data. */
function isColumnHeader(cells: string[]): boolean {
  const joined = cells.map(normalise).join(' ');
  return /khoản chi|khoan chi|số tiền|so tien|amount|category/.test(joined);
}

/**
 * Read a pasted table or a downloaded template.
 *
 * Tolerates a missing header, a missing index column, a missing recurring
 * column, and blank lines — the same sheet has to survive a round trip through
 * Excel, a text note, and a hand-typed paste.
 */
export function parseBudgetSheet(text: string): ParsedSheet {
  // Excel writes a BOM; Windows writes CRLF.
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const result: ParsedSheet = { rows: [] };

  lines.forEach((raw, index) => {
    const line = index + 1;
    if (raw.trim() === '') return;

    const cells = splitLine(raw).map((c) => c.trim());
    const first = normalise(cells[0] ?? '');

    // `Month, 2026-10` / `Recurring, yes` — anywhere, though the template puts
    // them at the top.
    if (first === 'month' || first === 'tháng' || first === 'thang') {
      const value = (cells[1] ?? '').trim();
      if (MONTH_RE.test(value)) result.month = value;
      return;
    }
    if (first === 'recurring' || first === 'lặp' || first === 'lap') {
      result.recurring = parseFlag(cells[1] ?? '');
      return;
    }

    if (isColumnHeader(cells)) return;

    // Drop the leading index cell. It holds a row number on a normal line and
    // nothing at all on the total line, which is why emptiness counts too —
    // without that, "  , Tổng, 13.215k" loses its name and the row vanishes.
    const leading = cells[0] ?? '';
    const body =
      cells.length > 2 && (leading === '' || /^\d+$/.test(leading)) ? cells.slice(1) : cells;
    const [rawName = '', rawAmount = '', rawRecurring = ''] = body;
    if (rawName === '') return;

    const iconMatch = rawName.match(LEADING_ICON_RE);
    const name = rawName.replace(LEADING_ICON_RE, '').trim();
    const isOverall = TOTAL_RE.test(normalise(name));

    const row: SheetRow = {
      line,
      icon: iconMatch?.[1],
      name: isOverall ? name : name || rawName,
      amount: null,
      recurring: parseFlag(rawRecurring),
      isOverall,
    };

    try {
      row.amount = parseAmount(rawAmount);
    } catch (err) {
      row.error = err instanceof Error ? err.message : 'Invalid amount';
    }

    result.rows.push(row);
  });

  return result;
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * A sheet of every expense category with the amounts left blank.
 *
 * Starting from the reader's own category names is what makes the import
 * accurate: the names match by construction rather than by guesswork, which is
 * the one place this feature could quietly put money in the wrong place.
 *
 * The BOM is not decoration — without it Excel on Windows renders "Ăn trưa"
 * as mojibake.
 */
export function buildBudgetTemplate(
  categories: Pick<FinanceCategory, 'name' | 'icon'>[],
  month: string,
  recurring: boolean,
): string {
  const lines = [
    `Month,${month}`,
    `Recurring,${recurring ? 'yes' : 'no'}`,
    '',
    '#,Khoản chi,Số tiền,Lặp',
    ...categories.map((c, i) => `${i + 1},${csvCell(`${c.icon} ${c.name}`.trim())},,`),
    `,${csvCell('Tổng')},,`,
  ];

  return `﻿${lines.join('\n')}\n`;
}
