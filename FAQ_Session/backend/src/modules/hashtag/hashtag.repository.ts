import { BaseRepository } from '../../core/base/BaseRepository';
import { HashtagModel } from './hashtag.model';
import { IHashtag } from './hashtag.interface';
import { DatabaseError } from '../../core/errors';

export class HashtagRepository extends BaseRepository<IHashtag> {
  constructor() {
    super(HashtagModel);
  }

  async findBySlug(slug: string): Promise<IHashtag | null> {
    try {
      return await HashtagModel.findOne({ slug }).exec();
    } catch (err) {
      throw new DatabaseError(`Failed to find hashtag by slug: ${(err as Error).message}`);
    }
  }

  async findOrCreate(name: string, description?: string): Promise<IHashtag> {
    try {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      let hashtag = await HashtagModel.findOne({ slug }).exec();
      
      if (!hashtag) {
        hashtag = await HashtagModel.create({
          name: name.toLowerCase().trim(),
          slug,
          description,
        });
      }
      
      return hashtag;
    } catch (err) {
      throw new DatabaseError(`Failed to create or find hashtag: ${(err as Error).message}`);
    }
  }

  async incrementFaqCount(hashtagId: string, increment: number = 1): Promise<void> {
    try {
      await HashtagModel.findByIdAndUpdate(
        hashtagId,
        { $inc: { faqCount: increment } },
        { new: true },
      ).exec();
    } catch (err) {
      throw new DatabaseError(`Failed to increment FAQ count: ${(err as Error).message}`);
    }
  }

  async incrementQueryCount(hashtagId: string, increment: number = 1): Promise<void> {
    try {
      await HashtagModel.findByIdAndUpdate(
        hashtagId,
        { $inc: { queryCount: increment } },
        { new: true },
      ).exec();
    } catch (err) {
      throw new DatabaseError(`Failed to increment query count: ${(err as Error).message}`);
    }
  }

  async getAllWithCounts(): Promise<IHashtag[]> {
    try {
      return await HashtagModel.find()
        .sort({ faqCount: -1, queryCount: -1 })
        .exec();
    } catch (err) {
      throw new DatabaseError(`Failed to fetch all hashtags: ${(err as Error).message}`);
    }
  }

  async deleteUnused(): Promise<number> {
    try {
      const result = await HashtagModel.deleteMany({ faqCount: 0, queryCount: 0 }).exec();
      return result.deletedCount || 0;
    } catch (err) {
      throw new DatabaseError(`Failed to delete unused hashtags: ${(err as Error).message}`);
    }
  }
}
