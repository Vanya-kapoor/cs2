import { Request, Response } from 'express';
import { BaseController } from '../../core/base/BaseController';
import { HashtagService } from './hashtag.service';
import { HashtagRepository } from './hashtag.repository';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../core/utils/response';
import { Messages } from '../../core/constants/messages';
import { PaginationQuery } from '../../core/types/api.types';
import { parsePagination, buildPaginatedResult } from '../../core/utils/pagination';

export class HashtagController extends BaseController {
  private readonly hashtagService: HashtagService;

  constructor() {
    super();
    this.hashtagService = new HashtagService(new HashtagRepository());
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    // Public – list all hashtags with counts
    this.router.get('/', asyncHandler(this.getAllHashtags.bind(this)));

    // Public – search hashtags
    this.router.get('/search/:query', asyncHandler(this.searchHashtags.bind(this)));

    // Public – get hashtag by slug
    this.router.get('/:slug', asyncHandler(this.getHashtagBySlug.bind(this)));
  }

  private async getAllHashtags(req: Request, res: Response): Promise<void> {
    const query = req.query as PaginationQuery;
    const { page, limit, skip } = parsePagination(query);

    const allHashtags = await this.hashtagService.getAllHashtags();
    const paginatedHashtags = allHashtags.slice(skip, skip + limit);

    const result = buildPaginatedResult(paginatedHashtags, allHashtags.length, page, limit);
    sendPaginated(res, result, Messages.SUCCESS);
  }

  private async searchHashtags(req: Request, res: Response): Promise<void> {
    const query = String(req.params['query']);
    const hashtags = await this.hashtagService.searchHashtags(query);
    sendSuccess(res, hashtags, Messages.SUCCESS);
  }

  private async getHashtagBySlug(req: Request, res: Response): Promise<void> {
    const slug = String(req.params['slug']);
    const hashtag = await this.hashtagService.getHashtagBySlug(slug);
    sendSuccess(res, hashtag, Messages.SUCCESS);
  }
}
