import { TransactionModel } from '@/server/models/transaction.model';
import { WalletModel } from '@/server/models/wallet.model';

export interface ForecastPoint {
  /** "YYYY-MM" */
  month: string;
  /** Balance at the end of that month — measured for past months, projected for future ones. */
  balance: number;
  actual: boolean;
}

export interface BalanceForecast {
  /** Total balance across active wallets right now. */
  current: number;
  /** Average monthly net cash flow the projection extrapolates from. */
  avgNet: number;
  /** Months of real data the average is based on — 0 means the projection is flat. */
  basedOnMonths: number;
  points: ForecastPoint[];
}

function shift(month: string, delta: number): string {
  const parts = month.split('-');
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Where the balance is heading: the last `back` months measured from the ledger, then `ahead`
 * months extrapolated from the average net cash flow of the completed months in that window.
 *
 * It is deliberately a straight-line projection — no seasonality, no goal or recurring modelling.
 * Anything cleverer would look precise without being more correct.
 */
export async function getBalanceForecast(
  userId: string,
  today: string,
  back = 3,
  ahead = 6,
): Promise<BalanceForecast> {
  const currentMonth = today.substring(0, 7);
  const windowStart = shift(currentMonth, -back);
  const windowParts = windowStart.split('-');

  const wallets = await WalletModel.find({ userId, active: true }).lean();
  const current = wallets.reduce((sum, w) => sum + w.balance, 0);

  const transactions = await TransactionModel.find({
    userId,
    date: { $gte: new Date(Date.UTC(Number(windowParts[0]), Number(windowParts[1]) - 1, 1)) },
  }).lean();

  const netByMonth = new Map<string, number>();
  for (const t of transactions) {
    const key = t.date.toISOString().substring(0, 7);
    const delta = t.type === 'income' ? t.amount : -t.amount;
    netByMonth.set(key, (netByMonth.get(key) ?? 0) + delta);
  }

  // Completed months only — the current month is still accumulating, so including it would
  // drag the average down early in the month.
  const completed = Array.from({ length: back }, (_, i) => shift(currentMonth, -(i + 1)));
  const withData = completed.filter((m) => netByMonth.has(m));
  const avgNet = withData.length
    ? Math.round(withData.reduce((sum, m) => sum + (netByMonth.get(m) ?? 0), 0) / withData.length)
    : 0;

  // Walk backwards from today's balance, undoing each month's net, to get past month-end balances.
  const points: ForecastPoint[] = [];
  let running = current;
  const pastPoints: ForecastPoint[] = [];
  for (let i = 0; i <= back; i++) {
    const month = shift(currentMonth, -i);
    pastPoints.unshift({ month, balance: Math.round(running), actual: true });
    running -= netByMonth.get(month) ?? 0;
  }
  points.push(...pastPoints);

  let projected = current;
  for (let i = 1; i <= ahead; i++) {
    projected += avgNet;
    points.push({ month: shift(currentMonth, i), balance: Math.round(projected), actual: false });
  }

  return { current, avgNet, basedOnMonths: withData.length, points };
}
