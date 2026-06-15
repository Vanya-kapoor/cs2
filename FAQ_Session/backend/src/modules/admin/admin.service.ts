import { fromNodeHeaders } from 'better-auth/node';
import { Request } from 'express';
import { BaseService } from '../../core/base/BaseService';
import { UserRepository } from '../user/user.repository';
import { IUser } from '../user/user.interface';
import { NotFoundError } from '../../core/errors';
import { Messages } from '../../core/constants/messages';
import { Role } from '../../core/constants/roles';
import { getAuth } from '../../config/auth';

export class AdminUserService extends BaseService {
  constructor(private readonly userRepo: UserRepository) {
    super();
  }

  async listUsers(): Promise<IUser[]> {
    return this.userRepo.find();
  }

  /**
   * Updates a user's role and immediately revokes all of their active
   * sessions so the change takes effect right away.
   *
   * Without this, a user who is demoted (or promoted) while logged in keeps
   * acting on a cached session/cookie that still has their old role —
   * better-auth's session cookie cache (and the underlying session record)
   * won't reflect the new role until it naturally expires. Revoking their
   * sessions forces a fresh `getSession` lookup (and re-login) on their next
   * request, so admin checks see the up-to-date role/emailVerified status.
   */
  async updateUserRole(req: Request, userId: string, role: Role): Promise<IUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError(Messages.NOT_FOUND);

    const updatedUser = await this.userRepo.updateById(userId, { role });
    if (!updatedUser) throw new NotFoundError(Messages.NOT_FOUND);

    // Revoke all existing sessions for this user via better-auth's admin
    // plugin. This is what makes role changes (promotion or demotion)
    // instant for an already-logged-in user instead of waiting for their
    // session/cookie cache to expire.
    try {
      await getAuth().api.revokeUserSessions({
        body: { userId },
        headers: fromNodeHeaders(req.headers),
      });
    } catch (err) {
      // Don't fail the whole role-update if session revocation has an
      // issue (e.g. the user has no active sessions) — the role change
      // itself has already been persisted.
      this.logger.warn(`Failed to revoke sessions for user ${userId}`, {
        error: (err as Error).message,
      });
    }

    return updatedUser;
  }
}
