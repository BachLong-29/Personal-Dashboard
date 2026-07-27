import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { NotificationModel } from '@/server/models/notification.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';
import mongoose from 'mongoose';

// PUT /api/v1/notifications/[id]/read
export const PUT = asyncHandler(
  async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const user = getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await ctx.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return notFoundResponse('Notification not found');
    }
    await connectDB();

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(user.sub) },
      { $set: { isRead: true } },
      { new: true },
    );

    if (!notification) return notFoundResponse('Notification not found');

    return successResponse(notification);
  },
);
