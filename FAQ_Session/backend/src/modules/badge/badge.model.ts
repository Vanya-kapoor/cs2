import mongoose, { Schema } from 'mongoose';
import { IBadge, BadgeCategory } from './badge.interface';

const badgeSchema = new Schema<IBadge>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    category: {
      type: String,
      enum: Object.values(BadgeCategory),
      required: true,
    },
    criteria: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  },
);

export const BadgeModel = mongoose.model<IBadge>('Badge', badgeSchema);
