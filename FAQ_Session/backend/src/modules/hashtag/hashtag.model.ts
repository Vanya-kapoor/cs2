import mongoose, { Schema } from 'mongoose';
import { IHashtag } from './hashtag.interface';

const hashtagSchema = new Schema<IHashtag>(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true },
    description: { type: String, default: '' },
    faqCount: { type: Number, default: 0 },
    queryCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Ensure name is lowercase and generate slug
hashtagSchema.pre('save', function () {
  this.name = this.name.toLowerCase().trim();
  this.slug = this.name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
});

export const HashtagModel = mongoose.model<IHashtag>('Hashtag', hashtagSchema);
