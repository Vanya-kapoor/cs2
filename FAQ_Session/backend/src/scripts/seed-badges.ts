import mongoose from 'mongoose';
import 'dotenv/config';
import { env } from '../config/env';
import { BadgeModel } from '../modules/badge/badge.model';
import { BadgeCategory } from '../modules/badge/badge.interface';
import { logger } from '../core/utils/logger';

const badges = [
  // Contribution Badges
  { name: 'First Approved Answer', description: 'Earned when a user\'s first reply gets approved.', icon: '🏆', category: BadgeCategory.CONTRIBUTION, criteria: 1 },
  { name: 'Rising Contributor', description: 'Earned after 5 approved replies.', icon: '🌟', category: BadgeCategory.CONTRIBUTION, criteria: 5 },
  { name: 'FAQ Contributor', description: 'Earned after 10 approved replies.', icon: '💡', category: BadgeCategory.CONTRIBUTION, criteria: 10 },
  { name: 'Community Helper', description: 'Earned after 25 approved replies.', icon: '🤝', category: BadgeCategory.CONTRIBUTION, criteria: 25 },
  { name: 'Knowledge Champion', description: 'Earned after 50 approved replies.', icon: '👑', category: BadgeCategory.CONTRIBUTION, criteria: 50 },

  // Query Badges
  { name: 'Curious Mind', description: 'Raised first genuine query.', icon: '🤔', category: BadgeCategory.QUERY, criteria: 1 },
  { name: 'Active Learner', description: 'Raised 5 queries.', icon: '📚', category: BadgeCategory.QUERY, criteria: 5 },
  { name: 'Knowledge Seeker', description: 'Raised 20 queries.', icon: '🔍', category: BadgeCategory.QUERY, criteria: 20 },

  // Resolution Badges
  { name: 'First Query Resolved', description: 'A query created by the user gets resolved for the first time.', icon: '✅', category: BadgeCategory.RESOLUTION, criteria: 1 },
  { name: 'Problem Solver', description: '10 queries raised by the user have been resolved.', icon: '🛠️', category: BadgeCategory.RESOLUTION, criteria: 10 },
  { name: 'Community Impact', description: '25 queries raised by the user have been resolved.', icon: '💥', category: BadgeCategory.RESOLUTION, criteria: 25 },
];

async function seed() {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('Connected to MongoDB for seeding.');

    for (const badge of badges) {
      await BadgeModel.findOneAndUpdate(
        { name: badge.name },
        badge,
        { upsert: true, new: true }
      );
    }
    logger.info('Badges seeded successfully.');
  } catch (error) {
    logger.error('Error seeding badges:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
  }
}

seed();
