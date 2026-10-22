import { prisma } from '../config/prisma.js';

export interface LogActivityInput {
  clinicId?: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export class ActivityService {
  /**
   * Log any hospital activity into the database AuditLog table.
   */
  static async log(input: LogActivityInput) {
    try {
      if (!input.clinicId) return null;
      return await prisma.auditLog.create({
        data: {
          clinicId: input.clinicId,
          actorId: input.actorId || undefined,
          actorRole: input.actorRole || undefined,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId || undefined,
          metadata: {
            description: input.description,
            ...(input.metadata || {}),
          },
        },
      });
    } catch (e) {
      console.error('Failed to log activity to DB:', e);
      return null;
    }
  }

  /**
   * Retrieve today's activity logs from the database for the active hospital.
   */
  static async getTodayActivities(clinicId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayLogs = await prisma.auditLog.findMany({
      where: {
        clinicId,
        createdAt: { gte: startOfDay },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (todayLogs.length < 5) {
      // If early in the day or newly deployed, also fetch recent historical activities so the dashboard is informative
      const recentLogs = await prisma.auditLog.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      return recentLogs;
    }

    return todayLogs;
  }
}

