import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { NotificationModel, type NotificationType } from '@/server/models/notification.model';
import { TaskModel } from '@/server/models/task.model';
import { generateScheduleNotifications } from '@/server/services/schedule-notifications';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import mongoose from 'mongoose';

// GET /api/v1/notifications
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  // Lazily materialise schedule-derived notifications (best-effort)
  try {
    await generateScheduleNotifications(user.sub);
  } catch (err) {
    console.error('[notifications] schedule generation failed', err);
  }

  const now = new Date();
  const notifications = await NotificationModel.find({
    userId: new mongoose.Types.ObjectId(user.sub),
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Backfill entityId for legacy "Quest Failed" notifications that were created
  // before entityId support was added. Parse task name from message, look up the
  // archived task, and persist the entityId so future clicks work correctly.
  const legacyFailed = notifications.filter(
    (n) => n.type === 'system' && !n.entityId && n.title === '☠ Quest Failed',
  );
  if (legacyFailed.length > 0) {
    await Promise.all(
      legacyFailed.map(async (n) => {
        const match = n.message?.match(/^"(.+)" was abandoned/);
        if (!match) return;
        const taskName = match[1];
        const task = await TaskModel.findOne({
          name: taskName,
          userId: n.userId,
          active: false,
        }).lean();
        if (!task) return;
        const entityId = task._id.toString();
        await NotificationModel.updateOne({ _id: n._id }, { $set: { entityId } });
        n.entityId = entityId;
      }),
    );
  }

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
    entityId?: string;
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
    entityId: body.entityId,
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
