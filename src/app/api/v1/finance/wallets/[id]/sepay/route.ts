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

/**
 * The URL to hand SePay. SePay calls it from its own servers, so it has to be the public
 * origin — `localhost` is rejected outright.
 *
 * Resolved in order:
 *  1. `SEPAY_WEBHOOK_BASE_URL` — set this while developing locally to read back the deployed
 *     origin instead of localhost.
 *  2. The origin this request actually arrived on. On Vercel that is the deployment's own
 *     domain, so nothing needs configuring for it to be right.
 *  3. `NEXT_PUBLIC_APP_URL`, as a last resort.
 *
 * Trailing slashes are stripped: Vercel stores the app URL with one, and `//api/...` makes
 * Next.js answer with a 308 redirect instead of running the route — a webhook sender that
 * doesn't follow redirects would then deliver nothing, with no error anywhere to notice.
 */
function resolveWebhookUrl(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const forwardedProto = req.headers.get('x-forwarded-proto') ?? 'https';

  const origin =
    process.env.SEPAY_WEBHOOK_BASE_URL ||
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : clientEnv.NEXT_PUBLIC_APP_URL);

  return `${origin.replace(/\/+$/, '')}/api/v1/webhooks/sepay`;
}

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
    webhookUrl: resolveWebhookUrl(req),
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

  return successResponse({ apiKey, webhookUrl: resolveWebhookUrl(req) }, 'SePay API key generated');
});
