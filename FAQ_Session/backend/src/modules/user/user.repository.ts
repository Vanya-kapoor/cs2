import { BaseRepository } from '../../core/base/BaseRepository';
import { UserModel } from './user.model';
import { IUser } from './user.interface';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  async addBadgeToUser(userId: string, badgeId: string): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { badges: { badgeId, earnedAt: new Date() } },
      },
      { new: true }
    ).exec();
  }
}
