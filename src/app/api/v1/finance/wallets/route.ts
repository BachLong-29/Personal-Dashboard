import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { WalletModel } from '@/server/models/wallet.model';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';
import type { IWallet } from '@/server/models/wallet.model';
import type { Wallet } from '@/types/finance';

const WALLET_TYPES = ['bank', 'cash', 'ewallet'] as const;
const WALLET_COLORS = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50).trim(),
  type: z.enum(WALLET_TYPES),
  icon: z.string().min(1),
  color: z.enum(WALLET_COLORS),
  currency: z.string().trim().optional(),
  bankCode: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
});

export function serialize(w: IWallet): Wallet {
  return {
    id: w._id.toString(),
    userId: w.userId.toString(),
    name: w.name,
    type: w.type,
    icon: w.icon,
    color: w.color,
    currency: w.currency,
    balance: w.balance,
    bankCode: w.bankCode,
    bankAccountNumber: w.bankAccountNumber,
    active: w.active,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

// GET /api/v1/finance/wallets
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const wallets = await WalletModel.find({ userId: user.sub, active: true }).sort({
    createdAt: 1,
  });

  return successResponse(wallets.map(serialize));
});

// POST /api/v1/finance/wallets
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  const wallet = await WalletModel.create({
    userId: user.sub,
    name: data.name,
    type: data.type,
    icon: data.icon,
    color: data.color,
    currency: data.currency || 'VND',
    bankCode: data.type === 'bank' ? data.bankCode : undefined,
    bankAccountNumber: data.type === 'bank' ? data.bankAccountNumber : undefined,
  });

  return createdResponse(serialize(wallet), 'Wallet created');
});
