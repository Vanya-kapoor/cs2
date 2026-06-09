import { Types } from "mongoose";
import { BaseRepository } from "../../core/base/BaseRepository";
import { ReplyModel } from "./reply.model";
import { IReply } from "./reply.interface";
import { DatabaseError } from "../../core/errors";
import "../user/user.model";

export class ReplyRepository extends BaseRepository<IReply> {
  constructor() {
    super(ReplyModel);
  }

  async findByQueryId(queryId: Types.ObjectId | string): Promise<IReply[]> {
    try {
      return await ReplyModel.find({ queryId })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .exec();
    } catch (err) {
      throw new DatabaseError(
        `Failed to find replies: ${(err as Error).message}`,
      );
    }
  }

  async findPendingByQueryId(
    queryId: Types.ObjectId | string,
  ): Promise<IReply[]> {
    try {
      return await ReplyModel.find({ queryId, isApproved: false })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .exec();
    } catch (err) {
      throw new DatabaseError(
        `Failed to find pending replies: ${(err as Error).message}`,
      );
    }
  }

  async markApproved(replyId: string): Promise<IReply | null> {
    try {
      return await ReplyModel.findByIdAndUpdate(
        replyId,
        { isApproved: true },
        { new: true },
      ).exec();
    } catch (err) {
      throw new DatabaseError(
        `Failed to approve reply: ${(err as Error).message}`,
      );
    }
  }

  async deleteManyByQueryId(queryId: Types.ObjectId | string): Promise<void> {
    try {
      await ReplyModel.deleteMany({ queryId }).exec();
    } catch (err) {
      throw new DatabaseError(
        `Failed to delete replies for query: ${(err as Error).message}`,
      );
    }
  }

  async countApprovedByUserId(userId: string | Types.ObjectId): Promise<number> {
    try {
      return await ReplyModel.countDocuments({ userId, isApproved: true }).exec();
    } catch (err) {
      throw new DatabaseError(
        `Failed to count approved replies for user: ${(err as Error).message}`,
      );
    }
  }
async deleteById(replyId: string): Promise<IReply | null> {
  return ReplyModel.findByIdAndDelete(replyId);
}
}
