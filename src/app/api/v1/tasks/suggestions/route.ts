import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { suggestBacklogTasks } from '@/server/services/task-suggestion';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateSearchParams } from '@/server/validate';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const querySchema = z.object({
  date: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD'),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

// GET /api/v1/tasks/suggestions?date=YYYY-MM-DD&limit=<n>
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data: query, error } = validateSearchParams(req.nextUrl.searchParams, querySchema);
  if (error) return error;

  await connectDB();

  const suggestions = await suggestBacklogTasks(user.sub, query.date, query.limit ?? 5);

  return successResponse(suggestions);
});
