import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { NotificationModel } from '@/server/models/notification.model';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import mongoose from 'mongoose';

// GET /api/v1/notifications/unread-count
// Separate from the (capped) list endpoint so the badge reflects the true
// unread total even when it exceeds the list's display limit.
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const now = new Date();
  const count = await NotificationModel.countDocuments({
    userId: new mongoose.Types.ObjectId(user.sub),
    isRead: false,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  });

  return successResponse({ count });
});
