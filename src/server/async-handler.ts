import type { NextRequest } from 'next/server';

import { errorResponse } from './response';

type RouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<Response>;

export function asyncHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      console.error('[API Error]', error);

      if (error instanceof Error) {
        return errorResponse(error.message, 500);
      }

      return errorResponse('Internal Server Error', 500);
    }
  };
}
