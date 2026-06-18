import { Document, Types } from 'mongoose';

export type QueryStatus = 'pending' | 'resolved';

export interface IQuery extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  createdBy?: Types.ObjectId | null; // null for unauthenticated users
  status: QueryStatus;
  createdAt: Date;
  updatedAt: Date;
}
