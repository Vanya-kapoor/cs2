import { Router } from 'express';
import { BadgeController } from './badge.controller';
import { BadgeService } from './badge.service';
import { BadgeRepository } from './badge.repository';
import { UserRepository } from '../user/user.repository';
import { ReplyRepository } from '../reply/reply.repository';
import { QueryRepository } from '../query/query.repository';
import { asyncHandler } from '../../core/utils/asyncHandler';
// Assuming auth middleware exists, we might need it for some routes
import { requireAuth } from '../../core/middleware/auth.middleware';

const badgeRepo = new BadgeRepository();
const userRepo = new UserRepository();
const replyRepo = new ReplyRepository();
const queryRepo = new QueryRepository();

export const badgeService = new BadgeService(badgeRepo, userRepo, replyRepo, queryRepo);
const badgeController = new BadgeController(badgeService);

const router = Router();

router.get('/', asyncHandler(badgeController.getAllBadges.bind(badgeController)));
router.get('/leaderboard', asyncHandler(badgeController.getLeaderboard.bind(badgeController)));
router.get('/users/:userId', asyncHandler(badgeController.getUserBadges.bind(badgeController)));
router.get('/stats/:userId', asyncHandler(badgeController.getUserStats.bind(badgeController)));

export default router;
