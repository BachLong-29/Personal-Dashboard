import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { getBalanceForecast } from '@/server/services/finance-forecast';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/v1/finance/forecast?today=YYYY-MM-DD
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const todayParam = searchParams.get('today');
  const today =
    todayParam && DAY_RE.test(todayParam) ? todayParam : new Date().toISOString().substring(0, 10);

  await connectDB();

  const forecast = await getBalanceForecast(user.sub, today);
  return successResponse(forecast);
});
