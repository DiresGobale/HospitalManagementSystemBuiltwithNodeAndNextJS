import { Router } from 'express';
import { DiagnosticService } from '../services/diagnostic.service.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { resolveClinicContext } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createDiagnosticOrderSchema,
  completeDiagnosticOrderSchema,
  reviewDiagnosticOrderSchema,
  searchDiagnosticOrdersSchema,
  ROLES,
} from '../types/index.js';

export const diagnosticRouter = Router();

diagnosticRouter.use(requireAuthenticatedUser, resolveClinicContext);

// 1. List diagnostic orders
diagnosticRouter.get(
  '/',
  validateQuery(searchDiagnosticOrdersSchema),
  async (req, res, next) => {
    try {
      const query = { ...(req.query as any) };

      // If caller is patient, only show their own diagnostic orders
      if (req.membership?.role === ROLES.PATIENT) {
        query.patientId = req.patientId;
      }

      const results = await DiagnosticService.listDiagnosticOrders(req.clinicId!, query);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Get diagnostic order by ID
diagnosticRouter.get('/:orderId', async (req, res, next) => {
  try {
    const order = await DiagnosticService.getDiagnosticOrderById(req.clinicId!, req.params.orderId);

    // Patient access check
    if (req.membership?.role === ROLES.PATIENT && order.patientId !== req.patientId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_PATIENT_ACCESS', message: 'You can only view your own diagnostic records.' },
      });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// 3. Create diagnostic order (Doctor / Specialist / Lab orders diagnostics)
diagnosticRouter.post(
  '/',
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN, ROLES.SPECIALIST, ROLES.LABORATORY, ROLES.NURSING),
  validateBody(createDiagnosticOrderSchema),
  async (req, res, next) => {
    try {
      const order = await DiagnosticService.createDiagnosticOrder(
        req.clinicId!,
        req.user!.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        data: order,
        message: 'Diagnostic investigation ordered successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// 4. Specialist / Lab starts diagnostic procedure
diagnosticRouter.patch(
  '/:orderId/start',
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN, ROLES.SPECIALIST, ROLES.LABORATORY),
  async (req, res, next) => {
    try {
      const updated = await DiagnosticService.startDiagnosticOrder(
        req.clinicId!,
        req.params.orderId,
        req.user!.userId
      );
      res.json({
        success: true,
        data: updated,
        message: 'Diagnostic investigation procedure started.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// 5. Specialist / Lab completes findings and resends to referring doctor
diagnosticRouter.post(
  '/:orderId/complete',
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN, ROLES.SPECIALIST, ROLES.LABORATORY),
  validateBody(completeDiagnosticOrderSchema),
  async (req, res, next) => {
    try {
      const updated = await DiagnosticService.completeDiagnosticOrder(
        req.clinicId!,
        req.params.orderId,
        req.user!.userId,
        req.body
      );
      res.json({
        success: true,
        data: updated,
        message: 'Laboratory / Diagnostic results finalized and returned to referring doctor.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// 6. Referring doctor reviews returned diagnostics and conducts final patient counseling
diagnosticRouter.post(
  '/:orderId/review',
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN),
  validateBody(reviewDiagnosticOrderSchema),
  async (req, res, next) => {
    try {
      const updated = await DiagnosticService.reviewDiagnosticOrder(
        req.clinicId!,
        req.params.orderId,
        req.user!.userId,
        req.body
      );
      res.json({
        success: true,
        data: updated,
        message: 'Doctor completed post-X-ray counseling and finalized treatment plan.',
      });
    } catch (err) {
      next(err);
    }
  }
);

