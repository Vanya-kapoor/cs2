import { BaseRepository } from '../../core/base/BaseRepository';
import { FaqModel } from './faq.model';
import { IFaq, IVectorSearchResult } from './faq.interface';
import { DatabaseError } from '../../core/errors';

export class FaqRepository extends BaseRepository<IFaq> {
  constructor() {
    super(FaqModel);
  }

  /**
   * 🔥 Get ALL FAQs (no limit, no sort, no skip)
   */
  async findAll(): Promise<IFaq[]> {
    try {
      return await FaqModel.find()
        .select('question answer createdBy approvedBy sourceQueryId createdAt')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .lean(); // faster, returns plain JS objects
    } catch (err) {
      throw new DatabaseError(`Failed to fetch all FAQs: ${(err as Error).message}`);
    }
  }

  /**
   * (Optional) Keep paginated version if needed later
   */
  async findPaginated(skip: number, limit: number): Promise<IFaq[]> {
    try {
      return await FaqModel.find()
        .select('question answer createdBy approvedBy sourceQueryId createdAt')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (err) {
      throw new DatabaseError(`Failed to paginate FAQs: ${(err as Error).message}`);
    }
  }

  /**
   * 🔍 Vector search (unchanged)
   */
  async vectorSearch(queryEmbedding: number[]): Promise<IVectorSearchResult[]> {
    try {
      return await FaqModel.aggregate<IVectorSearchResult>([
        {
          $vectorSearch: {
            index: 'faq-vector-index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 20,
            limit: 5,
          },
        },
        { $match: { answer: { $ne: '' } } },
        {
          $project: {
            question: 1,
            answer: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]);
    } catch (err) {
      throw new DatabaseError(`Vector search failed: ${(err as Error).message}`);
    }
  }
}