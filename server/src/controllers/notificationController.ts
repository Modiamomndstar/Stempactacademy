import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '../services/notificationService.js';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const limit = parseInt(req.query.limit as string) || 25;
    const notifications = await getUserNotifications(req.user.id, limit);
    const unreadCount = await getUnreadNotificationCount(req.user.id);

    res.status(200).json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('getNotifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    await markNotificationAsRead(id, req.user.id);
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('markRead error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    await markAllNotificationsAsRead(req.user.id);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('markAllRead error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};
