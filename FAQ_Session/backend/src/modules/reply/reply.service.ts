import { Types } from 'mongoose';
import { BaseService } from '../../core/base/BaseService';
import { ReplyRepository } from './reply.repository';
import { QueryRepository } from '../query/query.repository';
import { FaqRepository } from '../faq/faq.repository';
import { EmbeddingService } from '../faq/embedding.service';
import { IReply } from './reply.interface';
import { IFaq } from '../faq/faq.interface';
import { NotFoundError, BadRequestError } from '../../core/errors';
import { Messages } from '../../core/constants/messages';
import { CreateReplyDtoType } from './reply.dto';
import { BadgeService } from '../badge/badge.service';
import { BadgeRepository } from '../badge/badge.repository';
import { UserRepository } from '../user/user.repository';

export interface ApproveReplyResult {
  faq: IFaq;
  reply: IReply;
}

export class ReplyService extends BaseService {
  constructor(
    private readonly replyRepo: ReplyRepository,
    private readonly queryRepo: QueryRepository,
    private readonly faqRepo: FaqRepository,
    private readonly embeddingService: EmbeddingService,
  ) {
    super();
  }

  async getRepliesForQuery(queryId: string): Promise<IReply[]> {
    const query = await this.queryRepo.findById(queryId);
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);
    return this.replyRepo.findByQueryId(new Types.ObjectId(queryId));
  }

  async addReply(
    queryId: string,
    dto: CreateReplyDtoType,
    userId: Types.ObjectId,
  ): Promise<IReply> {
    const query = await this.queryRepo.findById(queryId);
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);

    if (query.status === 'resolved') {
      throw new BadRequestError(Messages.QUERY_ALREADY_RESOLVED);
    }

    return this.replyRepo.create({
      queryId: new Types.ObjectId(queryId),
      userId,
      content: dto.content,
      isApproved: false,
    });
  }

  /**
   * Admin approves a reply:
   *  1. Marks the reply as approved
   *  2. Generates embedding from query title + reply content
   *  3. Creates an FAQ entry linking back to the source query & reply
   *  4. Marks the parent query as resolved
   */
  async approveReply(replyId: string, adminId: Types.ObjectId): Promise<ApproveReplyResult> {
    const reply = await this.replyRepo.findById(replyId);
    if (!reply) throw new NotFoundError(Messages.REPLY_NOT_FOUND);

    if (reply.isApproved) {
      throw new BadRequestError(Messages.REPLY_ALREADY_APPROVED);
    }

    const query = await this.queryRepo.findById(reply.queryId.toString());
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);

    // Generate embedding from query title + approved reply content
    const embeddingText = this.embeddingService.buildEmbeddingText(
      query.title,
      reply.content,
    );
    const embedding = await this.embeddingService.createEmbedding(embeddingText);

    // Create the FAQ entry
    const faq = await this.faqRepo.create({
      question: query.title,
      answer: reply.content,
      embedding,
      createdBy: adminId,
      approvedBy: adminId,
      sourceQueryId: query._id as Types.ObjectId,
      approvedReplyId: reply._id as Types.ObjectId,
    });

    // Mark reply as approved & query as resolved
    const approvedReply = await this.replyRepo.markApproved(replyId);
    await this.queryRepo.markResolved(reply.queryId.toString());

    // Badge Evaluation
    const badgeService = new BadgeService(
      new BadgeRepository(),
      new UserRepository(),
      this.replyRepo,
      this.queryRepo
    );
    badgeService.evaluateContributionBadges(reply.userId.toString()).catch(console.error);
    if (query.createdBy) {
      badgeService.evaluateResolutionBadges(query.createdBy.toString()).catch(console.error);
    }

    return { faq, reply: approvedReply! };
  }
}
