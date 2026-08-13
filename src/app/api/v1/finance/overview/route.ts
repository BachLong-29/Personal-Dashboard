import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { getFinanceOverview } from '@/server/services/finance-overview';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';

const MONTH_RE = /^\d{4}-\d{2}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/v1/finance/overview?month=YYYY-MM&today=YYYY-MM-DD
// `today` is the client's local date — it decides what "spent today / this week" means.
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const serverToday = new Date().toISOString().substring(0, 10);

  const todayParam = searchParams.get('today');
  const today = todayParam && DAY_RE.test(todayParam) ? todayParam : serverToday;

  const monthParam = searchParams.get('month');
  const month = monthParam && MONTH_RE.test(monthParam) ? monthParam : today.substring(0, 7);

  await connectDB();

  const overview = await getFinanceOverview(user.sub, month, today);
  return successResponse(overview);
});
