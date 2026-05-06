import { NextResponse } from 'next/server';

import type { ApiError, ApiResponse, PaginationMeta } from '@/types/api';

export function successResponse<T>(
  data: T,
  message = 'Success',
  meta?: PaginationMeta,
  status = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, message, data, ...(meta && { meta }) }, { status });
}

export function createdResponse<T>(data: T, message = 'Created successfully') {
  return successResponse(data, message, undefined, 201);
}

export function errorResponse(
  message: string,
  status = 500,
  errors?: Record<string, string[]>,
): NextResponse<ApiError> {
  return NextResponse.json({ success: false, message, ...(errors && { errors }) }, { status });
}

export function notFoundResponse(message = 'Resource not found') {
  return errorResponse(message, 404);
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = 'Forbidden') {
  return errorResponse(message, 403);
}

export function validationErrorResponse(errors: Record<string, string[]>) {
  return errorResponse('Validation error', 422, errors);
}
