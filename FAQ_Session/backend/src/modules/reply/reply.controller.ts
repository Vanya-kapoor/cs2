import { Request, Response } from "express";
import { Types } from "mongoose";
import { BaseController } from "../../core/base/BaseController";
import { ReplyService } from "./reply.service";
import { ReplyRepository } from "./reply.repository";
import { QueryRepository } from "../query/query.repository";
import { FaqRepository } from "../faq/faq.repository";
import { EmbeddingService } from "../faq/embedding.service";
import { QueryService } from "../query/query.service";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/middleware/validate.middleware";
import {
  requireAuth,
  requireRole,
} from "../../core/middleware/auth.middleware";
import { sendSuccess, sendCreated } from "../../core/utils/response";
import { Messages } from "../../core/constants/messages";
import { Roles } from "../../core/constants/roles";
import { CreateReplyDto } from "./reply.dto";

export class ReplyController extends BaseController {
  private readonly replyService: ReplyService;
  private readonly queryService: QueryService;

  constructor() {
    super();
    this.replyService = new ReplyService(
      new ReplyRepository(),
      new QueryRepository(),
      new FaqRepository(),
      new EmbeddingService(),
    );
    this.queryService = new QueryService(new QueryRepository());
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    // Authenticated users can reply to any open query
    this.router.post(
      "/queries/:queryId/replies",
      requireAuth,
      validate(CreateReplyDto),
      asyncHandler(this.addReply.bind(this)),
    );

    // List all replies for a query
    this.router.get(
      "/queries/:queryId/replies",
      asyncHandler(this.getReplies.bind(this)),
    );

    // Admin – approve a reply (marks query resolved; does NOT auto-create FAQ)
    this.router.post(
      "/replies/:id/approve",
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.approveReply.bind(this)),
    );

    // Delete a reply (owner or admin)
    this.router.delete(
      "/replies/:id",
      requireAuth,
      asyncHandler(this.deleteReply.bind(this)),
    );

    // Admin – list reported queries
    this.router.get(
      "/admin/reported-queries",
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.getReportedQueries.bind(this)),
    );

    // Admin – ignore reports on a query
    this.router.post(
      "/admin/reported-queries/:id/ignore",
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.ignoreReportedQuery.bind(this)),
    );

    // Admin – warn creator of query
    this.router.post(
      "/admin/reported-queries/:id/warn",
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.warnReportedQuery.bind(this)),
    );

    // Admin – penalize creator of query
    this.router.post(
      "/admin/reported-queries/:id/penalize",
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.penalizeReportedQuery.bind(this)),
    );

    // Admin – delete reported query
    this.router.delete(
      "/admin/reported-queries/:id",
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.deleteReportedQuery.bind(this)),
    );
  }

  private async addReply(req: Request, res: Response): Promise<void> {
    const queryId = String(req.params["queryId"]);
    const userId = new Types.ObjectId(req.user!.id);
    const reply = await this.replyService.addReply(queryId, req.body, userId);
    sendCreated(res, reply, Messages.REPLY_ADDED);
  }

  private async getReplies(req: Request, res: Response): Promise<void> {
    const queryId = String(req.params["queryId"]);
    const replies = await this.replyService.getRepliesForQuery(queryId);
    sendSuccess(res, replies, Messages.SUCCESS);
  }

  private async approveReply(req: Request, res: Response): Promise<void> {
    const replyId = String(req.params["id"]);
    const adminId = new Types.ObjectId(req.user!.id);
    const reply = await this.replyService.approveReply(replyId, adminId);
    sendSuccess(res, reply, Messages.REPLY_APPROVED);
  }

  private async deleteReply(req: Request, res: Response): Promise<void> {
    const replyId = String(req.params['id']);
    const userId = new Types.ObjectId(req.user!.id);
    const userRole = req.user!.role;
    await this.replyService.deleteReply(replyId, userId, userRole);
    sendSuccess(res, null, 'Reply deleted successfully');
  }

  private async getReportedQueries(req: Request, res: Response): Promise<void> {
    const queries = await this.queryService.getReportedQueries();
    sendSuccess(res, queries, Messages.SUCCESS);
  }

  private async ignoreReportedQuery(req: Request, res: Response): Promise<void> {
    const queryId = String(req.params['id']);
    await this.queryService.ignoreReports(queryId);
    sendSuccess(res, null, 'Reports ignored successfully');
  }

  private async warnReportedQuery(req: Request, res: Response): Promise<void> {
    const queryId = String(req.params['id']);
    await this.queryService.warnCreator(queryId);
    sendSuccess(res, null, 'Creator warned and query hidden successfully');
  }

  private async penalizeReportedQuery(req: Request, res: Response): Promise<void> {
    const queryId = String(req.params['id']);
    await this.queryService.penalizeCreator(queryId);
    sendSuccess(res, null, 'Creator penalized and query hidden successfully');
  }

  private async deleteReportedQuery(req: Request, res: Response): Promise<void> {
    const queryId = String(req.params['id']);
    await this.queryService.deleteQuery(queryId);
    sendSuccess(res, null, 'Reported query deleted successfully');
  }
}
