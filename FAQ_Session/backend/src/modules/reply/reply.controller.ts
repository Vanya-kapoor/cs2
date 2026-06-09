import { Request, Response } from "express";
import { Types } from "mongoose";
import { BaseController } from "../../core/base/BaseController";
import { ReplyService } from "./reply.service";
import { ReplyRepository } from "./reply.repository";
import { QueryRepository } from "../query/query.repository";
import { FaqRepository } from "../faq/faq.repository";
import { EmbeddingService } from "../faq/embedding.service";
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

  constructor() {
    super();
    this.replyService = new ReplyService(
      new ReplyRepository(),
      new QueryRepository(),
      new FaqRepository(),
      new EmbeddingService(),
    );
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    // Authenticated users can reply to any open query
    // Route: POST /api/queries/:queryId/replies
    this.router.post(
      "/queries/:queryId/replies",
      requireAuth,
      validate(CreateReplyDto),
      asyncHandler(this.addReply.bind(this)),
    );

    //list all replies for a query
    // Route: GET /api/queries/:queryId/replies
    this.router.get(
      "/queries/:queryId/replies",
      asyncHandler(this.getReplies.bind(this)),
    );

    // Admin – approve a reply → creates FAQ entry
    // Route: POST /api/replies/:id/approve
    this.router.post(
      "/replies/:id/approve",
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.approveReply.bind(this)),
    );
    //Route: DELETE /api/replies/:id
    this.router.delete(
      "/replies/:id",
      requireAuth,
      asyncHandler(this.deleteReply.bind(this)),
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
    const result = await this.replyService.approveReply(replyId, adminId);
    sendSuccess(res, result, Messages.REPLY_APPROVED);
  }
  private async deleteReply(req: Request, res: Response): Promise<void> {
  const replyId = String(req.params['id']);
  const userId = new Types.ObjectId(req.user!.id);
  const userRole = req.user!.role;
  await this.replyService.deleteReply(replyId, userId, userRole);
  sendSuccess(res, null, 'Reply deleted successfully');
}
}
