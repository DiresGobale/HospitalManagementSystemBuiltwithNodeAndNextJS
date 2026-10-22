import { Router } from 'express';
import { DoctorService } from '../services/doctor.service.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { resolveClinicContext } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createDoctorSchema, updateDoctorSchema, createScheduleSchema, createScheduleExceptionSchema, availabilityQuerySchema, ROLES } from '../types/index.js';

export const doctorRouter = Router();

doctorRouter.get(
  '/availability',
  requireAuthenticatedUser,
  resolveClinicContext,
  validateQuery(availabilityQuerySchema),
  async (req, res, next) => {
    try {
      const availability = await DoctorService.getAvailability(req.clinicId!, req.query as any);
      res.json({ success: true, data: availability });
    } catch (err) {
      next(err);
    }
  }
);

doctorRouter.get('/', requireAuthenticatedUser, resolveClinicContext, async (req, res, next) => {
  try {
    const branchId = req.query.branchId as string | undefined;
    const doctors = await DoctorService.listDoctors(req.clinicId!, branchId);
    res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
});

doctorRouter.get('/:doctorId', requireAuthenticatedUser, resolveClinicContext, async (req, res, next) => {
  try {
    const doctor = await DoctorService.getDoctorById(req.clinicId!, req.params.doctorId);
    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
});

doctorRouter.post(
  '/',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validateBody(createDoctorSchema),
  async (req, res, next) => {
    try {
      const doctor = await DoctorService.createDoctor(req.clinicId!, req.body);
      res.status(201).json({ success: true, data: doctor });
    } catch (err) {
      next(err);
    }
  }
);

doctorRouter.patch(
  '/:doctorId',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validateBody(updateDoctorSchema),
  async (req, res, next) => {
    try {
      const updated = await DoctorService.updateDoctor(req.clinicId!, req.params.doctorId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

doctorRouter.delete(
  '/:doctorId',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  async (req, res, next) => {
    try {
      await DoctorService.deleteDoctor(req.clinicId!, req.params.doctorId);
      res.json({ success: true, message: 'Doctor deactivated successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

doctorRouter.post(
  '/:doctorId/schedules',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validateBody(createScheduleSchema),
  async (req, res, next) => {
    try {
      const schedule = await DoctorService.setSchedule(req.clinicId!, req.body);
      res.status(201).json({ success: true, data: schedule });
    } catch (err) {
      next(err);
    }
  }
);

doctorRouter.post(
  '/:doctorId/exceptions',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validateBody(createScheduleExceptionSchema),
  async (req, res, next) => {
    try {
      const exception = await DoctorService.addScheduleException(req.clinicId!, req.body);
      res.status(201).json({ success: true, data: exception });
    } catch (err) {
      next(err);
    }
  }
);

