import { Document, Types } from 'mongoose';

export interface IHashtag extends Document {
  _id: Types.ObjectId;
  name: string;           // e.g., 'stipend', 'projects', 'ppo'
  slug: string;           // e.g., 'stipend' (lowercase, URL-friendly)
  description?: string;
  faqCount: number;       // Number of FAQs tagged with this hashtag
  queryCount: number;     // Number of queries tagged with this hashtag
  createdAt: Date;
  updatedAt: Date;
}
