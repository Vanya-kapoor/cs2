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
import { ForbiddenError } from '../../core/errors';
import { NotificationService } from '../notification/notification.service';

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

    const reply = await this.replyRepo.create({
      queryId: new Types.ObjectId(queryId),
      userId,
      content: dto.content,
      isApproved: false,
    });

    const notificationService = new NotificationService();
    if (query.createdBy && query.createdBy.toString() !== userId.toString()) {
      notificationService.createNotification({
        userId: query.createdBy.toString(),
        title: 'New Reply',
        message: 'Someone has replied to your question.',
        type: 'REPLY',
        link: `/questions/${queryId}`,
      }).catch(console.error);
    }

    return reply;
  }

  async approveReply(replyId: string, adminId: Types.ObjectId): Promise<ApproveReplyResult> {
    const reply = await this.replyRepo.findById(replyId);
    if (!reply) throw new NotFoundError(Messages.REPLY_NOT_FOUND);

    if (reply.isApproved) {
      throw new BadRequestError(Messages.REPLY_ALREADY_APPROVED);
    }

    const query = await this.queryRepo.findById(reply.queryId.toString());
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);

    const embeddingText = this.embeddingService.buildEmbeddingText(
      query.title,
      reply.content,
    );
    const embedding = await this.embeddingService.createEmbedding(embeddingText);

    const faq = await this.faqRepo.create({
      question: query.title,
      answer: reply.content,
      embedding,
      createdBy: adminId,
      approvedBy: adminId,
      sourceQueryId: query._id as Types.ObjectId,
      approvedReplyId: reply._id as Types.ObjectId,
    });

    const approvedReply = await this.replyRepo.markApproved(replyId);
    await this.queryRepo.markResolved(reply.queryId.toString());

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

    const notificationService = new NotificationService();

    // Notify the replier — goes to the question to see their pinned answer
    notificationService.createNotification({
      userId: reply.userId.toString(),
      title: 'Reply Approved',
      message: 'Your reply has been approved by an admin!',
      type: 'APPROVAL',
      link: `/questions/${reply.queryId.toString()}`,
    }).catch(console.error);

    // Notify the question author — goes to the FAQ entry
    if (query.createdBy) {
      notificationService.createNotification({
        userId: query.createdBy.toString(),
        title: 'Question Marked as FAQ',
        message: 'Your question has been marked as a frequently asked question!',
        type: 'FAQ',
        link: `/faqs/${faq._id.toString()}`,
      }).catch(console.error);
    }

    return { faq, reply: approvedReply! };
  }

  async deleteReply(replyId: string, userId: Types.ObjectId, userRole: string): Promise<void> {
    const reply = await this.replyRepo.findById(replyId);
    if (!reply) throw new NotFoundError('Reply not found');

    const isOwner = reply.userId.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You can only delete your own replies');
    }

    await this.replyRepo.deleteById(replyId);
  }
}