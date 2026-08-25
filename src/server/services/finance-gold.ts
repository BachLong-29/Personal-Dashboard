import type { GoldType } from '@/server/models/gold-price-snapshot.model';
import { GoldPriceSnapshotModel } from '@/server/models/gold-price-snapshot.model';

export interface GoldPriceEntry {
  goldType: GoldType;
  name: string;
  /** VND per "chỉ" (1 chỉ = 3.75g) — the source quotes VND per "lượng" (10 chỉ). */
  buyPrice: number;
  sellPrice: number;
  fetchedAt: string;
  stale: boolean;
}

export interface GoldPriceResult {
  prices: GoldPriceEntry[];
  /** True only when there is no usable price at all — not even a stale one. */
  unavailable: boolean;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const STALE_CUTOFF_MS = 24 * 60 * 60 * 1000;
const SOURCE_NAME = 'vang.today';
const SOURCE_URL = 'https://www.vang.today/api/prices';

/** Internal gold type -> vang.today `type_code` (see finance-gold.md). */
const TYPE_CODE_BY_GOLD_TYPE: Record<GoldType, string> = {
  sjc: 'SJL1L10',
  vngsjc: 'VNGSJC',
};

interface VangTodayResponse {
  success: boolean;
  timestamp: number;
  prices: Record<string, { name: string; buy: number; sell: number }>;
}

function toEntry(
  doc: {
    goldType: GoldType;
    name: string;
    buyPrice: number;
    sellPrice: number;
    fetchedAt: Date;
  },
  stale: boolean,
): GoldPriceEntry {
  return {
    goldType: doc.goldType,
    name: doc.name,
    buyPrice: doc.buyPrice,
    sellPrice: doc.sellPrice,
    fetchedAt: doc.fetchedAt.toISOString(),
    stale,
  };
}

async function fetchAndCache(): Promise<GoldPriceEntry[]> {
  const res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`vang.today responded ${res.status}`);

  const json = (await res.json()) as VangTodayResponse;
  if (!json.success || !json.prices) throw new Error('vang.today: unexpected response shape');

  const fetchedAt = new Date(json.timestamp * 1000);
  const entries: GoldPriceEntry[] = [];

  for (const [goldType, typeCode] of Object.entries(TYPE_CODE_BY_GOLD_TYPE) as [
    GoldType,
    string,
  ][]) {
    const quote = json.prices[typeCode];
    if (!quote) continue;

    const buyPrice = quote.buy / 10;
    const sellPrice = quote.sell / 10;

    await GoldPriceSnapshotModel.findOneAndUpdate(
      { goldType },
      { goldType, name: quote.name, buyPrice, sellPrice, source: SOURCE_NAME, fetchedAt },
      { upsert: true },
    );

    entries.push({
      goldType,
      name: quote.name,
      buyPrice,
      sellPrice,
      fetchedAt: fetchedAt.toISOString(),
      stale: false,
    });
  }

  if (entries.length === 0) {
    throw new Error('vang.today: none of the known type_codes were found in the response');
  }

  return entries;
}

/**
 * Current gold prices (VND/chỉ) for sjc/vngsjc, cached 15 minutes to avoid hammering the
 * free upstream API on every request. Falls back to a snapshot up to 24h old (flagged `stale`)
 * if a refetch fails; only reports `unavailable` when there is nothing usable left at all.
 */
export async function getGoldPrices(): Promise<GoldPriceResult> {
  const knownGoldTypes = Object.keys(TYPE_CODE_BY_GOLD_TYPE) as GoldType[];
  const cached = await GoldPriceSnapshotModel.find({
    goldType: { $in: knownGoldTypes },
  }).lean();

  const now = Date.now();
  const allFresh =
    cached.length === knownGoldTypes.length &&
    cached.every((c) => now - c.fetchedAt.getTime() < CACHE_TTL_MS);

  if (allFresh) {
    return { prices: cached.map((c) => toEntry(c, false)), unavailable: false };
  }

  try {
    const entries = await fetchAndCache();
    return { prices: entries, unavailable: false };
  } catch (error) {
    console.error('[finance-gold] fetch failed, falling back to cache', error);

    const freshEnoughToServeStale = cached.filter(
      (c) => now - c.fetchedAt.getTime() < STALE_CUTOFF_MS,
    );

    if (freshEnoughToServeStale.length > 0) {
      return { prices: freshEnoughToServeStale.map((c) => toEntry(c, true)), unavailable: false };
    }

    return { prices: [], unavailable: true };
  }
}

/**
 * Single-type lookup used to value a `GoldAccount` — the account is deliberately priced off one
 * type only (VNGSJC — "VN Gold SJC"), not an average across types.
 */
export async function getGoldPriceByType(goldType: GoldType): Promise<GoldPriceEntry | null> {
  const { prices } = await getGoldPrices();
  return prices.find((p) => p.goldType === goldType) ?? null;
}
