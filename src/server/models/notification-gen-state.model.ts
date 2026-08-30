import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

/**
 * Tracks the last time schedule-derived notifications were generated for a
 * user — a persistent replacement for an in-memory throttle Map, which
 * doesn't survive across serverless instances. Deliberately its own tiny
 * collection (not a field on UserSetting) so claiming a generation slot never
 * touches a document any client re-syncs render state from.
 */
export interface INotificationGenState extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  lastGeneratedAt: Date;
}

const notificationGenStateSchema = new Schema<INotificationGenState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    lastGeneratedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false },
);

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).NotificationGenState;
}

export const NotificationGenStateModel =
  (mongoose.models.NotificationGenState as mongoose.Model<INotificationGenState>) ??
  mongoose.model<INotificationGenState>('NotificationGenState', notificationGenStateSchema);
