import { Types } from 'mongoose';
import { BaseService } from '../../core/base/BaseService';
import { FaqRepository } from './faq.repository';
import { EmbeddingService } from './embedding.service';
import { NotFoundError, BadRequestError } from '../../core/errors';
import { Messages } from '../../core/constants/messages';
import { parsePagination, buildPaginatedResult } from '../../core/utils/pagination';
import { PaginatedResult, PaginationQuery } from '../../core/types/api.types';
import { IFaq } from './faq.interface';
import { CreateFaqDtoType, UpdateFaqDtoType } from './faq.dto';
import { ReplyRepository } from '../reply/reply.repository';
import { QueryRepository } from '../query/query.repository';

export class FaqService extends BaseService {
  constructor(
    private readonly faqRepo: FaqRepository,
    private readonly embeddingService: EmbeddingService,
  ) {
    super();
  }

  async getFaqs(query: PaginationQuery): 
  Promise<PaginatedResult<IFaq>> { 
    const { page, limit, skip } = parsePagination(query); 
    const [faqs, total] = await Promise.all([ 
      this.faqRepo.findPaginated(skip, limit), 
      this.faqRepo.countDocuments(), 
    ]); 
    return buildPaginatedResult(faqs, total, page, limit); 
  }

  async getFaqById(id: string): Promise<IFaq> {
    const faq = await this.faqRepo.findById(id);
    if (!faq) throw new NotFoundError(Messages.FAQ_NOT_FOUND);
    return faq;
  }

  /**
   * Admin directly adds an FAQ with both question and answer.
   * Embedding is auto-generated from the question + answer.
   * This path sets sourceQueryId = null (admin-authored, not from a query).
   */
  async createFaq(dto: CreateFaqDtoType, adminId: Types.ObjectId): Promise<IFaq> {
    const embeddingText = this.embeddingService.buildEmbeddingText(dto.question, dto.answer);
    const embedding = await this.embeddingService.createEmbedding(embeddingText);

    return this.faqRepo.create({
      question: dto.question,
      answer: dto.answer,
      embedding,
      createdBy: adminId,
      approvedBy: adminId,
      sourceQueryId: null,
      approvedReplyId: null,
    });
  }

  /**
   * Promotes a RESOLVED query's approved reply to a FAQ entry.
   * This is the explicit admin action separate from reply approval.
   * Guards:
   *  - query must exist and be resolved
   *  - query must have exactly one approved reply
   *  - no FAQ must already exist for this query
   */
  async promoteQueryToFaq(queryId: string, adminId: Types.ObjectId): Promise<IFaq> {
    const queryRepo = new QueryRepository();
    const replyRepo = new ReplyRepository();

    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError(Messages.QUERY_NOT_FOUND);

    if (query.status !== 'resolved') {
      throw new BadRequestError(Messages.QUERY_NOT_RESOLVED);
    }

    // Check no FAQ already linked
    const existing = await this.faqRepo.findBySourceQueryId(queryId);
    if (existing) {
      throw new BadRequestError(Messages.FAQ_ALREADY_EXISTS_FOR_QUERY);
    }

    // Find the approved reply
    const replies = await replyRepo.findByQueryId(new Types.ObjectId(queryId));
    const approvedReply = replies.find(r => r.isApproved);
    if (!approvedReply) {
      throw new BadRequestError(Messages.NO_APPROVED_REPLY);
    }

    const embeddingText = this.embeddingService.buildEmbeddingText(query.title, approvedReply.content);
    const embedding = await this.embeddingService.createEmbedding(embeddingText);

    return this.faqRepo.create({
      question: query.title,
      answer: approvedReply.content,
      embedding,
      createdBy: adminId,
      approvedBy: adminId,
      sourceQueryId: query._id as Types.ObjectId,
      approvedReplyId: approvedReply._id as Types.ObjectId,
    });
  }

  async updateFaq(faqId: string, dto: UpdateFaqDtoType, adminId: Types.ObjectId): Promise<IFaq> {
    const existing = await this.faqRepo.findById(faqId);
    if (!existing) throw new NotFoundError(Messages.FAQ_NOT_FOUND);

    const updateData: Partial<IFaq> = {};
    if (dto.question) updateData.question = dto.question;
    if (dto.answer) {
      updateData.answer = dto.answer;
      updateData.embedding = await this.embeddingService.createEmbedding(
        this.embeddingService.buildEmbeddingText(
          dto.question ?? existing.question,
          dto.answer,
        ),
      );
    }
    updateData.approvedBy = adminId;

    const updated = await this.faqRepo.updateById(faqId, updateData);
    return updated!;
  }

  async deleteFaq(faqId: string): Promise<void> {
    const faq = await this.faqRepo.findById(faqId);
    if (!faq) throw new NotFoundError(Messages.FAQ_NOT_FOUND);
    // Intentionally does NOT touch the linked query — it stays RESOLVED
    // with the approved reply pinned. Admin can re-promote later if needed.
    await this.faqRepo.deleteById(faqId);
  }
}
