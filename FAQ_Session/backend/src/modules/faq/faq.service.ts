import { Types } from 'mongoose';
import { BaseService } from '../../core/base/BaseService';
import { FaqRepository } from './faq.repository';
import { EmbeddingService } from './embedding.service';
import { NotFoundError } from '../../core/errors';
import { Messages } from '../../core/constants/messages';
import { parsePagination, buildPaginatedResult } from '../../core/utils/pagination';
import { PaginatedResult, PaginationQuery } from '../../core/types/api.types';
import { IFaq } from './faq.interface';
import { CreateFaqDtoType, UpdateFaqDtoType } from './faq.dto';

export class FaqService extends BaseService {
  constructor(
    private readonly faqRepo: FaqRepository,
    private readonly embeddingService: EmbeddingService,
  ) {
    super();
  }

  async getFaqs(): Promise<PaginatedResult<IFaq>> {
    const faqs = await this.faqRepo.findAll();
  
    return {
      data: faqs,
      total: faqs.length,
      page: 1,
      limit: faqs.length,
      totalPages: 1,
    };
  }

  async getFaqById(id: string): Promise<IFaq> {
    const faq = await this.faqRepo.findById(id);
    if (!faq) throw new NotFoundError(Messages.FAQ_NOT_FOUND);
    return faq;
  }

  /**
   * Admin directly adds an FAQ with both question and answer.
   * Embedding is auto-generated from the question + answer.
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
    await this.faqRepo.deleteById(faqId);
  }
}
