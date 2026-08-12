import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type UserRole = 'admin' | 'user' | 'moderator';
export type AuthProvider = 'local' | 'google';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  /** Required for provider === 'local' — absent for OAuth-only accounts */
  password?: string;
  provider: AuthProvider;
  /** Google `sub` claim — set when the account is linked to Google */
  googleId?: string;
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
      required: [
        function (this: IUser) {
          return this.provider === 'local';
        },
        'Password is required for local accounts',
      ],
    },
    provider: {
      type: String,
      enum: ['local', 'google'] satisfies AuthProvider[],
      default: 'local',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
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
