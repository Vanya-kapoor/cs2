import { Document, Types } from 'mongoose';

export type QueryStatus = 'pending' | 'resolved';

export interface IQuery extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  screenshot?: string | null; // base64 data URI or URL
  createdBy?: Types.ObjectId | null;
  status: QueryStatus;
  createdAt: Date;
  updatedAt: Date;
}
