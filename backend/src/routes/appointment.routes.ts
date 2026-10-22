import { Router } from 'express';
import { AppointmentService } from '../services/appointment.service.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { resolveClinicContext } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { prisma } from '../config/prisma.js';
import {
  createAppointmentSchema,
  approveAppointmentSchema,
  assignDoctorSchema,
  verifyPaymentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  checkInAppointmentSchema,
  searchAppointmentsQuerySchema,
  ROLES,
} from '../types/index.js';

export const appointmentRouter = Router();

appointmentRouter.use(requireAuthenticatedUser, resolveClinicContext);

appointmentRouter.get('/', validateQuery(searchAppointmentsQuerySchema), async (req, res, next) => {
  try {
    const query = { ...(req.query as any) };

    if (req.membership?.role === ROLES.DOCTOR) {
      query.doctorId = req.doctorProfileId;
    } else if (req.membership?.role === ROLES.PATIENT) {
      query.patientId = req.patientId;
    }

    const appointments = await AppointmentService.listAppointments(req.clinicId!, query);
    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
});

appointmentRouter.post(
  '/',
  async (req, _res, next) => {
    try {
      if (req.membership?.role === ROLES.PATIENT) {
        if (req.patientId && !req.body.patientId) {
          req.body.patientId = req.patientId;
        }
        if (!req.body.status) {
          req.body.status = 'REQUESTED';
        }
      }
      if (!req.body.branchId && req.body.doctorId) {
        const doc = await prisma.doctorProfile.findUnique({ where: { id: req.body.doctorId } });
        if (doc?.branchId) {
          req.body.branchId = doc.branchId;
        }
      }
      next();
    } catch (e) {
      next(e);
    }
  },
  validateBody(createAppointmentSchema),
  async (req, res, next) => {
    try {
      const appointment = await AppointmentService.createAppointment(
        req.clinicId!,
        req.user!.userId,
        req.body
      );
      res.status(201).json({ success: true, data: appointment });
    } catch (err) {
      next(err);
    }
  }
);

appointmentRouter.get('/:appointmentId', async (req, res, next) => {
  try {
    const appointment = await AppointmentService.getAppointmentById(req.clinicId!, req.params.appointmentId);

    if (req.membership?.role === ROLES.DOCTOR && appointment.doctorId !== req.doctorProfileId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_DOCTOR_ACCESS', message: 'You are not assigned to this appointment.' },
      });
    }

    if (req.membership?.role === ROLES.PATIENT && appointment.patientId !== req.patientId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_PATIENT_ACCESS', message: 'You can only view your own appointments.' },
      });
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
});

appointmentRouter.post(
  '/:appointmentId/reschedule',
  validateBody(rescheduleAppointmentSchema),
  async (req, res, next) => {
    try {
      const updated = await AppointmentService.rescheduleAppointment(
        req.clinicId!,
        req.params.appointmentId,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

appointmentRouter.post(
  '/:appointmentId/cancel',
  validateBody(cancelAppointmentSchema),
  async (req, res, next) => {
    try {
      const updated = await AppointmentService.cancelAppointment(
        req.clinicId!,
        req.params.appointmentId,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

appointmentRouter.post(
  '/:appointmentId/approve',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.SUPER_ADMIN, ROLES.NURSING),
  validateBody(approveAppointmentSchema),
  async (req, res, next) => {
    try {
      const updated = await AppointmentService.approveAppointment(
        req.clinicId!,
        req.params.appointmentId,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: updated, message: 'Appointment approved and confirmed successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

appointmentRouter.patch(
  '/:appointmentId/assign-doctor',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.SUPER_ADMIN, ROLES.NURSING),
  validateBody(assignDoctorSchema),
  async (req, res, next) => {
    try {
      const updated = await AppointmentService.assignDoctor(
        req.clinicId!,
        req.params.appointmentId,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: updated, message: 'Doctor assigned successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

appointmentRouter.post(
  ['/:appointmentId/check-in', '/:appointmentId/checkin'],
  validateBody(checkInAppointmentSchema),
  async (req, res, next) => {
    try {
      const updated = await AppointmentService.checkInAppointment(
        req.clinicId!,
        req.params.appointmentId,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

appointmentRouter.post(
  '/:appointmentId/no-show',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  async (req, res, next) => {
    try {
      const updated = await AppointmentService.markNoShow(
        req.clinicId!,
        req.params.appointmentId,
        req.user!.userId
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

appointmentRouter.patch(
  '/:appointmentId/notes',
  requireRole(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSING, ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST),
  async (req, res, next) => {
    try {
      const updated = await AppointmentService.updateInternalNotes(
        req.clinicId!,
        req.params.appointmentId,
        req.body.internalNotes
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

appointmentRouter.get('/:appointmentId/payment', async (req, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { appointmentId: req.params.appointmentId, clinicId: req.clinicId! },
    });
    if (!payment) {
      return res.status(404).json({ success: false, error: { code: 'PAYMENT_NOT_FOUND', message: 'No payment found for this appointment' } });
    }
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

appointmentRouter.post(
  '/:appointmentId/payment/verify',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST),
  validateBody(verifyPaymentSchema),
  async (req, res, next) => {
    try {
      const updated = await AppointmentService.verifyPayment(
        req.clinicId!,
        req.params.appointmentId,
        req.user!.userId,
        req.body.status,
        req.body.notes
      );
      res.json({ success: true, data: updated, message: `Payment marked as ${req.body.status}.` });
    } catch (err) {
      next(err);
    }
  }
);

appointmentRouter.delete(
  '/:appointmentId',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST),
  async (req, res, next) => {
    try {
      await AppointmentService.deleteAppointment(req.clinicId!, req.params.appointmentId);
      res.json({ success: true, message: 'Appointment deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
);


