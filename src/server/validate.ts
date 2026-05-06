import type { NextRequest } from 'next/server';
import { type ZodSchema, ZodError } from 'zod';

import { validationErrorResponse } from './response';

export async function validateBody<T>(req: NextRequest, schema: ZodSchema<T>) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.flatten().fieldErrors as Record<string, string[]>;
      return { data: null, error: validationErrorResponse(errors) };
    }
    return { data: null, error: validationErrorResponse({ _: ['Invalid request body'] }) };
  }
}

export function validateSearchParams<T>(searchParams: URLSearchParams, schema: ZodSchema<T>) {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const data = schema.parse(params);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.flatten().fieldErrors as Record<string, string[]>;
      return { data: null, error: validationErrorResponse(errors) };
    }
    return { data: null, error: validationErrorResponse({ _: ['Invalid query parameters'] }) };
  }
}
