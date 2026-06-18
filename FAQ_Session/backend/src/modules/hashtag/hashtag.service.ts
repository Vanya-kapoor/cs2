import { Types } from 'mongoose';
import { BaseService } from '../../core/base/BaseService';
import { HashtagRepository } from './hashtag.repository';
import { IHashtag } from './hashtag.interface';
import { NotFoundError } from '../../core/errors';

export class HashtagService extends BaseService {
  constructor(private readonly hashtagRepo: HashtagRepository) {
    super();
  }

  /**
   * Extract hashtags from text (e.g., "#stipend #ppo" or "stipend ppo")
   */
  async extractHashtags(text: string): Promise<IHashtag[]> {
    const hashtagRegex = /#\w+/g;
    const matches = text.match(hashtagRegex) || [];
    
    const uniqueNames = [...new Set(
      matches.map(m => m.replace('#', '').toLowerCase())
    )];

    const hashtags: IHashtag[] = [];
    for (const name of uniqueNames) {
      const hashtag = await this.hashtagRepo.findOrCreate(name);
      hashtags.push(hashtag);
    }

    return hashtags;
  }

  /**
   * Get or create hashtags from a list of names
   */
  async getOrCreateHashtags(names: string[]): Promise<IHashtag[]> {
    const uniqueNames = [...new Set(names.map(n => n.toLowerCase().trim()))];
    
    const hashtags: IHashtag[] = [];
    for (const name of uniqueNames) {
      const hashtag = await this.hashtagRepo.findOrCreate(name);
      hashtags.push(hashtag);
    }

    return hashtags;
  }

  /**
   * Get all hashtags sorted by usage
   */
  async getAllHashtags(limit?: number): Promise<IHashtag[]> {
    const hashtags = await this.hashtagRepo.getAllWithCounts();
    return limit ? hashtags.slice(0, limit) : hashtags;
  }

  /**
   * Get hashtag by slug
   */
  async getHashtagBySlug(slug: string): Promise<IHashtag> {
    const hashtag = await this.hashtagRepo.findBySlug(slug);
    if (!hashtag) {
      throw new NotFoundError(`Hashtag not found: #${slug}`);
    }
    return hashtag;
  }

  /**
   * Search hashtags by name
   */
  async searchHashtags(query: string): Promise<IHashtag[]> {
    const cleanQuery = query.toLowerCase().replace('#', '').trim();
    const hashtags = await this.hashtagRepo.find({ 
      name: { $regex: cleanQuery, $options: 'i' } 
    });
    return hashtags.sort((a, b) => (b.faqCount + b.queryCount) - (a.faqCount + a.queryCount));
  }

  /**
   * Increment FAQ count for hashtag
   */
  async incrementFaqCount(hashtagId: string, increment: number = 1): Promise<void> {
    await this.hashtagRepo.incrementFaqCount(hashtagId, increment);
  }

  /**
   * Increment query count for hashtag
   */
  async incrementQueryCount(hashtagId: string, increment: number = 1): Promise<void> {
    await this.hashtagRepo.incrementQueryCount(hashtagId, increment);
  }

  /**
   * Clean up unused hashtags
   */
  async cleanupUnused(): Promise<number> {
    return this.hashtagRepo.deleteUnused();
  }
}
