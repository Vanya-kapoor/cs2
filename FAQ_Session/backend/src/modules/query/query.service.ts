import { Types } from 'mongoose';
import { BaseService } from '../../core/base/BaseService';
import { QueryRepository } from './query.repository';
import { IQuery, QueryStatus } from './query.interface';
import { NotFoundError, BadRequestError } from '../../core/errors';
import { Messages } from '../../core/constants/messages';
import { parsePagination, buildPaginatedResult } from '../../core/utils/pagination';
import { PaginatedResult } from '../../core/types/api.types';
import { CreateQueryDtoType } from './query.dto';
import { BadgeService } from '../badge/badge.service';
import { BadgeRepository } from '../badge/badge.repository';
import { UserRepository } from '../user/user.repository';
import { ReplyRepository } from '../reply/reply.repository';
import { ReportModel } from './report.model';
import { UserModel } from '../user/user.model';

export interface QueryPaginationQuery {
  page?: string;
  limit?: string;
  status?: QueryStatus;
}

export class QueryService extends BaseService {
  constructor(private readonly queryRepo: QueryRepository) {
    super();
  }

  async getQueries(query: QueryPaginationQuery): Promise<PaginatedResult<IQuery>> {
    const { page, limit, skip } = parsePagination(query);
    const [queries, total] = await Promise.all([
      this.queryRepo.findPaginated(skip, limit, query.status),
      this.queryRepo.countByStatus(query.status),
    ]);
    return buildPaginatedResult(queries, total, page, limit);
  }

  async getQueryById(id: string): Promise<IQuery> {
    const query = await this.queryRepo.findById(id);
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);
    return query;
  }

  async createQuery(dto: CreateQueryDtoType, userId?: Types.ObjectId): Promise<IQuery> {
    const query = await this.queryRepo.create({
      title: dto.title,
      description: dto.description,
      createdBy: userId ?? null,
      status: 'pending',
    });

    if (userId) {
      const badgeService = new BadgeService(
        new BadgeRepository(),
        new UserRepository(),
        new ReplyRepository(),
        this.queryRepo
      );
      badgeService.evaluateQueryBadges(userId.toString()).catch(console.error);
    }

    return query;
  }

  async reportQuery(queryId: string, userId: string, reason: string): Promise<void> {
    const query = await this.queryRepo.findById(queryId);
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);

    const existingReport = await ReportModel.findOne({ userId, queryId }).exec();
    if (existingReport) {
      throw new BadRequestError('You have already reported this query');
    }

    await ReportModel.create({
      userId,
      queryId,
      reason,
    });

    const reportCount = (query.reportCount || 0) + 1;
    const updateData: any = {
      reportCount,
      isReported: true,
    };
    if (reportCount >= 5) {
      updateData.needsAdminReview = true;
    }

    await this.queryRepo.updateById(queryId, updateData);
  }

  async deleteQuery(id: string): Promise<void> {
    const query = await this.queryRepo.findById(id);
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);
    await this.queryRepo.deleteById(id);
  }

  async getReportedQueries(): Promise<IQuery[]> {
    return this.queryRepo.findReported();
  }

  async ignoreReports(queryId: string): Promise<void> {
    const query = await this.queryRepo.findById(queryId);
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);

    await this.queryRepo.updateById(queryId, {
      reportCount: 0,
      isReported: false,
      needsAdminReview: false,
    });
  }

  async warnCreator(queryId: string): Promise<void> {
    const query = await this.queryRepo.findById(queryId);
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);

    if (query.createdBy) {
      await UserModel.findByIdAndUpdate(query.createdBy, { $inc: { warnings: 1 } }).exec();
    }

    await this.queryRepo.updateById(queryId, {
      reportCount: 0,
      isReported: false,
      needsAdminReview: false,
      isHidden: true,
    });
  }

  async penalizeCreator(queryId: string): Promise<void> {
    const query = await this.queryRepo.findById(queryId);
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);

    if (query.createdBy) {
      await UserModel.findByIdAndUpdate(query.createdBy, { $inc: { reputationPenalty: 50 } }).exec();
    }

    await this.queryRepo.updateById(queryId, {
      reportCount: 0,
      isReported: false,
      needsAdminReview: false,
      isHidden: true,
    });
  }
}
