import { Request, Response } from 'express';
import { BaseController } from '../../core/base/BaseController';
import { AdminUserService } from './admin.service';
import { UserRepository } from '../user/user.repository';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { validate } from '../../core/middleware/validate.middleware';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';
import { sendSuccess } from '../../core/utils/response';
import { Messages } from '../../core/constants/messages';
import { Roles } from '../../core/constants/roles';
import { UpdateUserRoleDto } from './admin.dto';
import { BadRequestError } from '../../core/errors';

/**
 * Admin – user management:
 *   GET   /api/admin/users               – list users (admin)
 *   PATCH /api/admin/users/:id/role       – change a user's role (admin)
 *                                            also revokes the target user's
 *                                            sessions so the change is instant
 */
export class AdminUserController extends BaseController {
  private readonly adminUserService: AdminUserService;

  constructor() {
    super();
    this.adminUserService = new AdminUserService(new UserRepository());
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.router.get(
      '/users',
      requireAuth,
      requireRole(Roles.ADMIN),
      asyncHandler(this.listUsers.bind(this)),
    );

    this.router.patch(
      '/users/:id/role',
      requireAuth,
      requireRole(Roles.ADMIN),
      validate(UpdateUserRoleDto),
      asyncHandler(this.updateUserRole.bind(this)),
    );
  }

  private async listUsers(_req: Request, res: Response): Promise<void> {
    const users = await this.adminUserService.listUsers();
    sendSuccess(res, users, Messages.SUCCESS);
  }

  private async updateUserRole(req: Request, res: Response): Promise<void> {
    const targetUserId = String(req.params['id']);

    if (req.user!.id === targetUserId) {
      throw new BadRequestError('You cannot change your own role.');
    }

    const { role } = req.body;
    const updatedUser = await this.adminUserService.updateUserRole(req, targetUserId, role);
    sendSuccess(res, updatedUser, Messages.UPDATED);
  }
}
