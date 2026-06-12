import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { BaseController } from '../../core/base/BaseController';
import { FaqService } from './faq.service';
import { FaqRepository } from './faq.repository';
import { EmbeddingService } from './embedding.service';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { validate } from '../../core/middleware/validate.middleware';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';
import { sendSuccess, sendCreated, sendPaginated } from '../../core/utils/response';
import { Messages } from '../../core/constants/messages';
import { Roles } from '../../core/constants/roles';
import { CreateFaqDto, UpdateFaqDto } from './faq.dto';
import { PaginationQuery } from '../../core/types/api.types';

export class FaqController extends BaseController {
  private readonly faqService: FaqService;

  constructor() {
    super();
    this.faqService = new FaqService(new FaqRepository(), new EmbeddingService());
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    // Public – anyone can browse FAQs
    this.router.get('/', asyncHandler(this.getFaqs.bind(this)));
    this.router.get('/:id', asyncHandler(this.getFaqById.bind(this)));

    // Admin – directly create an FAQ (question + answer, no query/reply needed)
    this.router.post(
      '/',
      requireAuth,
      requireRole(Roles.ADMIN),
      validate(CreateFaqDto),
      asyncHandler(this.createFaq.bind(this)),
    );

    // Admin – update FAQ
    this.router.patch(
      '/:id',
      requireAuth,
      requireRole(Roles.ADMIN),
      validate(UpdateFaqDto),
      asyncHandler(this.updateFaq.bind(this)),
    );

    // Admin – delete FAQ
    this.router.delete(
      '/:id',
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.deleteFaq.bind(this)),
    );
  }

  private async getFaqs(req: Request, res: Response): Promise<void> {
    const result = await this.faqService.getFaqs();
    sendPaginated(res, result, Messages.SUCCESS);
  }

  private async getFaqById(req: Request, res: Response): Promise<void> {
    const faq = await this.faqService.getFaqById(String(req.params['id']));
    sendSuccess(res, faq, Messages.SUCCESS);
  }

  private async createFaq(req: Request, res: Response): Promise<void> {
    const adminId = new Types.ObjectId(req.user!.id);
    const faq = await this.faqService.createFaq(req.body, adminId);
    sendCreated(res, faq, Messages.FAQ_CREATED);
  }

  private async updateFaq(req: Request, res: Response): Promise<void> {
    const faqId = String(req.params['id']);
    const adminId = new Types.ObjectId(req.user!.id);
    const faq = await this.faqService.updateFaq(faqId, req.body, adminId);
    sendSuccess(res, faq, Messages.FAQ_UPDATED);
  }

  private async deleteFaq(req: Request, res: Response): Promise<void> {
    await this.faqService.deleteFaq(String(req.params['id']));
    sendSuccess(res, null, Messages.FAQ_DELETED);
  }
}
