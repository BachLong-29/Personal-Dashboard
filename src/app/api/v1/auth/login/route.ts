import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { connectDB } from '@/libs/mongodb';
import { signAccessToken, signRefreshToken } from '@/libs/jwt';
import { UserModel } from '@/server/models/user.model';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const POST = asyncHandler(async (req) => {
  const { data, error } = await validateBody(req, loginSchema);
  if (error) return error;

  await connectDB();

  const user = await UserModel.findOne({ email: data.email.toLowerCase() });
  if (!user) return unauthorizedResponse('Invalid credentials');

  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) return unauthorizedResponse('Invalid credentials');

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ sub: user._id.toString() });

  return successResponse(
    {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tokens: { accessToken, refreshToken },
    },
    'Login successful',
  );
});
