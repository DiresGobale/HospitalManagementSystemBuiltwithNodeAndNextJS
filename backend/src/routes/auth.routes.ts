import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { resolveClinicContext } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { loginSchema, registerPatientSchema, inviteStaffSchema, acceptInviteSchema, refreshTokenSchema, forgotPasswordVerifyEmailSchema, forgotPasswordResetSchema, ROLES } from '../types/index.js';

export const authRouter = Router();

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/forgot-password/verify-email', validateBody(forgotPasswordVerifyEmailSchema), async (req, res, next) => {
  try {
    const result = await AuthService.verifyEmailForPasswordReset(req.body.email);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/forgot-password/reset', validateBody(forgotPasswordResetSchema), async (req, res, next) => {
  try {
    const result = await AuthService.resetPassword(req.body);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/register', validateBody(registerPatientSchema), async (req, res, next) => {
  try {
    const result = await AuthService.registerPatient(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', validateBody(refreshTokenSchema), async (req, res, next) => {
  try {
    const result = await AuthService.refresh(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    await AuthService.logout(req.body?.refreshToken);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuthenticatedUser, async (req, res, next) => {
  try {
    const user = await AuthService.getMe(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  '/invite',
  requireAuthenticatedUser,
  resolveClinicContext,
  requireRole(ROLES.ADMIN),
  validateBody(inviteStaffSchema),
  async (req, res, next) => {
    try {
      const result = await AuthService.inviteStaff(req.clinicId!, req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post('/accept-invite', validateBody(acceptInviteSchema), async (req, res, next) => {
  try {
    const result = await AuthService.acceptInvite(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

