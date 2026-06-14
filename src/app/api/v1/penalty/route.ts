import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { PenaltyLogModel } from '@/server/models/penalty-log.model';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

const createSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        difficulty: z.string().default('C'),
      }),
    )
    .min(1),
});

// GET /api/v1/penalty — returns the active pending penalty or null
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const penalty = await PenaltyLogModel.findOne({
    userId: user.sub,
    status: 'pending',
  }).lean();

  return successResponse(penalty ?? null);
});

// POST /api/v1/penalty — create a new penalty (returns existing if one is already pending)
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  // Return existing pending penalty if present
  const existing = await PenaltyLogModel.findOne({ userId: user.sub, status: 'pending' });
  if (existing) return successResponse(existing);

  const penalty = await PenaltyLogModel.create({
    userId: user.sub,
    tier: 1,
    status: 'pending',
    triggeredDate: new Date(),
    unfinished: data.items,
  });

  return successResponse(penalty, 'Penalty created');
});
