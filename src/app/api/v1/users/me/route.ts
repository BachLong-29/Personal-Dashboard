import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { verifyAccessToken } from '@/libs/jwt';
import { UserModel } from '@/server/models/user.model';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';

export const GET = asyncHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return unauthorizedResponse();

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return unauthorizedResponse('Invalid or expired token');
  }

  await connectDB();

  const user = await UserModel.findById(payload.sub).select('-password');
  if (!user) return unauthorizedResponse('User not found');

  return successResponse({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
});
