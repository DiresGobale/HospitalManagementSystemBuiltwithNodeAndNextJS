import { prisma } from '../config/prisma.js';
import { CreatePatientInput, UpdatePatientInput, SearchPatientQuery } from '../types/index.js';
import { ActivityService } from './activity.service.js';

export class PatientService {
  static async checkDuplicate(clinicId: string, phone: string, email?: string | null) {
    const conditions: any[] = [{ phone }];
    if (email) {
      conditions.push({ email: email.toLowerCase() });
    }

    return await prisma.patient.findFirst({
      where: {
        clinicId,
        archivedAt: null,
        OR: conditions,
      },
    });
  }

  static async createPatient(clinicId: string, input: CreatePatientInput) {
    const existing = await this.checkDuplicate(clinicId, input.phone, input.email);
    if (existing) {
      throw {
        statusCode: 409,
        code: 'DUPLICATE_PATIENT',
        message: `A patient with this phone or email already exists in this hospital (${existing.patientNumber}: ${existing.fullName}).`,
      };
    }

    const count = await prisma.patient.count({ where: { clinicId } });
    const patientNumber = `PT-${(count + 1).toString().padStart(5, '0')}`;

    const patient = await prisma.patient.create({
      data: {
        clinicId,
        patientNumber,
        fullName: input.fullName,
        email: input.email ? input.email.toLowerCase() : null,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        address: input.address,
        gender: input.gender,
        bloodGroup: input.bloodGroup,
        allergies: input.allergies,
        emergencyContact: input.emergencyContact,
      },
    });

    await ActivityService.log({
      clinicId,
      action: 'PATIENT_REGISTERED',
      resourceType: 'PATIENT',
      resourceId: patient.id,
      description: `New patient registered: ${patient.fullName} (${patient.patientNumber}) - Phone: ${patient.phone}`,
      metadata: {
        patientId: patient.id,
        patientNumber: patient.patientNumber,
        phone: patient.phone,
      },
    });

    return patient;
  }

  static async searchPatients(clinicId: string, query: SearchPatientQuery) {
    const { query: searchTerm, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      clinicId,
      archivedAt: null,
      OR: [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { patientNumber: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where: whereClause }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async listPatients(clinicId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { clinicId, archivedAt: null };

    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getPatientById(clinicId: string, patientId: string) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId, archivedAt: null },
      include: {
        appointments: {
          orderBy: { scheduledStartAt: 'desc' },
          take: 10,
          include: { doctor: true, service: true },
        },
      },
    });

    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this hospital.' };
    }

    return patient;
  }

  static async updatePatient(clinicId: string, patientId: string, input: UpdatePatientInput) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId, archivedAt: null },
    });

    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this hospital.' };
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...input,
        email: input.email ? input.email.toLowerCase() : input.email,
      },
    });

    await ActivityService.log({
      clinicId,
      action: 'PATIENT_UPDATED',
      resourceType: 'PATIENT',
      resourceId: patient.id,
      description: `Updated record for patient: ${updated.fullName} (${updated.patientNumber})`,
      metadata: {
        patientId: updated.id,
        patientNumber: updated.patientNumber,
      },
    });

    return updated;
  }

  static async archivePatient(clinicId: string, patientId: string) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId, archivedAt: null },
    });

    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this hospital.' };
    }

    const archived = await prisma.patient.update({
      where: { id: patientId },
      data: { archivedAt: new Date() },
    });

    await ActivityService.log({
      clinicId,
      action: 'PATIENT_DELETED',
      resourceType: 'PATIENT',
      resourceId: patient.id,
      description: `Archived/deleted patient file: ${patient.fullName} (${patient.patientNumber})`,
      metadata: {
        patientId: patient.id,
        patientNumber: patient.patientNumber,
      },
    });

    return archived;
  }
}

