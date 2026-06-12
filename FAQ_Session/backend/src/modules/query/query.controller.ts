import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { BaseController } from '../../core/base/BaseController';
import { QueryService, QueryPaginationQuery } from './query.service';
import { QueryRepository } from './query.repository';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { validate } from '../../core/middleware/validate.middleware';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';
import { sendSuccess, sendCreated, sendPaginated } from '../../core/utils/response';
import { Messages } from '../../core/constants/messages';
import { Roles } from '../../core/constants/roles';
import { CreateQueryDto, ReportQueryDto } from './query.dto';

export class QueryController extends BaseController {
  private readonly queryService: QueryService;

  constructor() {
    super();
    this.queryService = new QueryService(new QueryRepository());
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    // Public – any user (authenticated or not) can raise a query
    this.router.post('/', validate(CreateQueryDto), asyncHandler(this.createQuery.bind(this)));

    // list all queries with optional status filter
    this.router.get(
      '/',
      asyncHandler(this.getQueries.bind(this)),
    );

    // Admin – get single query
    this.router.get(
      '/:id',
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.getQueryById.bind(this)),
    );

    // Admin – delete a query
    this.router.delete(
      '/:id',
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.deleteQuery.bind(this)),
    );

    // Report a query
    this.router.post(
      '/:id/report',
      requireAuth,
      validate(ReportQueryDto),
      asyncHandler(this.reportQuery.bind(this)),
    );
  }

  private async createQuery(req: Request, res: Response): Promise<void> {
    // Attach userId only if the user happens to be authenticated
    const userId = req.user?.id ? new Types.ObjectId(req.user.id) : undefined;
    const query = await this.queryService.createQuery(req.body, userId);
    sendCreated(res, query, Messages.QUERY_CREATED);
  }

  private async getQueries(req: Request, res: Response): Promise<void> {
    const result = await this.queryService.getQueries(req.query as QueryPaginationQuery);
    sendPaginated(res, result, Messages.SUCCESS);
  }

  private async getQueryById(req: Request, res: Response): Promise<void> {
    const query = await this.queryService.getQueryById(String(req.params['id']));
    sendSuccess(res, query, Messages.SUCCESS);
  }

  private async deleteQuery(req: Request, res: Response): Promise<void> {
    await this.queryService.deleteQuery(String(req.params['id']));
    sendSuccess(res, null, Messages.QUERY_DELETED);
  }

  private async reportQuery(req: Request, res: Response): Promise<void> {
    const queryId = String(req.params['id']);
    const userId = String(req.user!.id);
    const { reason } = req.body;
    await this.queryService.reportQuery(queryId, userId, reason);
    sendSuccess(res, null, 'Query reported successfully');
  }
}
