import { Request, Response } from 'express';
import { BaseController } from '../../core/base/BaseController';
import { NotificationService } from './notification.service';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { sendSuccess } from '../../core/utils/response';
import { Messages } from '../../core/constants/messages';

export class NotificationController extends BaseController {
  private notificationService: NotificationService;

  constructor() {
    super();
    this.notificationService = new NotificationService();
  }

  protected registerRoutes(): void {} // Implemented in router

  public getNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const notifications = await this.notificationService.getUserNotifications(userId);
    sendSuccess(res, notifications, Messages.SUCCESS);
  });

  public markAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const notification = await this.notificationService.markAsRead(id, userId);
    sendSuccess(res, notification, Messages.SUCCESS);
  });

  public markAllAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    await this.notificationService.markAllAsRead(userId);
    sendSuccess(res, null, Messages.SUCCESS);
  });

  public deleteNotification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = String(req.params.id);
    await this.notificationService.deleteNotification(id, userId);
    sendSuccess(res, null, Messages.SUCCESS);
  });

  public deleteAllNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    await this.notificationService.deleteAllNotifications(userId);
    sendSuccess(res, null, Messages.SUCCESS);
  });
}
