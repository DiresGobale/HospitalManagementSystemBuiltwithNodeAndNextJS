import { prisma, DiagnosticStatus, QueuePriority } from '../config/prisma.js';
import {
  CreateDiagnosticOrderInput,
  CompleteDiagnosticOrderInput,
  ReviewDiagnosticOrderInput,
  SearchDiagnosticOrdersQuery,
} from '../types/index.js';
import { ActivityService } from './activity.service.js';

export class DiagnosticService {
  static async createDiagnosticOrder(
    clinicId: string,
    createdByUserId: string,
    input: CreateDiagnosticOrderInput
  ) {
    // 1. Resolve referring doctor profile
    let referringDoctorId = input.referringDoctorId;
    if (!referringDoctorId) {
      const doc = await prisma.doctorProfile.findFirst({
        where: { clinicId, userId: createdByUserId },
      });
      if (doc) {
        referringDoctorId = doc.id;
      } else {
        // Fallback: if called by staff/admin, pick first active doctor in clinic or doctor from appointment
        if (input.appointmentId) {
          const appt = await prisma.appointment.findUnique({
            where: { id: input.appointmentId },
          });
          if (appt) referringDoctorId = appt.doctorId;
        }
        if (!referringDoctorId) {
          const firstDoc = await prisma.doctorProfile.findFirst({
            where: { clinicId, isActive: true },
          });
          referringDoctorId = firstDoc?.id;
        }
      }
    }

    if (!referringDoctorId) {
      throw { statusCode: 400, code: 'DOCTOR_REQUIRED', message: 'A referring doctor is required to order diagnostics.' };
    }

    // 2. Verify patient belongs to this clinic
    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId, clinicId },
    });
    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this hospital.' };
    }

    // 3. Create Diagnostic Order
    const order = await prisma.diagnosticOrder.create({
      data: {
        clinicId,
        patientId: input.patientId,
        appointmentId: input.appointmentId || undefined,
        referringDoctorId,
        specialistId: input.specialistId || undefined,
        type: input.type as any,
        title: input.title,
        bodyPart: input.bodyPart,
        clinicalNotes: input.clinicalNotes,
        roomNumber: input.roomNumber || (input.type === 'LAB_TEST' ? 'Room 108 - Clinical Pathology Lab' : 'Room 204 - Radiology & Imaging Suite'),
        diagnosticDept: input.diagnosticDept || (input.type === 'LAB_TEST' ? 'Clinical Laboratory' : 'Specialist Radiology'),
        urgency: (input.urgency as QueuePriority) || QueuePriority.NORMAL,
        status: DiagnosticStatus.REQUESTED,
      },
      include: {
        patient: true,
        referringDoctor: true,
        appointment: {
          include: {
            service: true,
            branch: true,
          },
        },
      },
    });

    // 4. If linked to an appointment, append to appointment notes
    if (input.appointmentId) {
      const appt = await prisma.appointment.findUnique({ where: { id: input.appointmentId } });
      if (appt) {
        const noteAddition = `[Referred to Specialist]: ${input.title}${input.bodyPart ? ` (${input.bodyPart})` : ''} - Indication: ${input.clinicalNotes || 'Diagnostic evaluation'}`;
        const updatedNotes = appt.internalNotes ? `${appt.internalNotes}\n${noteAddition}` : noteAddition;
        await prisma.appointment.update({
          where: { id: input.appointmentId },
          data: { internalNotes: updatedNotes },
        });
      }
    }

    await ActivityService.log({
      clinicId,
      actorId: createdByUserId,
      actorRole: 'DOCTOR',
      action: 'DIAGNOSTIC_ORDERED',
      resourceType: 'DIAGNOSTIC_ORDER',
      resourceId: order.id,
      description: `Diagnostic investigation ordered: ${order.title} (${order.type}) for patient ${patient.fullName}`,
      metadata: {
        patientName: patient.fullName,
        orderTitle: order.title,
        roomNumber: order.roomNumber,
      },
    });

    return order;
  }

  static async listDiagnosticOrders(clinicId: string, query: SearchDiagnosticOrdersQuery) {
    const { status, type, patientId, referringDoctorId, appointmentId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = { clinicId };
    if (status) where.status = status as any;
    if (type) where.type = type as any;
    if (patientId) where.patientId = patientId;
    if (referringDoctorId) where.referringDoctorId = referringDoctorId;
    if (appointmentId) where.appointmentId = appointmentId;

    const [items, total] = await Promise.all([
      prisma.diagnosticOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
        include: {
          patient: true,
          referringDoctor: true,
          specialistDoctor: true,
          appointment: {
            include: {
              service: true,
              branch: true,
            },
          },
        },
      }),
      prisma.diagnosticOrder.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getDiagnosticOrderById(clinicId: string, orderId: string) {
    const order = await prisma.diagnosticOrder.findFirst({
      where: { id: orderId, clinicId },
      include: {
        patient: true,
        referringDoctor: true,
        specialistDoctor: true,
        appointment: {
          include: {
            service: true,
            branch: true,
            payment: true,
          },
        },
      },
    });

    if (!order) {
      throw { statusCode: 404, code: 'DIAGNOSTIC_ORDER_NOT_FOUND', message: 'Diagnostic order not found.' };
    }

    return order;
  }

  static async startDiagnosticOrder(clinicId: string, orderId: string, specialistUserId?: string) {
    const order = await prisma.diagnosticOrder.findFirst({
      where: { id: orderId, clinicId },
    });
    if (!order) {
      throw { statusCode: 404, code: 'DIAGNOSTIC_ORDER_NOT_FOUND', message: 'Diagnostic order not found.' };
    }

    let specialistDoctorId = order.specialistId;
    if (specialistUserId && !specialistDoctorId) {
      const spec = await prisma.doctorProfile.findFirst({
        where: { clinicId, userId: specialistUserId },
      });
      if (spec) specialistDoctorId = spec.id;
    }

    const updated = await prisma.diagnosticOrder.update({
      where: { id: orderId },
      data: {
        status: DiagnosticStatus.IN_PROGRESS,
        specialistId: specialistDoctorId,
      },
      include: {
        patient: true,
        referringDoctor: true,
        specialistDoctor: true,
        appointment: true,
      },
    });

    return updated;
  }

  static async completeDiagnosticOrder(
    clinicId: string,
    orderId: string,
    specialistUserId: string,
    input: CompleteDiagnosticOrderInput
  ) {
    const order = await prisma.diagnosticOrder.findFirst({
      where: { id: orderId, clinicId },
      include: { referringDoctor: true, appointment: true, patient: true },
    });
    if (!order) {
      throw { statusCode: 404, code: 'DIAGNOSTIC_ORDER_NOT_FOUND', message: 'Diagnostic order not found.' };
    }

    // Resolve specialist name / ID
    let specialistName = 'Radiology Specialist';
    let specialistDoctorId = input.specialistId || order.specialistId;

    const specUser = await prisma.user.findUnique({ where: { id: specialistUserId } });
    if (specUser) specialistName = specUser.fullName;

    if (!specialistDoctorId) {
      const specProfile = await prisma.doctorProfile.findFirst({
        where: { clinicId, userId: specialistUserId },
      });
      if (specProfile) specialistDoctorId = specProfile.id;
    }

    const updated = await prisma.diagnosticOrder.update({
      where: { id: orderId },
      data: {
        status: DiagnosticStatus.COMPLETED,
        findings: input.findings,
        impression: input.impression,
        radiologyNotes: input.radiologyNotes,
        imageUrl: input.imageUrl,
        specialistId: specialistDoctorId,
        completedAt: new Date(),
        completedBy: specialistName,
      },
      include: {
        patient: true,
        referringDoctor: true,
        specialistDoctor: true,
        appointment: {
          include: {
            service: true,
            branch: true,
          },
        },
      },
    });

    // Update appointment notes to notify that X-Ray results are ready and patient returned
    if (order.appointmentId) {
      const appt = await prisma.appointment.findUnique({ where: { id: order.appointmentId } });
      if (appt) {
        const resultNote = `\n[X-RAY RESULTS READY - Patient Returned to Dr. ${order.referringDoctor.fullName}]:\nFindings: ${input.findings}\nImpression: ${input.impression}`;
        await prisma.appointment.update({
          where: { id: order.appointmentId },
          data: {
            internalNotes: appt.internalNotes ? `${appt.internalNotes}${resultNote}` : resultNote,
          },
        });
      }
    }

    await ActivityService.log({
      clinicId,
      actorId: specialistUserId,
      actorRole: 'SPECIALIST',
      action: 'DIAGNOSTIC_COMPLETED',
      resourceType: 'DIAGNOSTIC_ORDER',
      resourceId: orderId,
      description: `Laboratory/Radiology results finalized for ${order.patient.fullName}: ${order.title}`,
      metadata: {
        patientName: order.patient.fullName,
        orderTitle: order.title,
        findings: input.findings,
        impression: input.impression,
      },
    });

    return updated;
  }

  static async reviewDiagnosticOrder(
    clinicId: string,
    orderId: string,
    doctorUserId: string,
    input: ReviewDiagnosticOrderInput
  ) {
    const order = await prisma.diagnosticOrder.findFirst({
      where: { id: orderId, clinicId },
      include: { appointment: true, patient: true, referringDoctor: true },
    });
    if (!order) {
      throw { statusCode: 404, code: 'DIAGNOSTIC_ORDER_NOT_FOUND', message: 'Diagnostic order not found.' };
    }

    const updated = await prisma.diagnosticOrder.update({
      where: { id: orderId },
      data: {
        status: DiagnosticStatus.REVIEWED,
        doctorConclusion: input.doctorConclusion,
        reviewedAt: new Date(),
      },
      include: {
        patient: true,
        referringDoctor: true,
        specialistDoctor: true,
        appointment: true,
      },
    });

    // If completeAppointment requested and linked appointment exists, mark appointment completed
    if (input.completeAppointment && order.appointmentId) {
      const appt = await prisma.appointment.findUnique({ where: { id: order.appointmentId } });
      if (appt && appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED') {
        const finalNote = `\n[FINAL DOCTOR COUNSELING & DISCHARGE]: ${input.doctorConclusion}`;
        await prisma.appointment.update({
          where: { id: order.appointmentId },
          data: {
            status: 'COMPLETED',
            internalNotes: appt.internalNotes ? `${appt.internalNotes}${finalNote}` : finalNote,
          },
        });

        await prisma.appointmentStatusHistory.create({
          data: {
            clinicId,
            appointmentId: order.appointmentId,
            fromStatus: appt.status,
            toStatus: 'COMPLETED',
            changedBy: doctorUserId,
            reason: 'Doctor completed post-X-ray counseling and discharged patient',
          },
        });
      }
    }

    await ActivityService.log({
      clinicId,
      actorId: doctorUserId,
      actorRole: 'DOCTOR',
      action: 'CONSULTATION_COMPLETED',
      resourceType: 'DIAGNOSTIC_ORDER',
      resourceId: orderId,
      description: `Doctor completed post-investigation counseling & diagnosis for ${order.patient.fullName}: ${input.doctorConclusion}`,
      metadata: {
        patientName: order.patient.fullName,
        doctorConclusion: input.doctorConclusion,
      },
    });

    return updated;
  }
}
