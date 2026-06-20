import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type NotificationType =
  | 'planning'
  | 'monthly-plan'
  | 'reminder'
  | 'system'
  | 'reward'
  | 'deadline'
  | 'overload'
  | 'conflict';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  /** Idempotency key for engine-generated notifications (e.g. `overload:2026-06-19`) */
  dedupeKey?: string;
  /** Optional reference to an entity (e.g. task ObjectId as string) */
  entityId?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'planning',
        'monthly-plan',
        'reminder',
        'system',
        'reward',
        'deadline',
        'overload',
        'conflict',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    dedupeKey: {
      type: String,
    },
    entityId: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, dedupeKey: 1 }, { sparse: true });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Notification;
}

export const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<INotification>) ??
  mongoose.model<INotification>('Notification', notificationSchema);
