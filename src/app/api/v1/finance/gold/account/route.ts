import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { GoldAccountModel } from '@/server/models/gold-account.model';
import type { IGoldAccount } from '@/server/models/gold-account.model';
import { getGoldPriceByType } from '@/server/services/finance-gold';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

const PRICING_GOLD_TYPE = 'vngsjc' as const;

const updateSchema = z.object({
  quantityChi: z.number().min(0).optional(),
  quantityCay: z.number().min(0).optional(),
});

async function serialize(account: IGoldAccount) {
  const price = await getGoldPriceByType(PRICING_GOLD_TYPE);
  const totalChi = account.quantityCay * 10 + account.quantityChi;

  return {
    quantityChi: account.quantityChi,
    quantityCay: account.quantityCay,
    totalChi,
    pricePerChi: price?.buyPrice ?? null,
    value: price ? totalChi * price.buyPrice : null,
    priceStale: price?.stale ?? false,
    priceUnavailable: price === null,
    priceUpdatedAt: price?.fetchedAt ?? null,
    updatedAt: account.updatedAt.toISOString(),
  };
}

// GET /api/v1/finance/gold/account — get-or-create the user's single gold holding
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  // Plain findOne first — mongoose's `timestamps` option bumps `updatedAt` on every
  // findOneAndUpdate call regardless of whether any field actually changes, and the client
  // re-syncs its local inputs whenever `updatedAt` moves, so a GET must not touch it.
  let account = await GoldAccountModel.findOne({ userId: user.sub });
  if (!account) {
    account = await GoldAccountModel.create({ userId: user.sub, quantityChi: 0, quantityCay: 0 });
  }

  return successResponse(await serialize(account));
});

// PATCH /api/v1/finance/gold/account
export const PATCH = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  const fields: Record<string, number> = {};
  if (data.quantityChi !== undefined) fields.quantityChi = data.quantityChi;
  if (data.quantityCay !== undefined) fields.quantityCay = data.quantityCay;

  const account = await GoldAccountModel.findOneAndUpdate(
    { userId: user.sub },
    { $set: fields, $setOnInsert: { userId: user.sub } },
    { upsert: true, new: true },
  );

  return successResponse(await serialize(account), 'Gold account updated');
});
