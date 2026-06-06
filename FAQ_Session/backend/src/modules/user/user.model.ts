import mongoose, { Schema } from 'mongoose';
import { IUser } from './user.interface';
import { Roles } from '../../core/constants/roles';

/**
 * Note: better-auth manages the "user" collection automatically.
 * This model is used for direct Mongoose queries (e.g. listing users, role updates).
 * The collection name "user" matches better-auth's default.
 */
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role: {
      type: String,
      enum: Object.values(Roles),
      default: Roles.STUDENT,
    },
    emailVerified: { type: Boolean, default: false },
    image: { type: String },
    badges: [
      {
        badgeId: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'user', // match better-auth collection
  },
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
