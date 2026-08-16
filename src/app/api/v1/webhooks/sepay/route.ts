import { z } from 'zod';
import { NextResponse, type NextRequest } from 'next/server';
import type { Types } from 'mongoose';

import { connectDB } from '@/libs/mongodb';
import { compareSecret } from '@/server/libs/hash';
import { getRequestIp, rateLimit } from '@/server/libs/rate-limit';
import { WalletModel } from '@/server/models/wallet.model';
import { FinanceCategoryModel } from '@/server/models/finance-category.model';
import { TransactionModel } from '@/server/models/transaction.model';
import type { TransactionType } from '@/types/finance';

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

const payloadSchema = z
  .object({
    id: z.union([z.number(), z.string()]).transform(String),
    transactionDate: z.string(),
    accountNumber: z.string().min(1),
    content: z.string().optional(),
    description: z.string().optional(),
    transferType: z.enum(['in', 'out']),
    transferAmount: z.number().positive(),
  })
  .passthrough();

const UNCATEGORIZED_NAME = 'Chưa phân loại';
const UNCATEGORIZED_DEFAULTS = { icon: '❔', color: 'violet' };

/** Picks the category whose keyword match in `haystack` is longest (most specific wins). */
function matchCategoryByKeyword(
  categories: { _id: Types.ObjectId; keywords?: string[] }[],
  haystack: string,
): Types.ObjectId | null {
  let best: { id: Types.ObjectId; len: number } | null = null;
  for (const cat of categories) {
    for (const raw of cat.keywords ?? []) {
      const needle = raw.trim().toLowerCase();
      if (needle && haystack.includes(needle) && (!best || needle.length > best.len)) {
        best = { id: cat._id, len: needle.length };
      }
    }
  }
  return best?.id ?? null;
}

const ack = (status = 200) => NextResponse.json({ success: true }, { status });
const unauthorized = () =>
  NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

/** SePay sends "YYYY-MM-DD HH:MM:SS" with no timezone — treated as server-local time. */
function parseSepayDate(value: string): Date {
  return new Date(value.replace(' ', 'T'));
}

// POST /api/v1/webhooks/sepay — public endpoint, authenticated via Apikey header (not JWT).
// Must always resolve fast with { success: true } so SePay doesn't disable/retry the webhook.
export async function POST(req: NextRequest) {
  if (!rateLimit(`sepay:${getRequestIp(req)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const authHeader = req.headers.get('authorization');
  const match = authHeader?.match(/^Apikey\s+(.+)$/i);
  if (!match) return unauthorized();
  const apiKey = match[1]?.trim();
  if (!apiKey) return unauthorized();

  const parsed = payloadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return ack(); // malformed payload — ack so SePay stops retrying
  const payload = parsed.data;

  try {
    await connectDB();

    const wallet = await WalletModel.findOne({
      bankAccountNumber: payload.accountNumber,
      type: 'bank',
      active: true,
    });
    if (!wallet?.sepayWebhookSecret) return ack(); // no matching/connected wallet — ack, skip

    const validKey = await compareSecret(apiKey, wallet.sepayWebhookSecret);
    if (!validKey) return unauthorized();

    const alreadyProcessed = await TransactionModel.exists({ sepayTransactionId: payload.id });
    if (alreadyProcessed) return ack();

    const type: TransactionType = payload.transferType === 'in' ? 'income' : 'expense';

    const haystack = `${payload.content ?? ''} ${payload.description ?? ''}`.toLowerCase();
    const ruledCategories = await FinanceCategoryModel.find({
      userId: wallet.userId,
      type,
      keywords: { $exists: true, $not: { $size: 0 } },
    })
      .select('_id keywords')
      .lean();
    const matchedCategoryId = matchCategoryByKeyword(ruledCategories, haystack);

    const category = matchedCategoryId
      ? { _id: matchedCategoryId }
      : await FinanceCategoryModel.findOneAndUpdate(
          { userId: wallet.userId, name: UNCATEGORIZED_NAME, type },
          { $setOnInsert: { ...UNCATEGORIZED_DEFAULTS } },
          { upsert: true, new: true },
        );

    await TransactionModel.create({
      userId: wallet.userId,
      walletId: wallet._id,
      categoryId: category._id,
      type,
      amount: payload.transferAmount,
      note: payload.content || payload.description,
      date: parseSepayDate(payload.transactionDate),
      source: 'sepay',
      sepayTransactionId: payload.id,
    });

    await WalletModel.findByIdAndUpdate(wallet._id, {
      $inc: { balance: type === 'income' ? payload.transferAmount : -payload.transferAmount },
    });

    return ack(201);
  } catch (error) {
    // Swallow internal errors — still ack so SePay doesn't disable the webhook after retries.
    console.error('[SePay webhook error]', error);
    return ack();
  }
}
