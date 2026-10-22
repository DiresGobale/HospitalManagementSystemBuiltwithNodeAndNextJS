import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission, ROLE_PERMISSIONS, ROLES } from '../types/index.js';
import { prisma } from '../config/prisma.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No hospital membership resolved.' },
      });
    }

    const currentRole = req.membership.role;
    const isSuperAdmin = currentRole === (ROLES as any).SUPER_ADMIN;
    const effectiveRoles: any[] = [...allowedRoles];
    if (effectiveRoles.includes(ROLES.ADMIN) && !effectiveRoles.includes(ROLES.MANAGER)) {
      effectiveRoles.push(ROLES.MANAGER);
    }
    if (effectiveRoles.includes(ROLES.MANAGER) && !effectiveRoles.includes(ROLES.ADMIN)) {
      effectiveRoles.push(ROLES.ADMIN);
    }

    if (!isSuperAdmin && !effectiveRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `Operation requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.membership.role}`,
        },
      });
    }

    return next();
  };
}

export function requirePermission(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No hospital membership resolved.' },
      });
    }

    const userPermissions = ROLE_PERMISSIONS[req.membership.role] || [];
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_PERMISSION',
          message: `Missing required permissions: [${requiredPermissions.join(', ')}]`,
        },
      });
    }

    return next();
  };
}

export function requirePatientOwnership(req: Request, res: Response, next: NextFunction) {
  if (!req.membership) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'No hospital membership resolved.' },
    });
  }

  if (
    req.membership.role === ROLES.ADMIN ||
    // req.membership.role === ROLES.MANAGER ||
    req.membership.role === ROLES.RECEPTIONIST ||
    req.membership.role === ROLES.DOCTOR ||
    req.membership.role === (ROLES as any).SUPER_ADMIN ||
    req.membership.role === ROLES.NURSING ||
    req.membership.role === ROLES.LABORATORY ||
    req.membership.role === ROLES.SPECIALIST ||
    req.membership.role === ROLES.PHARMACIST
  ) {
    return next();
  }

  const targetPatientId = req.params.patientId || req.body.patientId || req.query.patientId;
  if (!req.patientId || req.patientId !== targetPatientId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_PATIENT_ACCESS', message: 'You may only access your own patient records.' },
    });
  }

  return next();
}

export async function requireDoctorAssignment(req: Request, res: Response, next: NextFunction) {
  if (!req.membership) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'No hospital membership resolved.' },
    });
  }

  if (req.membership.role === ROLES.ADMIN || req.membership.role === ROLES.MANAGER) {
    return next();
  }

  if (req.membership.role !== ROLES.DOCTOR || !req.doctorProfileId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_DOCTOR_ACCESS', message: 'Only authorized doctors can perform this action.' },
    });
  }

  const appointmentId = req.params.appointmentId;
  if (appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId: req.clinicId },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found in this clinic.' },
      });
    }

    if (appointment.doctorId !== req.doctorProfileId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED_DOCTOR_ASSIGNMENT', message: 'You are not assigned to this appointment.' },
      });
    }
  }

  return next();
}

