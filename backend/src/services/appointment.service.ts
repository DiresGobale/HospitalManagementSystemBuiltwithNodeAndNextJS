import { prisma, AppointmentStatus, QueuePriority } from '../config/prisma.js';
import {
  CreateAppointmentInput,
  ApproveAppointmentInput,
  AssignDoctorInput,
  RescheduleAppointmentInput,
  CancelAppointmentInput,
  CheckInAppointmentInput,
  SearchAppointmentsQuery,
} from '../types/index.js';
import { ActivityService } from './activity.service.js';

const VALID_APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  REQUESTED: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  CONFIRMED: [AppointmentStatus.CHECKED_IN, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  CHECKED_IN: [AppointmentStatus.IN_QUEUE, AppointmentStatus.CANCELLED],
  IN_QUEUE: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
  IN_PROGRESS: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export class AppointmentService {
  static validateTransition(from: AppointmentStatus, to: AppointmentStatus) {
    const allowed = VALID_APPOINTMENT_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw {
        statusCode: 400,
        code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot transition appointment from status ${from} to ${to}.`,
      };
    }
  }

  static async createAppointment(clinicId: string, createdBy: string, input: CreateAppointmentInput) {
    if (input.idempotencyKey) {
      const existingKey = await prisma.idempotencyKey.findUnique({
        where: {
          clinicId_key: { clinicId, key: input.idempotencyKey },
        },
      });
      if (existingKey && existingKey.response) {
        return existingKey.response;
      }
    }

    const scheduledStart = new Date(input.scheduledStartAt);

    const service = await prisma.service.findFirst({
      where: { id: input.serviceId, clinicId, isActive: true },
    });
    if (!service) {
      throw { statusCode: 404, code: 'SERVICE_NOT_FOUND', message: 'Service not found in this hospital.' };
    }

    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: input.doctorId, clinicId, isActive: true },
    });
    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this hospital.' };
    }

    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId, clinicId, archivedAt: null },
    });
    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this hospital.' };
    }

    const durationMinutes = service.durationMinutes || doctor.appointmentDurationMinutes || 30;
    const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const overlapping = await tx.appointment.findFirst({
        where: {
          clinicId,
          doctorId: input.doctorId,
          status: { notIn: [AppointmentStatus.CANCELLED] },
          scheduledStartAt: { lt: scheduledEnd },
          scheduledEndAt: { gt: scheduledStart },
        },
      });

      if (overlapping) {
        throw {
          statusCode: 409,
          code: 'BOOKING_CONFLICT',
          message: 'The requested appointment slot conflicts with an existing booking for this doctor.',
        };
      }

      const apptCount = await tx.appointment.count({ where: { clinicId } });
      const appointmentNumber = `APT-${(apptCount + 1).toString().padStart(5, '0')}`;

      const initialStatus = (input.status as AppointmentStatus) || AppointmentStatus.CONFIRMED;

      const appointment = await tx.appointment.create({
        data: {
          clinicId,
          branchId: input.branchId,
          patientId: input.patientId,
          doctorId: input.doctorId,
          serviceId: input.serviceId,
          appointmentNumber,
          scheduledStartAt: scheduledStart,
          scheduledEndAt: scheduledEnd,
          status: initialStatus,
          roomNumber: input.roomNumber || undefined,
          assignedRole: input.assignedRole || undefined,
          reasonForVisit: input.reasonForVisit,
          internalNotes: input.internalNotes,
          createdBy,
        },
        include: {
          patient: true,
          doctor: true,
          service: true,
          branch: true,
        },
      });

      if (input.payment) {
        const paymentAmount = input.payment.amount !== undefined ? input.payment.amount : Number(service.price);
        const receiptNumber = `RCP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

        await tx.payment.create({
          data: {
            clinicId,
            appointmentId: appointment.id,
            patientId: input.patientId,
            amount: paymentAmount,
            currency: 'ETB',
            method: input.payment.method as any,
            status: 'PENDING',
            transactionRef: input.payment.transactionRef,
            payerPhone: input.payment.payerPhone,
            payerAccount: input.payment.payerAccount,
            payerName: input.payment.payerName,
            receiptNumber,
            notes: input.payment.notes,
          },
        });
      }

      await tx.appointmentStatusHistory.create({
        data: {
          clinicId,
          appointmentId: appointment.id,
          fromStatus: null,
          toStatus: initialStatus,
          changedBy: createdBy,
          reason: initialStatus === AppointmentStatus.REQUESTED
            ? 'Online booking requested by patient (pending reception approval)'
            : 'Initial appointment booking',
        },
      });

      if (input.idempotencyKey) {
        await tx.idempotencyKey.create({
          data: {
            clinicId,
            key: input.idempotencyKey,
            status: 'COMPLETED',
            response: appointment as any,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }

      return appointment;
    });

    await ActivityService.log({
      clinicId,
      actorId: createdBy,
      action: 'APPOINTMENT_BOOKED',
      resourceType: 'APPOINTMENT',
      resourceId: result.id,
      description: `Appointment booked: ${result.appointmentNumber} for ${patient.fullName}`,
      metadata: {
        appointmentNumber: result.appointmentNumber,
        patientName: patient.fullName,
        doctorName: doctor.fullName,
      },
    });

    return result;
  }

  static async rescheduleAppointment(clinicId: string, appointmentId: string, changedBy: string, input: RescheduleAppointmentInput) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
      include: { service: true, doctor: true },
    });

    if (!appointment) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found.' };
    }

    if (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.COMPLETED) {
      throw { statusCode: 400, code: 'CANNOT_RESCHEDULE', message: `Cannot reschedule a ${appointment.status.toLowerCase()} appointment.` };
    }

    const duration =
      appointment.service?.durationMinutes || appointment.doctor?.appointmentDurationMinutes || 30;
    const newStart = new Date(input.scheduledStartAt);
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    return await prisma.$transaction(async (tx) => {
      const overlapping = await tx.appointment.findFirst({
        where: {
          id: { not: appointment.id },
          clinicId,
          doctorId: appointment.doctorId,
          status: { notIn: [AppointmentStatus.CANCELLED] },
          scheduledStartAt: { lt: newEnd },
          scheduledEndAt: { gt: newStart },
        },
      });

      if (overlapping) {
        throw {
          statusCode: 409,
          code: 'BOOKING_CONFLICT',
          message: 'The requested reschedule slot conflicts with an existing booking.',
        };
      }

      const updated = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          scheduledStartAt: newStart,
          scheduledEndAt: newEnd,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          clinicId,
          appointmentId: appointment.id,
          fromStatus: appointment.status,
          toStatus: appointment.status,
          changedBy,
          reason: input.reason || 'Appointment rescheduled',
        },
      });

      return updated;
    });
  }

  static async cancelAppointment(clinicId: string, appointmentId: string, changedBy: string, input: CancelAppointmentInput) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });

    if (!appointment) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found.' };
    }

    this.validateTransition(appointment.status, AppointmentStatus.CANCELLED);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancellationReason: input.cancellationReason,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          clinicId,
          appointmentId: appointment.id,
          fromStatus: appointment.status,
          toStatus: AppointmentStatus.CANCELLED,
          changedBy,
          reason: input.cancellationReason,
        },
      });

      const queueTicket = await tx.queueTicket.findFirst({
        where: { appointmentId: appointment.id, clinicId },
      });
      if (queueTicket && queueTicket.status === 'WAITING') {
        await tx.queueTicket.update({
          where: { id: queueTicket.id },
          data: { status: 'CANCELLED' },
        });
      }

      return updated;
    });
  }

  static async approveAppointment(
    clinicId: string,
    appointmentId: string,
    changedBy: string,
    input?: ApproveAppointmentInput
  ) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
      include: { doctor: true, service: true, patient: true },
    });

    if (!appointment) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found in this hospital.' };
    }

    this.validateTransition(appointment.status, AppointmentStatus.CONFIRMED);

    const doctorId = input?.doctorId || appointment.doctorId;
    const branchId = input?.branchId || appointment.branchId;

    const updated = await prisma.$transaction(async (tx) => {
      // Check overlap if doctor changed
      if (doctorId !== appointment.doctorId) {
        const overlapping = await tx.appointment.findFirst({
          where: {
            id: { not: appointment.id },
            clinicId,
            doctorId,
            status: { notIn: [AppointmentStatus.CANCELLED] },
            scheduledStartAt: { lt: appointment.scheduledEndAt },
            scheduledEndAt: { gt: appointment.scheduledStartAt },
          },
        });
        if (overlapping) {
          throw {
            statusCode: 409,
            code: 'BOOKING_CONFLICT',
            message: 'The reassigned doctor has a conflicting booking at this time.',
          };
        }
      }

      if (input?.verifyPayment !== false) {
        await tx.payment.updateMany({
          where: { appointmentId: appointment.id, status: 'PENDING' },
          data: {
            status: 'VERIFIED',
            verifiedBy: changedBy,
            verifiedAt: new Date(),
          },
        });
      }

      const updated = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: AppointmentStatus.CONFIRMED,
          doctorId,
          branchId,
          roomNumber: input?.roomNumber !== undefined ? input.roomNumber : appointment.roomNumber,
          assignedRole: input?.assignedRole !== undefined ? input.assignedRole : appointment.assignedRole,
          internalNotes: input?.notes !== undefined ? input.notes : appointment.internalNotes,
        },
        include: {
          patient: true,
          doctor: true,
          service: true,
          branch: true,
          queueTicket: true,
          payment: true,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          clinicId,
          appointmentId: appointment.id,
          fromStatus: appointment.status,
          toStatus: AppointmentStatus.CONFIRMED,
          changedBy,
          reason: input?.notes || 'Appointment approved & confirmed by reception',
        },
      });

      return updated;
    });

    await ActivityService.log({
      clinicId,
      actorId: changedBy,
      action: 'APPOINTMENT_APPROVED',
      resourceType: 'APPOINTMENT',
      resourceId: updated.id,
      description: `Reception approved appointment: ${updated.appointmentNumber} - Assigned to ${updated.roomNumber || 'Room 102'}`,
      metadata: {
        appointmentNumber: updated.appointmentNumber,
        roomNumber: updated.roomNumber,
      },
    });

    return updated;
  }

  static async assignDoctor(
    clinicId: string,
    appointmentId: string,
    changedBy: string,
    input: AssignDoctorInput
  ) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });

    if (!appointment) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found in this hospital.' };
    }

    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: input.doctorId, clinicId, isActive: true },
    });
    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this hospital.' };
    }

    // Check overlap
    const overlapping = await prisma.appointment.findFirst({
      where: {
        id: { not: appointment.id },
        clinicId,
        doctorId: input.doctorId,
        status: { notIn: [AppointmentStatus.CANCELLED] },
        scheduledStartAt: { lt: appointment.scheduledEndAt },
        scheduledEndAt: { gt: appointment.scheduledStartAt },
      },
    });
    if (overlapping) {
      throw {
        statusCode: 409,
        code: 'BOOKING_CONFLICT',
        message: 'The reassigned doctor has a conflicting booking at this time.',
      };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          doctorId: input.doctorId,
          branchId: input.branchId || doctor.branchId || appointment.branchId,
          roomNumber: input.roomNumber !== undefined ? input.roomNumber : appointment.roomNumber,
          assignedRole: input.assignedRole !== undefined ? input.assignedRole : appointment.assignedRole,
          internalNotes: input.notes !== undefined ? input.notes : appointment.internalNotes,
        },
        include: {
          patient: true,
          doctor: true,
          service: true,
          branch: true,
          queueTicket: true,
          payment: true,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          clinicId,
          appointmentId: appointment.id,
          fromStatus: appointment.status,
          toStatus: appointment.status,
          changedBy,
          reason: input.notes || `Doctor assigned to Dr. ${doctor.fullName}`,
        },
      });

      return updated;
    });

    await ActivityService.log({
      clinicId,
      actorId: changedBy,
      action: 'DOCTOR_ASSIGNED',
      resourceType: 'APPOINTMENT',
      resourceId: updated.id,
      description: `Assigned Dr. ${doctor.fullName} (${input.roomNumber || 'Room'}) to appointment ${updated.appointmentNumber}`,
      metadata: {
        appointmentNumber: updated.appointmentNumber,
        doctorName: doctor.fullName,
        roomNumber: input.roomNumber,
      },
    });

    return updated;
  }

  static async checkInAppointment(clinicId: string, appointmentId: string, changedBy: string, input?: CheckInAppointmentInput) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
      include: { patient: true },
    });

    if (!appointment) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found.' };
    }

    this.validateTransition(appointment.status, AppointmentStatus.CHECKED_IN);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: AppointmentStatus.CHECKED_IN },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          clinicId,
          appointmentId: appointment.id,
          fromStatus: appointment.status,
          toStatus: AppointmentStatus.CHECKED_IN,
          changedBy,
          reason: 'Patient checked in at clinic',
        },
      });

      const todayDateStr = new Date().toISOString().split('T')[0];
      let session = await tx.queueSession.findFirst({
        where: {
          clinicId,
          branchId: input?.branchId || appointment.branchId,
          doctorId: appointment.doctorId,
          operatingDate: todayDateStr,
          status: 'OPEN',
        },
      });

      if (!session) {
        session = await tx.queueSession.findFirst({
          where: {
            clinicId,
            branchId: input?.branchId || appointment.branchId,
            operatingDate: todayDateStr,
            status: 'OPEN',
          },
        });
      }

      if (session) {
        const counter = await tx.queueCounter.upsert({
          where: { queueSessionId: session.id },
          update: { currentNumber: { increment: 1 } },
          create: { clinicId, queueSessionId: session.id, currentNumber: 1 },
        });

        const tokenPrefix = 'T';
        const displayToken = `${tokenPrefix}-${counter.currentNumber.toString().padStart(3, '0')}`;

        await tx.queueTicket.create({
          data: {
            clinicId,
            queueSessionId: session.id,
            patientId: appointment.patientId,
            appointmentId: appointment.id,
            tokenNumber: counter.currentNumber,
            displayToken,
            priority: (input?.priority as QueuePriority) || QueuePriority.NORMAL,
            status: 'WAITING',
            createdBy: changedBy,
          },
        });

        await tx.appointment.update({
          where: { id: appointment.id },
          data: { status: AppointmentStatus.IN_QUEUE },
        });
      }

      return updated;
    });
  }

  static async markNoShow(clinicId: string, appointmentId: string, changedBy: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });

    if (!appointment) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found.' };
    }

    this.validateTransition(appointment.status, AppointmentStatus.NO_SHOW);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: AppointmentStatus.NO_SHOW },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          clinicId,
          appointmentId: appointment.id,
          fromStatus: appointment.status,
          toStatus: AppointmentStatus.NO_SHOW,
          changedBy,
          reason: 'Patient failed to show up',
        },
      });

      return updated;
    });
  }

  static async listAppointments(clinicId: string, query: SearchAppointmentsQuery) {
    const { doctorId, patientId, branchId, status, startDate, endDate, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { clinicId };
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.scheduledStartAt = {};
      if (startDate) where.scheduledStartAt.gte = new Date(startDate);
      if (endDate) where.scheduledStartAt.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledStartAt: 'asc' },
        include: {
          patient: true,
          doctor: true,
          service: true,
          branch: true,
          queueTicket: true,
          payment: true,
          diagnosticOrders: true,
          prescriptions: { include: { items: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getAppointmentById(clinicId: string, appointmentId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
      include: {
        patient: true,
        doctor: true,
        service: true,
        branch: true,
        queueTicket: true,
        payment: true,
        diagnosticOrders: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!appointment) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found in this hospital.' };
    }

    return appointment;
  }

  static async verifyPayment(
    clinicId: string,
    appointmentId: string,
    verifiedBy: string,
    status: 'VERIFIED' | 'FAILED' | 'REFUNDED',
    notes?: string | null
  ) {
    const payment = await prisma.payment.findFirst({
      where: { appointmentId, clinicId },
    });

    if (!payment) {
      throw { statusCode: 404, code: 'PAYMENT_NOT_FOUND', message: 'No payment record found for this appointment.' };
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        verifiedBy,
        verifiedAt: new Date(),
        notes: notes !== undefined ? notes : payment.notes,
      },
    });

    await ActivityService.log({
      clinicId,
      actorId: verifiedBy,
      action: 'PAYMENT_VERIFIED',
      resourceType: 'PAYMENT',
      resourceId: updated.id,
      description: `Payment ${status} (${updated.amount} ETB via ${payment.method}) for appointment ${payment.appointmentId}`,
      metadata: {
        paymentId: updated.id,
        amount: updated.amount,
        status,
      },
    });

    return updated;
  }

  static async updateInternalNotes(clinicId: string, appointmentId: string, internalNotes: string) {
    const appt = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });
    if (!appt) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found in this hospital.' };
    }
    return await prisma.appointment.update({
      where: { id: appt.id },
      data: { internalNotes },
    });
  }

  static async deleteAppointment(clinicId: string, appointmentId: string) {
    const appt = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });
    if (!appt) {
      throw { statusCode: 404, code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found in this hospital.' };
    }
    const deleted = await prisma.$transaction(async (tx) => {
      await tx.appointmentStatusHistory.deleteMany({
        where: { appointmentId: appt.id },
      });
      await tx.queueTicket.deleteMany({
        where: { appointmentId: appt.id },
      });
      return await tx.appointment.delete({
        where: { id: appt.id },
      });
    });

    await ActivityService.log({
      clinicId,
      action: 'APPOINTMENT_DELETED',
      resourceType: 'APPOINTMENT',
      resourceId: appt.id,
      description: `Appointment ${appt.appointmentNumber} removed from hospital database`,
      metadata: {
        appointmentNumber: appt.appointmentNumber,
      },
    });

    return deleted;
  }
}

