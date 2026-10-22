import { Request, Response, NextFunction } from 'express';
import { prisma, UserRole } from '../config/prisma.js';

export async function resolveHmsContext(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User must be authenticated to resolve tenant context.' },
    });
  }

  const rawClinicId =
    (req.headers['x-clinic-id'] as string) ||
    req.params.clinicId ||
    (req.query.clinicId as string);

  if (!rawClinicId) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_CLINIC_CONTEXT', message: 'Hospital facility identifier (x-clinic-id) is required for this operation.' },
    });
  }

  const clinicId = String(rawClinicId).trim();

  try {
    const membership = await prisma.clinicMembership.findFirst({
      where: {
        clinicId,
        userId: req.user.userId,
        status: 'ACTIVE',
      },
      include: {
        clinic: true,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_TENANT_ACCESS', message: 'You do not have active membership or access to this hospital.' },
      });
    }

    if (membership.clinic.status === 'SUSPENDED' && membership.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { code: 'CLINIC_SUSPENDED', message: 'This hospital facility is currently suspended.' },
      });
    }

    req.clinicId = clinicId;
    req.membership = {
      id: membership.id,
      clinicId: membership.clinicId,
      userId: membership.userId,
      role: membership.role as any,
      status: membership.status as any,
    };

    if (membership.role === UserRole.DOCTOR) {
      const doctorProfile = await prisma.doctorProfile.findFirst({
        where: { clinicId, userId: req.user.userId, isActive: true },
      });
      if (doctorProfile) {
        req.doctorProfileId = doctorProfile.id;
      }
    }

    if (membership.role === UserRole.PATIENT) {
      let patient = await prisma.patient.findFirst({
        where: { clinicId, userId: req.user.userId, archivedAt: null },
      });
      if (!patient) {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        const count = await prisma.patient.count({ where: { clinicId } });
        const patientNumber = `PT-${String(count + 1).padStart(5, '0')}`;
        patient = await prisma.patient.create({
          data: {
            clinicId,
            userId: req.user.userId,
            patientNumber,
            fullName: user?.fullName || 'Patient',
            phone: user?.phone || '000-000-0000',
            email: user?.email,
            consentStatus: true,
          },
        });
      }
      req.patientId = patient.id;
    }

    return next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to resolve hospital context.', details: error.message },
    });
  }
}

