import type { NextRequest } from 'next/server';

import { verifyAccessToken, type AccessTokenPayload } from '@/libs/jwt';

export function getAuthUser(req: NextRequest): AccessTokenPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    return verifyAccessToken(authHeader.slice(7));
  } catch {
    return null;
  }
}
