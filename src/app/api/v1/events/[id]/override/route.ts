import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { EventModel } from '@/server/models/event.model';
import {
  asyncHandler,
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from '@/server';
import { validateBody } from '@/server/validate';

import { serialize } from '../../route';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const overrideSchema = z.object({
  /** The occurrence being amended, as the rule generated it. */
  date: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD'),
  cancelled: z.boolean().default(false),
  /** Where it moves to — defaults to `date` when only the time changes. */
  newDate: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD').optional(),
  startTime: z.string().regex(TIME_RE, 'Must be HH:MM').optional(),
  duration: z.number().int().min(1).max(1440).optional(),
});

// POST /api/v1/events/:id/override — cancel or move one occurrence of a series
export const POST = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;
  const { data, error } = await validateBody(req, overrideSchema);
  if (error) return error;

  await connectDB();

  const series = await EventModel.findOne({ _id: id, userId: user.sub, active: true });
  if (!series) return notFoundResponse('Event not found');
  if (!series.recurrence) {
    return errorResponse('Only a repeating event has occurrences to override', 400);
  }

  // One override per occurrence — amending the same day again replaces it.
  const event = await EventModel.findOneAndUpdate(
    { userId: user.sub, seriesRef: series._id, overrideDate: new Date(data.date) },
    {
      $set: {
        userId: user.sub,
        seriesRef: series._id,
        overrideDate: new Date(data.date),
        startDate: new Date(data.newDate ?? data.date),
        cancelled: data.cancelled,
        // Display fields stay on the series so a rename reaches this occurrence.
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.duration !== undefined && { duration: data.duration }),
      },
    },
    { new: true, upsert: true, runValidators: true },
  );

  return successResponse(
    serialize(event),
    data.cancelled ? 'Occurrence cancelled' : 'Occurrence moved',
  );
});
