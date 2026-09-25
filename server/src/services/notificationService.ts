import prisma from '../config/prisma.js';
import { notificationDispatcher } from './notificationDispatcher.js';

export interface CreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  link?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
  expiresAt?: Date;
}

export interface NotificationQueryFilters {
  isRead?: boolean;
  type?: string;
  relatedEntity?: string;
  limit?: number;
  skip?: number;
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
        relatedEntity: payload.relatedEntity || null,
        relatedEntityId: payload.relatedEntityId || null,
        expiresAt: payload.expiresAt || null,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

export const getUserNotifications = async (userId: string, limit = 20, filters?: NotificationQueryFilters) => {
  const where: any = { userId };

  if (filters?.isRead !== undefined) {
    where.isRead = filters.isRead;
  }
  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.relatedEntity) {
    where.relatedEntity = filters.relatedEntity;
  }

  // Filter out expired notifications if expiresAt is set
  where.OR = [
    { expiresAt: null },
    { expiresAt: { gt: new Date() } },
  ];

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || limit,
    skip: filters?.skip || 0,
    include: {
      deliveries: {
        select: {
          id: true,
          channel: true,
          status: true,
          provider: true,
          sentAt: true,
        },
      },
    },
  });
};

export const markNotificationAsRead = async (id: string, userId: string) => {
  const now = new Date();
  return prisma.notification.updateMany({
    where: { id, userId },
    data: {
      isRead: true,
      readAt: now,
    },
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const now = new Date();
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      readAt: now,
    },
  });
};

export const getUnreadNotificationCount = async (userId: string) => {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });
};

export const getUserPreferences = async (userId: string) => {
  return notificationDispatcher.getOrCreatePreferences(userId);
};

export const updateUserPreferences = async (
  userId: string,
  data: Partial<{
    emailEnabled: boolean;
    inAppEnabled: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    academicAlerts: boolean;
    billingAlerts: boolean;
    marketingAlerts: boolean;
  }>
) => {
  return notificationDispatcher.updatePreferences(userId, data);
};

export const getNotificationDeliveryHistory = async (userId: string, limit = 50) => {
  return prisma.notificationDelivery.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};
