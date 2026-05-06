import { z } from 'zod';

import { asyncHandler, createdResponse } from '@/server';
import { validateBody } from '@/server/validate';
import { emailSchema, passwordSchema } from '@/libs/validations/common';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const POST = asyncHandler(async (req) => {
  const { data, error } = await validateBody(req, registerSchema);
  if (error) return error;

  // TODO: check duplicate email in DB and hash password
  const mockUser = {
    id: crypto.randomUUID(),
    email: data.email,
    name: data.name,
    role: 'user' as const,
  };

  return createdResponse(mockUser, 'Account created successfully');
});
