import { Notification, INotification } from './notification.model';
import { emitToUser } from '../../core/socket/socket';
import { logger } from '../../core/utils/logger';

export class NotificationService {
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'REPLY' | 'APPROVAL' | 'FAQ' | 'BADGE' | 'SYSTEM';
    link?: string;
  }): Promise<INotification> {
    const notification = await Notification.create(data);
    
    // Emit real-time event
    emitToUser(data.userId, 'new_notification', notification);
    logger.info(`Notification created and emitted to user ${data.userId}`);
    
    return notification;
  }

  async getUserNotifications(userId: string): Promise<INotification[]> {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(100);
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndDelete({ _id: notificationId, userId });
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    await Notification.deleteMany({ userId });
  }
}
