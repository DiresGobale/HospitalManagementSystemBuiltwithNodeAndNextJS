import { Router } from 'express';
import { PatientService } from '../services/patient.service.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { resolveClinicContext } from '../middleware/tenant.js';
import { requireRole, requirePatientOwnership } from '../middleware/rbac.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { prisma } from '../config/prisma.js';
import { createPatientSchema, updatePatientSchema, searchPatientSchema, ROLES } from '../types/index.js';

export const patientRouter = Router();

patientRouter.use(requireAuthenticatedUser, resolveClinicContext);

patientRouter.get('/me', async (req, res, next) => {
  try {
    let patient = await prisma.patient.findFirst({
      where: { clinicId: req.clinicId!, userId: req.user!.userId, archivedAt: null },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        appointments: {
          orderBy: { scheduledStartAt: 'desc' },
          take: 20,
          include: { doctor: true, service: true, branch: true, payment: true },
        },
        diagnosticOrders: {
          orderBy: { createdAt: 'desc' },
          include: { referringDoctor: true, specialistDoctor: true },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { medication: true } }, doctor: true },
        },
        queueTickets: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            queueSession: {
              include: {
                branch: true,
                doctor: true,
                service: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      const count = await prisma.patient.count({ where: { clinicId: req.clinicId! } });
      const patientNumber = `PT-${String(count + 1).padStart(5, '0')}`;
      patient = await prisma.patient.create({
        data: {
          clinicId: req.clinicId!,
          userId: req.user!.userId,
          patientNumber,
          fullName: user?.fullName || 'Patient',
          phone: user?.phone || '000-000-0000',
          email: user?.email,
          consentStatus: true,
        },
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          appointments: {
            orderBy: { scheduledStartAt: 'desc' },
            take: 20,
            include: { doctor: true, service: true, branch: true, payment: true },
          },
          diagnosticOrders: {
            orderBy: { createdAt: 'desc' },
            include: { referringDoctor: true, specialistDoctor: true },
          },
          prescriptions: {
            orderBy: { createdAt: 'desc' },
            include: { items: { include: { medication: true } }, doctor: true },
          },
          queueTickets: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              queueSession: {
                include: {
                  branch: true,
                  doctor: true,
                  service: true,
                },
              },
            },
          },
        },
      });
    }

    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
});

patientRouter.patch('/me', validateBody(updatePatientSchema), async (req, res, next) => {
  try {
    let patient = await prisma.patient.findFirst({
      where: { clinicId: req.clinicId!, userId: req.user!.userId, archivedAt: null },
    });

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    if (!patient) {
      const count = await prisma.patient.count({ where: { clinicId: req.clinicId! } });
      const patientNumber = `PT-${String(count + 1).padStart(5, '0')}`;
      patient = await prisma.patient.create({
        data: {
          clinicId: req.clinicId!,
          userId: req.user!.userId,
          patientNumber,
          fullName: req.body.fullName || user?.fullName || 'Patient',
          phone: req.body.phone || user?.phone || '000-000-0000',
          email: user?.email,
          consentStatus: true,
        },
      });
    }

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        fullName: req.body.fullName !== undefined ? req.body.fullName : undefined,
        phone: req.body.phone !== undefined ? req.body.phone : undefined,
        address: req.body.address !== undefined ? req.body.address : undefined,
        gender: req.body.gender !== undefined ? req.body.gender : undefined,
        dateOfBirth: req.body.dateOfBirth !== undefined ? req.body.dateOfBirth : undefined,
        bloodGroup: req.body.bloodGroup !== undefined ? req.body.bloodGroup : undefined,
        allergies: req.body.allergies !== undefined ? req.body.allergies : undefined,
        emergencyContact: req.body.emergencyContact !== undefined ? req.body.emergencyContact : undefined,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    if (req.body.phone || req.body.fullName) {
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          phone: req.body.phone || undefined,
          fullName: req.body.fullName || undefined,
        },
      });
    }

    res.json({ success: true, data: updated, message: 'Patient profile updated successfully in database.' });
  } catch (err) {
    next(err);
  }
});

patientRouter.get(
  '/',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.SUPER_ADMIN, ROLES.NURSING, ROLES.LABORATORY, ROLES.SPECIALIST),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const result = await PatientService.listPatients(req.clinicId!, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

patientRouter.get(
  '/search',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.SUPER_ADMIN, ROLES.NURSING, ROLES.LABORATORY, ROLES.SPECIALIST),
  validateQuery(searchPatientSchema),
  async (req, res, next) => {
    try {
      const result = await PatientService.searchPatients(req.clinicId!, req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

patientRouter.post(
  '/',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.SUPER_ADMIN, ROLES.NURSING),
  validateBody(createPatientSchema),
  async (req, res, next) => {
    try {
      const patient = await PatientService.createPatient(req.clinicId!, req.body);
      res.status(201).json({ success: true, data: patient });
    } catch (err) {
      next(err);
    }
  }
);

patientRouter.get('/:patientId', requirePatientOwnership, async (req, res, next) => {
  try {
    const patient = await PatientService.getPatientById(req.clinicId!, req.params.patientId);
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
});

patientRouter.patch(
  '/:patientId',
  requirePatientOwnership,
  validateBody(updatePatientSchema),
  async (req, res, next) => {
    try {
      const updated = await PatientService.updatePatient(req.clinicId!, req.params.patientId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

patientRouter.delete(
  '/:patientId',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST),
  async (req, res, next) => {
    try {
      await PatientService.archivePatient(req.clinicId!, req.params.patientId);
      res.json({ success: true, message: 'Patient archived successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

