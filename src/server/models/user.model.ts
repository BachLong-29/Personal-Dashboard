import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type UserRole = 'admin' | 'user' | 'moderator';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'moderator'] satisfies UserRole[],
      default: 'user',
    },
    avatar: {
      type: String,
    },
  },
  { timestamps: true },
);

// Prevent re-compiling model on hot-reload in development
export const UserModel =
  (mongoose.models.User as mongoose.Model<IUser>) ?? mongoose.model<IUser>('User', userSchema);
