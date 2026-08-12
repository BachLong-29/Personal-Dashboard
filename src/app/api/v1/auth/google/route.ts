import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';

import { connectDB } from '@/libs/mongodb';
import { signAccessToken, signRefreshToken } from '@/libs/jwt';
import { UserModel } from '@/server/models/user.model';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Missing Google credential'),
});

function getClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not defined');
  return new OAuth2Client(clientId);
}

export const POST = asyncHandler(async (req) => {
  const { data, error } = await validateBody(req, googleLoginSchema);
  if (error) return error;

  const client = getClient();
  const ticket = await client
    .verifyIdToken({ idToken: data.credential, audience: process.env.GOOGLE_CLIENT_ID })
    .catch(() => null);
  const payload = ticket?.getPayload();
  if (!payload || !payload.email) return unauthorizedResponse('Invalid Google token');
  if (payload.email_verified === false) return unauthorizedResponse('Invalid Google token');

  await connectDB();

  const email = payload.email.toLowerCase();
  let user = await UserModel.findOne({ googleId: payload.sub });

  if (!user) {
    // No account linked to this Google sub yet — merge into an existing local
    // account with the same email, or create a fresh Google-only account.
    user = await UserModel.findOne({ email });
    if (user) {
      user.googleId = payload.sub;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      await user.save();
    } else {
      user = await UserModel.create({
        email,
        name: payload.name ?? email,
        provider: 'google',
        googleId: payload.sub,
        avatar: payload.picture,
      });
    }
  }

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
