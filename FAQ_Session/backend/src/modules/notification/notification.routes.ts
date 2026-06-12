import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.use(requireAuth);

router.get('/', controller.getNotifications);
router.patch('/read-all', controller.markAllAsRead);
router.patch('/:id/read', controller.markAsRead);

export default router;
