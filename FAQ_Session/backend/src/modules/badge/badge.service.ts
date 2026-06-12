import { Types } from 'mongoose';
import { BaseService } from '../../core/base/BaseService';
import { BadgeRepository } from './badge.repository';
import { UserRepository } from '../user/user.repository';
import { ReplyRepository } from '../reply/reply.repository';
import { QueryRepository } from '../query/query.repository';
import { BadgeCategory, IBadge } from './badge.interface';
import { UserModel } from '../user/user.model';
import { ReplyModel } from '../reply/reply.model';
import { NotificationService } from '../notification/notification.service';


export class BadgeService extends BaseService {
  constructor(
    private readonly badgeRepo: BadgeRepository,
    private readonly userRepo: UserRepository,
    private readonly replyRepo: ReplyRepository,
    private readonly queryRepo: QueryRepository,
  ) {
    super();
  }

  async getAllBadges(): Promise<IBadge[]> {
    return this.badgeRepo.find({});
  }

  async getUserBadges(userId: string): Promise<any[]> {
    const user = await UserModel.findById(userId).populate('badges.badgeId').exec();
    if (!user) return [];
    return user.badges;
  }

  private async awardBadges(userId: string, currentCount: number, category: BadgeCategory) {
    const badges = await this.badgeRepo.findByCategory(category);
    const user = await this.userRepo.findById(userId);
    if (!user) return;

    const userBadgeIds = user.badges.map(b => b.badgeId.toString());

    for (const badge of badges) {
      if (currentCount >= badge.criteria && !userBadgeIds.includes(badge._id.toString())) {
        await this.userRepo.addBadgeToUser(userId, badge._id.toString());
        
        const notificationService = new NotificationService();
        notificationService.createNotification({
          userId,
          title: 'New Badge Earned!',
          message: `Congratulations! You earned the "${badge.name}" badge.`,
          type: 'BADGE',
          link: '/profile/badges'
        }).catch(console.error);
      }
    }
  }

  async evaluateContributionBadges(userId: string): Promise<void> {
    const count = await this.replyRepo.countApprovedByUserId(userId);
    await this.awardBadges(userId, count, BadgeCategory.CONTRIBUTION);
  }

  async evaluateQueryBadges(userId: string): Promise<void> {
    const count = await this.queryRepo.countByUserId(userId);
    await this.awardBadges(userId, count, BadgeCategory.QUERY);
  }

  async evaluateResolutionBadges(userId: string): Promise<void> {
    const count = await this.queryRepo.countResolvedByUserId(userId);
    await this.awardBadges(userId, count, BadgeCategory.RESOLUTION);
  }

  async getLeaderboard(): Promise<any[]> {
    // Leaderboard logic based on highest approved replies.
    // Using aggregation to compute dynamically.
    const topContributors = await ReplyModel.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: '$userId', approvedCount: { $sum: 1 } } },
      { $sort: { approvedCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'user',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          image: '$user.image',
          approvedCount: 1,
        },
      },
    ]);

    return topContributors;
  }

  async getUserStats(userId: string): Promise<any> {
    const approvedReplies = await this.replyRepo.countApprovedByUserId(userId);
    const totalQueries = await this.queryRepo.countByUserId(userId);
    const resolvedQueries = await this.queryRepo.countResolvedByUserId(userId);
    const totalReplies = await ReplyModel.countDocuments({ userId }).exec();
    const approvalRate = totalReplies > 0 ? (approvedReplies / totalReplies) * 100 : 0;

    return {
      approvedReplies,
      totalQueries,
      resolvedQueries,
      totalReplies,
      approvalRate,
    };
  }
}
