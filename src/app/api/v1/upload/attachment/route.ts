import type { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { asyncHandler, successResponse, unauthorizedResponse, errorResponse } from '@/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

async function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: 'attachments', public_id: publicId, overwrite: false, resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'));
          resolve(result.secure_url);
        },
      )
      .end(buffer);
  });
}

export const POST = asyncHandler(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') return errorResponse('No file provided', 400);
  if (!ALLOWED_TYPES.includes(file.type)) return errorResponse('Invalid file type', 400);
  if (file.size > MAX_SIZE_BYTES) return errorResponse('File exceeds 5 MB limit', 400);

  await connectDB();

  const buffer = Buffer.from(await file.arrayBuffer());
  const publicId = `${authUser.sub}_${Date.now()}`;
  const url = await uploadToCloudinary(buffer, publicId);

  return successResponse({ url }, 'Attachment uploaded');
});
