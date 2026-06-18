import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReport extends Document {
  userId: Types.ObjectId;
  queryId: Types.ObjectId;
  reason: string;
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    queryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Query',
      required: true,
    },
    reason: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

// Enforce one report per user per query at database level
reportSchema.index({ userId: 1, queryId: 1 }, { unique: true });

export const ReportModel = mongoose.model<IReport>('Report', reportSchema);
