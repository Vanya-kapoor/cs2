import { Request, Response } from 'express';
import { BadgeService } from './badge.service';
import { sendSuccess } from '../../core/utils/response';
import { Messages } from '../../core/constants/messages';

export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  async getAllBadges(req: Request, res: Response): Promise<void> {
    const badges = await this.badgeService.getAllBadges();
    sendSuccess(res, badges, Messages.SUCCESS);
  }

  async getUserBadges(req: Request, res: Response): Promise<void> {
    const badges = await this.badgeService.getUserBadges(String(req.params['userId']));
    sendSuccess(res, badges, Messages.SUCCESS);
  }

  async getLeaderboard(req: Request, res: Response): Promise<void> {
    const leaderboard = await this.badgeService.getLeaderboard();
    sendSuccess(res, leaderboard, Messages.SUCCESS);
  }

  async getUserStats(req: Request, res: Response): Promise<void> {
    const stats = await this.badgeService.getUserStats(String(req.params['userId']));
    sendSuccess(res, stats, Messages.SUCCESS);
  }
}
