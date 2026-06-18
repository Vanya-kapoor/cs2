import mongoose, { Schema } from 'mongoose';
import { IQuery, QueryStatus } from './query.interface';

const querySchema = new Schema<IQuery>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved'] as QueryStatus[],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export const QueryModel = mongoose.model<IQuery>('Query', querySchema);
