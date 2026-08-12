import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { WalletModel } from '@/server/models/wallet.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';
import { serialize } from '../route';

const WALLET_COLORS = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;

const updateSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  icon: z.string().min(1).optional(),
  color: z.enum(WALLET_COLORS).optional(),
  bankCode: z.string().trim().optional().nullable(),
  bankAccountNumber: z.string().trim().optional().nullable(),
});

// PATCH /api/v1/finance/wallets/:id
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;
  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  const setData: Record<string, unknown> = {};
  const unsetData: Record<string, 1> = {};

  const { bankCode, bankAccountNumber, ...rest } = data;
  for (const [key, val] of Object.entries(rest)) {
    if (val !== undefined) setData[key] = val;
  }

  if (bankCode === null) unsetData.bankCode = 1;
  else if (bankCode !== undefined) setData.bankCode = bankCode;

  if (bankAccountNumber === null) unsetData.bankAccountNumber = 1;
  else if (bankAccountNumber !== undefined) setData.bankAccountNumber = bankAccountNumber;

  const updateOp: Record<string, unknown> = {};
  if (Object.keys(setData).length > 0) updateOp.$set = setData;
  if (Object.keys(unsetData).length > 0) updateOp.$unset = unsetData;

  const wallet = await WalletModel.findOneAndUpdate({ _id: id, userId: user.sub }, updateOp, {
    new: true,
  });

  if (!wallet) return notFoundResponse('Wallet not found');

  return successResponse(serialize(wallet), 'Wallet updated');
});

// DELETE /api/v1/finance/wallets/:id — soft delete, history kept
export const DELETE = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const wallet = await WalletModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { $set: { active: false } },
    { new: true },
  );

  if (!wallet) return notFoundResponse('Wallet not found');

  return successResponse(null, 'Wallet deleted');
});
