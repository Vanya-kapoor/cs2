import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: 'REPLY' | 'APPROVAL' | 'FAQ' | 'BADGE' | 'SYSTEM';
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['REPLY', 'APPROVAL', 'FAQ', 'BADGE', 'SYSTEM'],
      required: true,
    },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
