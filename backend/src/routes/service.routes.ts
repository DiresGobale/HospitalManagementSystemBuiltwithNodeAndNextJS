import { Router } from 'express';
import { ClinicServiceCatalog } from '../services/service.service.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { resolveClinicContext } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { createServiceSchema, updateServiceSchema, ROLES } from '../types/index.js';

export const serviceRouter = Router();

serviceRouter.get('/', requireAuthenticatedUser, resolveClinicContext, async (req, res, next) => {
  try {
    const services = await ClinicServiceCatalog.listServices(req.clinicId!);
    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
});

serviceRouter.get('/:serviceId', requireAuthenticatedUser, resolveClinicContext, async (req, res, next) => {
  try {
    const service = await ClinicServiceCatalog.getServiceById(req.clinicId!, req.params.serviceId);
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
});

serviceRouter.post(
  '/',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validateBody(createServiceSchema),
  async (req, res, next) => {
    try {
      const service = await ClinicServiceCatalog.createService(req.clinicId!, req.body);
      res.status(201).json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  }
);

serviceRouter.patch(
  '/:serviceId',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validateBody(updateServiceSchema),
  async (req, res, next) => {
    try {
      const updated = await ClinicServiceCatalog.updateService(req.clinicId!, req.params.serviceId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

serviceRouter.delete(
  '/:serviceId',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  async (req, res, next) => {
    try {
      await ClinicServiceCatalog.deleteService(req.clinicId!, req.params.serviceId);
      res.json({ success: true, message: 'Service deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
);


