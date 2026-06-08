import { BaseRepository } from '../../core/base/BaseRepository';
import { QueryModel } from './query.model';
import { IQuery, QueryStatus } from './query.interface';
import { DatabaseError } from '../../core/errors';

export class QueryRepository extends BaseRepository<IQuery> {
  constructor() {
    super(QueryModel);
  }

  async findPaginated(skip: number, limit: number, status?: QueryStatus): Promise<IQuery[]> {
    try {
      const filter = status ? { status } : {};
      return await QueryModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (err) {
      throw new DatabaseError(`Failed to paginate queries: ${(err as Error).message}`);
    }
  }

  async countByStatus(status?: QueryStatus): Promise<number> {
    try {
      const filter = status ? { status } : {};
      return await QueryModel.countDocuments(filter).exec();
    } catch (err) {
      throw new DatabaseError(`Failed to count queries: ${(err as Error).message}`);
    }
  }

  async markResolved(id: string): Promise<IQuery | null> {
    try {
      return await QueryModel.findByIdAndUpdate(
        id,
        { status: 'resolved' },
        { new: true },
      ).exec();
    } catch (err) {
      throw new DatabaseError(`Failed to resolve query: ${(err as Error).message}`);
    }
  }

  async countByUserId(userId: string): Promise<number> {
    try {
      return await QueryModel.countDocuments({ createdBy: userId }).exec();
    } catch (err) {
      throw new DatabaseError(`Failed to count queries for user: ${(err as Error).message}`);
    }
  }

  async countResolvedByUserId(userId: string): Promise<number> {
    try {
      return await QueryModel.countDocuments({ createdBy: userId, status: 'resolved' }).exec();
    } catch (err) {
      throw new DatabaseError(`Failed to count resolved queries for user: ${(err as Error).message}`);
    }
  }
}
