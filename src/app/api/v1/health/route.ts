import { successResponse } from '@/server';

export const runtime = 'edge';

export async function GET() {
  return successResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
  });
}
