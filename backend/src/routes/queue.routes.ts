import { Router } from 'express';
import { QueueService } from '../services/queue.service.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { resolveClinicContext } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { prisma, QueueStatus } from '../config/prisma.js';
import {
  createQueueSessionSchema,
  createWalkInTicketSchema,
  transferTicketSchema,
  ROLES,
} from '../types/index.js';

export const queueRouter = Router();

queueRouter.get('/public-board/:clinicSlug', async (req, res, next) => {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { slug: req.params.clinicSlug },
      select: { id: true, name: true, slug: true },
    });

    if (!clinic) {
      return res.status(404).json({ success: false, error: { code: 'CLINIC_NOT_FOUND', message: 'Hospital facility not found.' } });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const sessions = await prisma.queueSession.findMany({
      where: { clinicId: clinic.id, operatingDate: todayStr, status: 'OPEN' },
      include: {
        branch: { select: { id: true, name: true } },
        doctor: { select: { id: true, fullName: true, specialty: true } },
        service: { select: { id: true, name: true } },
        queueTickets: {
          where: { status: { in: [QueueStatus.SERVING, QueueStatus.CALLED, QueueStatus.WAITING] } },
          select: {
            id: true,
            displayToken: true,
            status: true,
            priority: true,
            calledAt: true,
            serviceStartedAt: true,
          },
          orderBy: [{ priority: 'asc' }, { tokenNumber: 'asc' }],
        },
      },
    });

    res.json({
      success: true,
      data: {
        clinic,
        sessions: sessions.map((s) => ({
          sessionId: s.id,
          branchName: s.branch.name,
          doctorName: s.doctor?.fullName,
          serviceName: s.service?.name,
          servingToken: s.queueTickets.find((t) => t.status === QueueStatus.SERVING)?.displayToken || null,
          calledToken: s.queueTickets.find((t) => t.status === QueueStatus.CALLED)?.displayToken || null,
          waitingTokens: s.queueTickets
            .filter((t) => t.status === QueueStatus.WAITING)
            .slice(0, 10)
            .map((t) => t.displayToken),
          waitingCount: s.queueTickets.filter((t) => t.status === QueueStatus.WAITING).length,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

queueRouter.use(requireAuthenticatedUser, resolveClinicContext);

queueRouter.get('/sessions', async (req, res, next) => {
  try {
    const date = req.query.date as string | undefined;
    const sessions = await QueueService.listSessions(req.clinicId!, date);
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
});

queueRouter.post(
  '/sessions',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST),
  validateBody(createQueueSessionSchema),
  async (req, res, next) => {
    try {
      const session = await QueueService.getOrCreateDailySession(req.clinicId!, req.body);
      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }
);

queueRouter.get('/sessions/:sessionId', async (req, res, next) => {
  try {
    const session = await QueueService.getSessionById(req.clinicId!, req.params.sessionId);
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

queueRouter.post(
  ['/sessions/:sessionId/walk-in', '/sessions/:sessionId/tickets'],
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST),
  (req, _res, next) => {
    if (!req.body.queueSessionId && req.params.sessionId) {
      req.body.queueSessionId = req.params.sessionId;
    }
    next();
  },
  validateBody(createWalkInTicketSchema),
  async (req, res, next) => {
    try {
      const ticket = await QueueService.createWalkInTicket(req.clinicId!, req.user!.userId, req.body);
      res.status(201).json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }
);

queueRouter.post(
  '/tickets/:ticketId/call',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.RECEPTIONIST),
  async (req, res, next) => {
    try {
      const result = await QueueService.callTicket(req.clinicId!, req.params.ticketId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

queueRouter.post(
  '/tickets/:ticketId/recall',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.RECEPTIONIST),
  async (req, res, next) => {
    try {
      const result = await QueueService.recallTicket(req.clinicId!, req.params.ticketId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

queueRouter.post(
  '/tickets/:ticketId/start',
  requireRole(ROLES.ADMIN, ROLES.DOCTOR),
  async (req, res, next) => {
    try {
      const result = await QueueService.startService(req.clinicId!, req.params.ticketId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

queueRouter.post(
  '/tickets/:ticketId/complete',
  requireRole(ROLES.ADMIN, ROLES.DOCTOR),
  async (req, res, next) => {
    try {
      const result = await QueueService.completeService(req.clinicId!, req.params.ticketId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

queueRouter.post(
  '/tickets/:ticketId/skip',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.RECEPTIONIST),
  async (req, res, next) => {
    try {
      const result = await QueueService.skipTicket(req.clinicId!, req.params.ticketId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

queueRouter.post(
  '/tickets/:ticketId/requeue',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST),
  async (req, res, next) => {
    try {
      const result = await QueueService.requeueTicket(req.clinicId!, req.params.ticketId, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

queueRouter.post(
  '/tickets/:ticketId/transfer',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST),
  validateBody(transferTicketSchema),
  async (req, res, next) => {
    try {
      const result = await QueueService.transferTicket(
        req.clinicId!,
        req.params.ticketId,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

queueRouter.get('/tickets/:ticketId/wait-estimate', async (req, res, next) => {
  try {
    const estimate = await QueueService.calculateWaitEstimate(req.clinicId!, req.params.ticketId);
    res.json({ success: true, data: estimate });
  } catch (err) {
    next(err);
  }
});

queueRouter.post(
  '/tickets/:ticketId/cancel',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.PATIENT),
  async (req, res, next) => {
    try {
      if (req.membership?.role === ROLES.PATIENT && req.patientId) {
        const ticket = await prisma.queueTicket.findFirst({
          where: { id: req.params.ticketId, clinicId: req.clinicId! },
        });
        if (ticket && ticket.patientId !== req.patientId) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You can only cancel your own queue ticket.' },
          });
        }
      }
      const result = await QueueService.cancelTicket(
        req.clinicId!,
        req.params.ticketId,
        req.user!.userId,
        req.body?.reason
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

queueRouter.post(
  '/sessions/:sessionId/close',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST),
  async (req, res, next) => {
    try {
      const result = await QueueService.closeSession(req.clinicId!, req.params.sessionId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);


