import { Router } from 'express';
import { PharmacyService } from '../services/pharmacy.service.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { resolveHmsContext } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createPrescriptionSchema,
  payPrescriptionSchema,
  dispensePrescriptionSchema,
  searchPrescriptionsSchema,
  createMedicationSchema,
  updateMedicationSchema,
  ROLES,
} from '../types/index.js';

export const pharmacyRouter = Router();

pharmacyRouter.use(requireAuthenticatedUser, resolveHmsContext);

// List available drugs in hospital formulary
pharmacyRouter.get('/medications', async (req, res, next) => {
  try {
    const meds = await PharmacyService.listMedications(req.clinicId!);
    res.json({ success: true, data: meds });
  } catch (err) {
    next(err);
  }
});

// Add drug to hospital formulary (Pharmacist / Admin / Manager)
pharmacyRouter.post(
  '/medications',
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.MANAGER),
  validateBody(createMedicationSchema),
  async (req, res, next) => {
    try {
      const med = await PharmacyService.createMedication(
        req.clinicId!,
        req.body,
        req.user?.userId,
        req.membership?.role
      );
      res.status(201).json({ success: true, data: med });
    } catch (err) {
      next(err);
    }
  }
);

// Update drug in hospital formulary (Pharmacist / Admin / Manager)
pharmacyRouter.patch(
  '/medications/:id',
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.MANAGER),
  validateBody(updateMedicationSchema),
  async (req, res, next) => {
    try {
      const updated = await PharmacyService.updateMedication(
        req.clinicId!,
        req.params.id,
        req.body,
        req.user?.userId,
        req.membership?.role
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Delete drug from hospital formulary (Pharmacist / Admin / Manager)
pharmacyRouter.delete(
  '/medications/:id',
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.MANAGER),
  async (req, res, next) => {
    try {
      const result = await PharmacyService.deleteMedication(
        req.clinicId!,
        req.params.id,
        req.user?.userId,
        req.membership?.role
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// List prescriptions
pharmacyRouter.get(
  '/prescriptions',
  validateQuery(searchPrescriptionsSchema),
  async (req, res, next) => {
    try {
      const result = await PharmacyService.listPrescriptions(req.clinicId!, req.query as any);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Create prescription (Doctor / Admin / Manager)
pharmacyRouter.post(
  '/prescriptions',
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.MANAGER),
  validateBody(createPrescriptionSchema),
  async (req, res, next) => {
    try {
      const prescription = await PharmacyService.createPrescription(
        req.clinicId!,
        req.user!.userId,
        req.body
      );
      res.status(201).json({ success: true, data: prescription });
    } catch (err) {
      next(err);
    }
  }
);

// Get single prescription
pharmacyRouter.get('/prescriptions/:id', async (req, res, next) => {
  try {
    const prescription = await PharmacyService.getPrescriptionById(req.clinicId!, req.params.id);
    res.json({ success: true, data: prescription });
  } catch (err) {
    next(err);
  }
});

// Process payment for medications in Birr (Pharmacist / Receptionist / Admin / Manager)
pharmacyRouter.post(
  '/prescriptions/:id/pay',
  requireRole(ROLES.PHARMACIST, ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.MANAGER),
  validateBody(payPrescriptionSchema),
  async (req, res, next) => {
    try {
      const updated = await PharmacyService.payPrescription(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Dispense medications
pharmacyRouter.post(
  '/prescriptions/:id/dispense',
  requireRole(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.MANAGER),
  validateBody(dispensePrescriptionSchema),
  async (req, res, next) => {
    try {
      const updated = await PharmacyService.dispensePrescription(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);
