import { randomBytes } from 'crypto';

import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { clientEnv } from '@/configs/env';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { hashSecret } from '@/server/libs/hash';
import { WalletModel } from '@/server/models/wallet.model';
import { TransactionModel } from '@/server/models/transaction.model';
import {
  asyncHandler,
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from '@/server';

const CONNECTED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
// The app URL is operator-configured and often ends with a slash (Vercel writes it that way).
// Left as-is it hands SePay a `//api/...` URL, which Next.js answers with a 308 redirect — a
// webhook sender that doesn't follow redirects then delivers nothing, with no error to see.
const WEBHOOK_URL = `${clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '')}/api/v1/webhooks/sepay`;

// GET /api/v1/finance/wallets/:id/sepay — connection status for the "Kết nối SePay" panel
export const GET = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const wallet = await WalletModel.findOne({ _id: id, userId: user.sub, type: 'bank' });
  if (!wallet) return notFoundResponse('Wallet not found');

  const connected = await TransactionModel.exists({
    walletId: wallet._id,
    source: 'sepay',
    date: { $gte: new Date(Date.now() - CONNECTED_WINDOW_MS) },
  });

  return successResponse({
    configured: !!wallet.sepayWebhookSecret,
    connected: !!connected,
    webhookUrl: WEBHOOK_URL,
  });
});

// PATCH /api/v1/finance/wallets/:id/sepay — generate/rotate the webhook API key.
// Returns the plaintext key once; only the bcrypt hash is persisted.
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const wallet = await WalletModel.findOne({ _id: id, userId: user.sub, type: 'bank' });
  if (!wallet) return notFoundResponse('Wallet not found');

  if (!wallet.bankAccountNumber) {
    return errorResponse('Set an account number on this wallet before connecting SePay', 400);
  }

  const apiKey = randomBytes(24).toString('hex');
  wallet.sepayWebhookSecret = await hashSecret(apiKey);
  await wallet.save();

  return successResponse({ apiKey, webhookUrl: WEBHOOK_URL }, 'SePay API key generated');
});
