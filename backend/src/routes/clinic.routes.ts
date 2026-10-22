import { Router } from 'express';
import { ClinicService } from '../services/clinic.service.js';
import { ActivityService } from '../services/activity.service.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { resolveClinicContext } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { prisma, ClinicStatus } from '../config/prisma.js';
import { createClinicSchema, updateClinicSchema, updateClinicSettingsSchema, createBranchSchema, createUserSchema, ROLES } from '../types/index.js';

export const clinicRouter = Router();

clinicRouter.get('/public', async (_req, res, next) => {
  try {
    const clinics = await prisma.clinic.findMany({
      where: { status: ClinicStatus.ACTIVE },
      select: { id: true, name: true, slug: true, address: true, phone: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: clinics });
  } catch (err) {
    next(err);
  }
});

clinicRouter.post('/', validateBody(createClinicSchema), async (req, res, next) => {
  try {
    const result = await ClinicService.registerClinic(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

clinicRouter.get('/current', requireAuthenticatedUser, resolveClinicContext, async (req, res, next) => {
  try {
    const clinic = await ClinicService.getClinic(req.clinicId!);
    res.json({ success: true, data: clinic });
  } catch (err) {
    next(err);
  }
});

clinicRouter.patch(
  '/current',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN),
  validateBody(updateClinicSchema),
  async (req, res, next) => {
    try {
      const updated = await ClinicService.updateClinic(req.clinicId!, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.get(
  '/current/settings',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  async (req, res, next) => {
    try {
      const settings = await ClinicService.getSettings(req.clinicId!);
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.patch(
  '/current/settings',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN),
  validateBody(updateClinicSettingsSchema),
  async (req, res, next) => {
    try {
      const updated = await ClinicService.updateSettings(req.clinicId!, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.get(
  '/current/members',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  async (req, res, next) => {
    try {
      const members = await ClinicService.listMembers(req.clinicId!);
      res.json({ success: true, data: members });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.post(
  '/current/users',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  validateBody(createUserSchema),
  async (req, res, next) => {
    try {
      const member = await ClinicService.createUser(req.clinicId!, req.body);
      res.status(201).json({ success: true, data: member });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.post(
  '/current/members',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  validateBody(createUserSchema),
  async (req, res, next) => {
    try {
      const member = await ClinicService.createUser(req.clinicId!, req.body);
      res.status(201).json({ success: true, data: member });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.patch(
  '/current/members/:memberId',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  async (req, res, next) => {
    try {
      const updated = await ClinicService.updateMemberRole(
        req.clinicId!,
        req.params.memberId,
        req.body.role,
        req.body.status,
        req.body.department,
        req.body.fullName,
        req.body.phone,
        req.body.specialty,
        req.user?.userId,
        req.membership?.role
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.delete(
  '/current/members/:memberId',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  async (req, res, next) => {
    try {
      await ClinicService.removeMember(
        req.clinicId!,
        req.params.memberId,
        req.user?.userId,
        req.membership?.role
      );
      res.json({ success: true, message: 'Member removed from hospital.' });
    } catch (err) {
      next(err);
    }
  }
);

// Today's hospital activity logs from DB
clinicRouter.get(
  '/current/today-activities',
  requireAuthenticatedUser,
  resolveClinicContext,
  async (req, res, next) => {
    try {
      const activities = await ActivityService.getTodayActivities(req.clinicId!);
      res.json({ success: true, data: activities });
    } catch (err) {
      next(err);
    }
  }
);

// Record daily hospital activity in DB
clinicRouter.post(
  '/current/activities',
  requireAuthenticatedUser,
  resolveClinicContext,
  async (req, res, next) => {
    try {
      const activity = await ActivityService.log({
        clinicId: req.clinicId!,
        actorId: req.user?.userId,
        actorRole: req.membership?.role,
        action: req.body.action || 'DAILY_ACTIVITY',
        resourceType: req.body.resourceType || 'HOSPITAL',
        resourceId: req.body.resourceId,
        description: req.body.description || 'Hospital daily activity logged',
        metadata: req.body.metadata,
      });
      res.status(201).json({ success: true, data: activity });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.get(
  '/current/audit-logs',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { clinicId: req.clinicId! },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.get(
  '/current/subscription',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN),
  async (req, res, next) => {
    try {
      const [sub, doctorCount, branchCount, memberCount] = await Promise.all([
        prisma.subscription.findFirst({
          where: { clinicId: req.clinicId! },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.doctorProfile.count({ where: { clinicId: req.clinicId!, isActive: true } }),
        prisma.branch.count({ where: { clinicId: req.clinicId!, isActive: true } }),
        prisma.clinicMembership.count({ where: { clinicId: req.clinicId!, status: 'ACTIVE' } }),
      ]);

      res.json({
        success: true,
        data: {
          subscription: sub || {
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            plan: {
              name: 'Enterprise Clinic Pro',
              maxDoctors: 25,
              maxBranches: 10,
              maxStaff: 50,
              priceMonthly: 199.0,
            },
          },
          usage: {
            doctors: doctorCount,
            branches: branchCount,
            staff: memberCount,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.get(
  '/current/branches',
  requireAuthenticatedUser,
  resolveClinicContext,
  async (req, res, next) => {
    try {
      const branches = await ClinicService.listBranches(req.clinicId!);
      res.json({ success: true, data: branches });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.post(
  '/current/branches',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validateBody(createBranchSchema),
  async (req, res, next) => {
    try {
      const branch = await ClinicService.createBranch(req.clinicId!, req.body);
      res.status(201).json({ success: true, data: branch });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.patch(
  '/current/branches/:branchId',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  async (req, res, next) => {
    try {
      const updated = await ClinicService.updateBranch(req.clinicId!, req.params.branchId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

clinicRouter.delete(
  '/current/branches/:branchId',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN),
  async (req, res, next) => {
    try {
      await ClinicService.deleteBranch(req.clinicId!, req.params.branchId);
      res.json({ success: true, message: 'Branch deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
);


