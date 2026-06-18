import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { uploadAvatarToCloudinary } from '@/libs/cloudinary';
import { UserModel } from '@/server/models/user.model';
import { asyncHandler, successResponse, unauthorizedResponse, errorResponse } from '@/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const POST = asyncHandler(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') return errorResponse('No file provided', 400);
  if (!ALLOWED_TYPES.includes(file.type)) return errorResponse('Invalid file type', 400);
  if (file.size > MAX_SIZE_BYTES) return errorResponse('File exceeds 5 MB limit', 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const avatarUrl = await uploadAvatarToCloudinary(buffer, authUser.sub);

  await connectDB();
  await UserModel.findByIdAndUpdate(authUser.sub, { avatar: avatarUrl });

  return successResponse({ avatar: avatarUrl }, 'Avatar updated');
});
