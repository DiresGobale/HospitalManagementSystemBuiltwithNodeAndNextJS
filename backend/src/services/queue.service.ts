import { prisma, QueuePriority, QueueSessionStatus, QueueStatus, AppointmentStatus } from '../config/prisma.js';
import { CreateQueueSessionInput, CreateWalkInTicketInput, TransferTicketInput, QUEUE_SOCKET_EVENTS } from '../types/index.js';
import { getSocketServer } from '../events/socket.js';

const VALID_QUEUE_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  WAITING: [QueueStatus.CALLED, QueueStatus.SKIPPED, QueueStatus.CANCELLED, QueueStatus.NO_SHOW],
  CALLED: [QueueStatus.SERVING, QueueStatus.SKIPPED, QueueStatus.NO_SHOW, QueueStatus.CANCELLED],
  SERVING: [QueueStatus.COMPLETED, QueueStatus.SKIPPED, QueueStatus.CANCELLED],
  SKIPPED: [QueueStatus.WAITING, QueueStatus.CANCELLED, QueueStatus.NO_SHOW],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const PRIORITY_ORDER: Record<QueuePriority, number> = {
  EMERGENCY: 1,
  VIP: 2,
  URGENT: 3,
  NORMAL: 4,
};

export class QueueService {
  static validateTransition(from: QueueStatus, to: QueueStatus) {
    const allowed = VALID_QUEUE_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw {
        statusCode: 400,
        code: 'INVALID_QUEUE_TRANSITION',
        message: `Cannot transition ticket from status ${from} to ${to}.`,
      };
    }
  }

  static async getOrCreateDailySession(clinicId: string, input: CreateQueueSessionInput) {
    const operatingDate = input.operatingDate || new Date().toISOString().split('T')[0];

    let session = await prisma.queueSession.findFirst({
      where: {
        clinicId,
        branchId: input.branchId,
        doctorId: input.doctorId || null,
        serviceId: input.serviceId || null,
        operatingDate,
      },
      include: {
        queueCounter: true,
      },
    });

    if (!session) {
      session = await prisma.$transaction(async (tx) => {
        const newSession = await tx.queueSession.create({
          data: {
            clinicId,
            branchId: input.branchId,
            doctorId: input.doctorId,
            serviceId: input.serviceId,
            operatingDate,
            status: QueueSessionStatus.OPEN,
          },
        });

        const counter = await tx.queueCounter.create({
          data: {
            clinicId,
            queueSessionId: newSession.id,
            currentNumber: 0,
          },
        });

        return { ...newSession, queueCounter: counter };
      });
    }

    return session;
  }

  static async listSessions(clinicId: string, operatingDate?: string) {
    const date = operatingDate || new Date().toISOString().split('T')[0];
    return await prisma.queueSession.findMany({
      where: { clinicId, operatingDate: date },
      include: {
        branch: true,
        doctor: true,
        service: true,
        queueCounter: true,
        queueTickets: {
          where: { status: { in: ['WAITING', 'CALLED', 'SERVING'] } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getSessionById(clinicId: string, sessionId: string) {
    const session = await prisma.queueSession.findFirst({
      where: { id: sessionId, clinicId },
      include: {
        branch: true,
        doctor: true,
        service: true,
        queueCounter: true,
        queueTickets: {
          orderBy: [{ priority: 'asc' }, { checkedInAt: 'asc' }, { tokenNumber: 'asc' }],
          include: { patient: true, appointment: true },
        },
      },
    });

    if (!session) {
      throw { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'Queue session not found.' };
    }

    return session;
  }

  static async createWalkInTicket(clinicId: string, createdBy: string, input: CreateWalkInTicketInput) {
    const session = await prisma.queueSession.findFirst({
      where: { id: input.queueSessionId, clinicId, status: QueueSessionStatus.OPEN },
    });

    if (!session) {
      throw { statusCode: 400, code: 'INVALID_SESSION', message: 'Queue session is not currently open.' };
    }

    const settings = await prisma.clinicSettings.findUnique({ where: { clinicId } });
    const prefix = settings?.queueTokenPrefix || 'T';

    return await prisma.$transaction(async (tx) => {
      const counter = await tx.queueCounter.upsert({
        where: { queueSessionId: session.id },
        update: { currentNumber: { increment: 1 } },
        create: { clinicId, queueSessionId: session.id, currentNumber: 1 },
      });

      const displayToken = `${prefix}-${counter.currentNumber.toString().padStart(3, '0')}`;

      const ticket = await tx.queueTicket.create({
        data: {
          clinicId,
          queueSessionId: session.id,
          patientId: input.patientId,
          tokenNumber: counter.currentNumber,
          displayToken,
          priority: input.priority,
          status: QueueStatus.WAITING,
          createdBy,
        },
        include: {
          patient: true,
        },
      });

      await tx.queueTicketStatusHistory.create({
        data: {
          clinicId,
          queueTicketId: ticket.id,
          fromStatus: null,
          toStatus: QueueStatus.WAITING,
          changedBy: createdBy,
          reason: 'Walk-in ticket registered',
        },
      });

      this.broadcastEvent(clinicId, session.id, QUEUE_SOCKET_EVENTS.TICKET_CREATED, ticket);

      return ticket;
    });
  }

  static async callTicket(clinicId: string, ticketId: string, changedBy: string) {
    const ticket = await prisma.queueTicket.findFirst({
      where: { id: ticketId, clinicId },
    });

    if (!ticket) {
      throw { statusCode: 404, code: 'TICKET_NOT_FOUND', message: 'Queue ticket not found.' };
    }

    this.validateTransition(ticket.status, QueueStatus.CALLED);

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.queueTicket.update({
        where: { id: ticket.id },
        data: {
          status: QueueStatus.CALLED,
          calledAt: new Date(),
        },
        include: { patient: true, appointment: true },
      });

      await tx.queueTicketStatusHistory.create({
        data: {
          clinicId,
          queueTicketId: ticket.id,
          fromStatus: ticket.status,
          toStatus: QueueStatus.CALLED,
          changedBy,
          reason: 'Patient called to counter',
        },
      });

      return res;
    });

    this.broadcastEvent(clinicId, ticket.queueSessionId, QUEUE_SOCKET_EVENTS.TICKET_CALLED, updated);
    return updated;
  }

  static async recallTicket(clinicId: string, ticketId: string, changedBy: string) {
    const ticket = await prisma.queueTicket.findFirst({
      where: { id: ticketId, clinicId },
      include: { patient: true, appointment: true },
    });

    if (!ticket || ticket.status !== QueueStatus.CALLED) {
      throw { statusCode: 400, code: 'INVALID_ACTION', message: 'Ticket must be in CALLED status to recall.' };
    }

    this.broadcastEvent(clinicId, ticket.queueSessionId, QUEUE_SOCKET_EVENTS.TICKET_CALLED, ticket);
    return ticket;
  }

  static async startService(clinicId: string, ticketId: string, changedBy: string) {
    const ticket = await prisma.queueTicket.findFirst({
      where: { id: ticketId, clinicId },
    });

    if (!ticket) {
      throw { statusCode: 404, code: 'TICKET_NOT_FOUND', message: 'Queue ticket not found.' };
    }

    this.validateTransition(ticket.status, QueueStatus.SERVING);

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.queueTicket.update({
        where: { id: ticket.id },
        data: {
          status: QueueStatus.SERVING,
          serviceStartedAt: new Date(),
        },
        include: { patient: true, appointment: true },
      });

      await tx.queueTicketStatusHistory.create({
        data: {
          clinicId,
          queueTicketId: ticket.id,
          fromStatus: ticket.status,
          toStatus: QueueStatus.SERVING,
          changedBy,
          reason: 'Service started with patient',
        },
      });

      if (ticket.appointmentId) {
        await tx.appointment.update({
          where: { id: ticket.appointmentId },
          data: { status: AppointmentStatus.IN_PROGRESS },
        });
      }

      return res;
    });

    this.broadcastEvent(clinicId, ticket.queueSessionId, QUEUE_SOCKET_EVENTS.TICKET_SERVING, updated);
    return updated;
  }

  static async completeService(clinicId: string, ticketId: string, changedBy: string) {
    const ticket = await prisma.queueTicket.findFirst({
      where: { id: ticketId, clinicId },
    });

    if (!ticket) {
      throw { statusCode: 404, code: 'TICKET_NOT_FOUND', message: 'Queue ticket not found.' };
    }

    this.validateTransition(ticket.status, QueueStatus.COMPLETED);

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.queueTicket.update({
        where: { id: ticket.id },
        data: {
          status: QueueStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: { patient: true, appointment: true },
      });

      await tx.queueTicketStatusHistory.create({
        data: {
          clinicId,
          queueTicketId: ticket.id,
          fromStatus: ticket.status,
          toStatus: QueueStatus.COMPLETED,
          changedBy,
          reason: 'Service completed successfully',
        },
      });

      if (ticket.appointmentId) {
        await tx.appointment.update({
          where: { id: ticket.appointmentId },
          data: { status: AppointmentStatus.COMPLETED },
        });
      }

      return res;
    });

    this.broadcastEvent(clinicId, ticket.queueSessionId, QUEUE_SOCKET_EVENTS.TICKET_COMPLETED, updated);
    return updated;
  }

  static async skipTicket(clinicId: string, ticketId: string, changedBy: string) {
    const ticket = await prisma.queueTicket.findFirst({
      where: { id: ticketId, clinicId },
    });

    if (!ticket) {
      throw { statusCode: 404, code: 'TICKET_NOT_FOUND', message: 'Queue ticket not found.' };
    }

    this.validateTransition(ticket.status, QueueStatus.SKIPPED);

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.queueTicket.update({
        where: { id: ticket.id },
        data: { status: QueueStatus.SKIPPED },
        include: { patient: true },
      });

      await tx.queueTicketStatusHistory.create({
        data: {
          clinicId,
          queueTicketId: ticket.id,
          fromStatus: ticket.status,
          toStatus: QueueStatus.SKIPPED,
          changedBy,
          reason: 'Patient skipped/not present',
        },
      });

      return res;
    });

    this.broadcastEvent(clinicId, ticket.queueSessionId, QUEUE_SOCKET_EVENTS.TICKET_SKIPPED, updated);
    return updated;
  }

  static async requeueTicket(clinicId: string, ticketId: string, changedBy: string) {
    const ticket = await prisma.queueTicket.findFirst({
      where: { id: ticketId, clinicId },
    });

    if (!ticket) {
      throw { statusCode: 404, code: 'TICKET_NOT_FOUND', message: 'Queue ticket not found.' };
    }

    this.validateTransition(ticket.status, QueueStatus.WAITING);

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.queueTicket.update({
        where: { id: ticket.id },
        data: {
          status: QueueStatus.WAITING,
          checkedInAt: new Date(),
        },
        include: { patient: true },
      });

      await tx.queueTicketStatusHistory.create({
        data: {
          clinicId,
          queueTicketId: ticket.id,
          fromStatus: ticket.status,
          toStatus: QueueStatus.WAITING,
          changedBy,
          reason: 'Patient requeued back to waiting line',
        },
      });

      return res;
    });

    this.broadcastEvent(clinicId, ticket.queueSessionId, QUEUE_SOCKET_EVENTS.TICKET_REQUEUED, updated);
    return updated;
  }

  static async transferTicket(clinicId: string, ticketId: string, changedBy: string, input: TransferTicketInput) {
    const ticket = await prisma.queueTicket.findFirst({
      where: { id: ticketId, clinicId },
    });

    if (!ticket) {
      throw { statusCode: 404, code: 'TICKET_NOT_FOUND', message: 'Queue ticket not found.' };
    }

    const targetSession = await prisma.queueSession.findFirst({
      where: { id: input.targetSessionId, clinicId, status: QueueSessionStatus.OPEN },
    });

    if (!targetSession) {
      throw { statusCode: 400, code: 'INVALID_TARGET_SESSION', message: 'Target session is not open.' };
    }

    const updated = await prisma.queueTicket.update({
      where: { id: ticket.id },
      data: {
        queueSessionId: targetSession.id,
        status: QueueStatus.WAITING,
      },
      include: { patient: true },
    });

    this.broadcastEvent(clinicId, ticket.queueSessionId, QUEUE_SOCKET_EVENTS.POSITION_UPDATED, {});
    this.broadcastEvent(clinicId, targetSession.id, QUEUE_SOCKET_EVENTS.TICKET_CREATED, updated);

    return updated;
  }

  static async cancelTicket(clinicId: string, ticketId: string, changedBy: string, reason?: string) {
    const ticket = await prisma.queueTicket.findFirst({
      where: { id: ticketId, clinicId },
    });

    if (!ticket) {
      throw { statusCode: 404, code: 'TICKET_NOT_FOUND', message: 'Queue ticket not found.' };
    }

    this.validateTransition(ticket.status, QueueStatus.CANCELLED);

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.queueTicket.update({
        where: { id: ticket.id },
        data: {
          status: QueueStatus.CANCELLED,
        },
        include: { patient: true },
      });

      await tx.queueTicketStatusHistory.create({
        data: {
          clinicId,
          queueTicketId: ticket.id,
          fromStatus: ticket.status,
          toStatus: QueueStatus.CANCELLED,
          changedBy,
          reason: reason || 'Ticket cancelled',
        },
      });

      return res;
    });

    this.broadcastEvent(clinicId, ticket.queueSessionId, QUEUE_SOCKET_EVENTS.TICKET_SKIPPED, updated);
    return updated;
  }

  static async closeSession(clinicId: string, sessionId: string) {
    const session = await prisma.queueSession.findFirst({
      where: { id: sessionId, clinicId },
    });

    if (!session) {
      throw { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'Queue session not found.' };
    }

    return await prisma.queueSession.update({
      where: { id: sessionId },
      data: {
        status: QueueSessionStatus.CLOSED,
        closedAt: new Date(),
      },
    });
  }

  static async calculateWaitEstimate(clinicId: string, ticketId: string) {
    const ticket = await prisma.queueTicket.findFirst({
      where: { id: ticketId, clinicId },
      include: { queueSession: true },
    });

    if (!ticket) {
      throw { statusCode: 404, code: 'TICKET_NOT_FOUND', message: 'Queue ticket not found.' };
    }

    if (ticket.status !== QueueStatus.WAITING) {
      return {
        ticketId,
        displayToken: ticket.displayToken,
        status: ticket.status,
        positionAhead: 0,
        estimatedWaitMinutes: 0,
      };
    }

    const waitingTickets = await prisma.queueTicket.findMany({
      where: {
        queueSessionId: ticket.queueSessionId,
        status: QueueStatus.WAITING,
      },
      orderBy: [{ checkedInAt: 'asc' }, { tokenNumber: 'asc' }],
    });

    const ticketPriorityRank = PRIORITY_ORDER[ticket.priority];
    let positionAhead = 0;

    for (const other of waitingTickets) {
      if (other.id === ticket.id) continue;
      const otherRank = PRIORITY_ORDER[other.priority];
      if (otherRank < ticketPriorityRank) {
        positionAhead++;
      } else if (otherRank === ticketPriorityRank && other.checkedInAt < ticket.checkedInAt) {
        positionAhead++;
      }
    }

    const averageMinutesPerPatient = 15;
    const estimatedWaitMinutes = positionAhead * averageMinutesPerPatient;

    return {
      ticketId,
      displayToken: ticket.displayToken,
      status: ticket.status,
      positionAhead,
      estimatedWaitMinutes,
    };
  }

  private static broadcastEvent(clinicId: string, sessionId: string, eventName: string, data: any) {
    try {
      const io = getSocketServer();
      if (io) {
        io.to(`clinic:${clinicId}:session:${sessionId}`).emit(eventName, data);
        io.to(`clinic:${clinicId}`).emit(eventName, data);
      }
    } catch (err) {
      console.warn('Socket broadcast warning:', err);
    }
  }
}

