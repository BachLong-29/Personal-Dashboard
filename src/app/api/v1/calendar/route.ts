import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { buildCalendar } from '@/server/services/schedule-engine';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateSearchParams } from '@/server/validate';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const querySchema = z.object({
  from: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD'),
  to: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD'),
});

// GET /api/v1/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data: query, error } = await validateSearchParams(req.nextUrl.searchParams, querySchema);
  if (error) return error;

  await connectDB();

  const items = await buildCalendar(user.sub, query!.from, query!.to);
  return successResponse(items);
});
