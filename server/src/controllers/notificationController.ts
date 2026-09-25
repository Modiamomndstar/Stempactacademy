import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  getUserPreferences,
  updateUserPreferences,
  getNotificationDeliveryHistory,
} from '../services/notificationService.js';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const limit = parseInt(req.query.limit as string) || 25;
    const skip = parseInt(req.query.skip as string) || 0;
    const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
    const type = req.query.type as string | undefined;
    const relatedEntity = req.query.relatedEntity as string | undefined;

    const notifications = await getUserNotifications(req.user.id, limit, {
      isRead,
      type,
      relatedEntity,
      skip,
      limit,
    });
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

export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const preferences = await getUserPreferences(req.user.id);
    res.status(200).json({ success: true, data: preferences });
  } catch (error: any) {
    console.error('getPreferences error:', error);
    res.status(500).json({ message: 'Failed to fetch notification preferences' });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const updated = await updateUserPreferences(req.user.id, req.body);
    res.status(200).json({ success: true, message: 'Preferences updated successfully', data: updated });
  } catch (error: any) {
    console.error('updatePreferences error:', error);
    res.status(500).json({ message: 'Failed to update notification preferences' });
  }
};

export const getDeliveries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const limit = parseInt(req.query.limit as string) || 50;
    const deliveries = await getNotificationDeliveryHistory(req.user.id, limit);
    res.status(200).json({ success: true, data: deliveries });
  } catch (error: any) {
    console.error('getDeliveries error:', error);
    res.status(500).json({ message: 'Failed to fetch delivery audit history' });
  }
};
