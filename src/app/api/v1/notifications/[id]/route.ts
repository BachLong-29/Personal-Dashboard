import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { NotificationModel } from '@/server/models/notification.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';
import mongoose from 'mongoose';

// DELETE /api/v1/notifications/[id]
export const DELETE = asyncHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const user = getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await ctx.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse('Notification not found');
    }
    await connectDB();

    // Marked, not erased — see `dismissedAt` on the model for why.
    const result = await NotificationModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(user.sub),
      },
      { $set: { dismissedAt: new Date() } },
    );

    if (!result) return notFoundResponse('Notification not found');

    return successResponse({ ok: true });
  },
);
