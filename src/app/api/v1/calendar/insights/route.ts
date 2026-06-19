import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { DEFAULT_SCHEDULE_SETTINGS, UserSettingModel } from '@/server/models/user-setting.model';
import { buildCalendar, dateKeysBetween } from '@/server/services/schedule-engine';
import { computeCapacity, detectConflicts } from '@/server/services/schedule-insights';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateSearchParams } from '@/server/validate';
import type { CalendarInsights } from '@/types/calendar-insights';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const querySchema = z.object({
  from: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD'),
  to: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD'),
});

// GET /api/v1/calendar/insights?from=&to=
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data: query, error } = await validateSearchParams(req.nextUrl.searchParams, querySchema);
  if (error) return error;

  await connectDB();

  const setting = await UserSettingModel.findOne({ userId: user.sub }).lean();
  const sched = setting?.schedule ?? DEFAULT_SCHEDULE_SETTINGS;

  const items = await buildCalendar(user.sub, query!.from, query!.to);
  const dateKeys = dateKeysBetween(query!.from, query!.to);

  const insights: CalendarInsights = {
    conflicts: detectConflicts(items, sched.minBreakMinutes ?? 15),
    capacity: computeCapacity(items, dateKeys, sched.dailyCapacityMinutes ?? 600),
  };

  return successResponse(insights);
});
