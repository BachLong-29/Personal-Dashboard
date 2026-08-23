import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { getGoldPrices } from '@/server/services/finance-gold';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';

// GET /api/v1/finance/gold/price
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const result = await getGoldPrices();
  return successResponse(result);
});
