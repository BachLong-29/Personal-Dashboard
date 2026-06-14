import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { NotificationModel, type NotificationType } from '@/server/models/notification.model';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import mongoose from 'mongoose';

// GET /api/v1/notifications
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const now = new Date();
  const notifications = await NotificationModel.find({
    userId: new mongoose.Types.ObjectId(user.sub),
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return successResponse(notifications);
});

// POST /api/v1/notifications
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const body = (await req.json()) as {
    type: NotificationType;
    title: string;
    message: string;
    expiresAt?: string;
  };

  // Server-side deduplicate: same type on same calendar day
  if (body.expiresAt) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const existing = await NotificationModel.findOne({
      userId: new mongoose.Types.ObjectId(user.sub),
      type: body.type,
      createdAt: { $gte: dayStart },
    });
    if (existing) {
      return successResponse(existing);
    }
  }

  const MAX_PER_USER = 20;
  const uid = new mongoose.Types.ObjectId(user.sub);

  const notification = await NotificationModel.create({
    userId: uid,
    type: body.type,
    title: body.title,
    message: body.message,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  });

  // Keep only the 20 most recent — delete anything beyond that
  const recent = await NotificationModel.find({ userId: uid })
    .sort({ createdAt: -1 })
    .limit(MAX_PER_USER)
    .select('_id')
    .lean();

  if (recent.length === MAX_PER_USER) {
    const keepIds = recent.map((n) => n._id);
    await NotificationModel.deleteMany({ userId: uid, _id: { $nin: keepIds } });
  }

  return createdResponse(notification);
});
