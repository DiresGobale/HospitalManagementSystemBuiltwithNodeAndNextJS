import { Router } from 'express';
import { ReportsService } from '../services/reports.service.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { resolveClinicContext } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../types/index.js';

export const reportsRouter = Router();

reportsRouter.use(requireAuthenticatedUser, resolveClinicContext);

reportsRouter.get(
  '/overview',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST),
  async (req, res, next) => {
    try {
      const date = req.query.date as string | undefined;
      const data = await ReportsService.getClinicOverview(req.clinicId!, date);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

reportsRouter.get(
  '/doctors/:doctorId',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR),
  async (req, res, next) => {
    try {
      if (req.membership?.role === ROLES.DOCTOR && req.doctorProfileId !== req.params.doctorId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only view your own performance metrics.' },
        });
      }

      const data = await ReportsService.getDoctorPerformance(req.clinicId!, req.params.doctorId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

