import prisma from '../config/prisma.js';

export interface CreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  link?: string;
}

export const createNotification = async (payload: CreateNotificationPayload) => {
  try {
    return await prisma.notification.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'INFO',
        link: payload.link || null,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

export const getUserNotifications = async (userId: string, limit = 20) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

export const markNotificationAsRead = async (id: string, userId: string) => {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const getUnreadNotificationCount = async (userId: string) => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};
