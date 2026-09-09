import prisma from '../config/prisma.js';

export interface AuditLogPayload {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const logAudit = async (payload: AuditLogPayload): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId || null,
        userName: payload.userName || null,
        userRole: payload.userRole || null,
        action: payload.action,
        resource: payload.resource,
        resourceId: payload.resourceId || null,
        previousValue: payload.previousValue ? JSON.stringify(payload.previousValue) : null,
        newValue: payload.newValue ? JSON.stringify(payload.newValue) : null,
        ipAddress: payload.ipAddress || null,
        userAgent: payload.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

export const fetchAuditLogs = async (options: {
  limit?: number;
  offset?: number;
  action?: string;
  resource?: string;
  search?: string;
}) => {
  const { limit = 50, offset = 0, action, resource, search } = options;

  const whereClause: any = {};
  if (action) whereClause.action = action;
  if (resource) whereClause.resource = resource;
  if (search) {
    whereClause.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { resource: { contains: search, mode: 'insensitive' } },
      { userName: { contains: search, mode: 'insensitive' } },
      { userRole: { contains: search, mode: 'insensitive' } },
      { resourceId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where: whereClause }),
  ]);

  return { logs, total };
};
