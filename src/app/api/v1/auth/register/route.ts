import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { connectDB } from '@/libs/mongodb';
import { UserModel } from '@/server/models/user.model';
import { asyncHandler, createdResponse, errorResponse } from '@/server';
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

  await connectDB();

  const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
  if (existing) return errorResponse('Email already registered', 409);

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await UserModel.create({
    email: data.email.toLowerCase(),
    name: data.name,
    password: hashedPassword,
  });

  return createdResponse(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    'Account created successfully',
  );
});
