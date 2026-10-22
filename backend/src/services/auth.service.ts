import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma, UserRole, MembershipStatus, ClinicStatus } from '../config/prisma.js';
import { env } from '../config/env.js';
import { LoginInput, RegisterPatientInput, InviteStaffInput, AcceptInviteInput, ForgotPasswordVerifyEmailInput, ForgotPasswordResetInput } from '../types/index.js';

export class AuthService {
  private static generateAccessToken(user: { id: string; email: string; fullName: string }) {
    return jwt.sign(
      { userId: user.id, email: user.email, fullName: user.fullName },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }

  private static async createRefreshToken(userId: string) {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  static async login(input: LoginInput) {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { clinic: true },
        },
      },
    });

    if (!user) {
      console.warn(`[Auth] Login failed: No user found with email "${email}"`);
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    if (!user.isActive) {
      console.warn(`[Auth] Login failed: User "${email}" is inactive`);
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      console.warn(`[Auth] Login failed: Incorrect password for user "${email}"`);
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        memberships: user.memberships.map((m) => ({
          clinicId: m.clinicId,
          clinicName: m.clinic.name,
          clinicSlug: m.clinic.slug,
          role: m.role,
          status: m.status,
        })),
      },
    };
  }

  static async registerPatient(input: RegisterPatientInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw { statusCode: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' };
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          fullName: input.fullName,
          phone: input.phone || null,
        },
      });

      // Target clinic resolution
      let targetClinicId = input.clinicId;
      if (!targetClinicId) {
        const defaultClinic = await tx.clinic.findFirst({
          where: { status: ClinicStatus.ACTIVE },
          orderBy: { createdAt: 'asc' },
        });
        if (defaultClinic) {
          targetClinicId = defaultClinic.id;
        }
      }

      let patient = null;
      let membership = null;
      if (targetClinicId) {
        membership = await tx.clinicMembership.create({
          data: {
            clinicId: targetClinicId,
            userId: user.id,
            role: UserRole.PATIENT,
            status: MembershipStatus.ACTIVE,
          },
          include: { clinic: true },
        });

        const count = await tx.patient.count({ where: { clinicId: targetClinicId } });
        const patientNumber = `PT-${(count + 1).toString().padStart(5, '0')}`;

        patient = await tx.patient.create({
          data: {
            clinicId: targetClinicId,
            userId: user.id,
            patientNumber,
            fullName: input.fullName,
            phone: input.phone || '',
            email: input.email.toLowerCase(),
            dateOfBirth: input.dateOfBirth || null,
            address: input.address || null,
            gender: input.gender || null,
            emergencyContact: input.emergencyContact || null,
          },
        });
      }

      const accessToken = this.generateAccessToken(user);
      const rawRefreshToken = crypto.randomBytes(40).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

      await tx.refreshToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      return {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          patientId: patient?.id,
          memberships: membership
            ? [
                {
                  clinicId: membership.clinicId,
                  clinicName: membership.clinic.name,
                  clinicSlug: membership.clinic.slug,
                  role: membership.role,
                  status: membership.status,
                },
              ]
            : [],
        },
      };
    });
  }

  static async refresh(rawRefreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const existingToken = await prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existingToken || existingToken.revokedAt || existingToken.expiresAt < new Date()) {
      throw { statusCode: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token expired or revoked.' };
    }

    const newRawToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawToken).digest('hex');
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { revokedAt: new Date(), replacedByToken: newTokenHash },
      }),
      prisma.refreshToken.create({
        data: { userId: existingToken.userId, tokenHash: newTokenHash, expiresAt },
      }),
    ]);

    const accessToken = this.generateAccessToken(existingToken.user);
    return { accessToken, refreshToken: newRawToken };
  }

  static async logout(rawRefreshToken: string) {
    if (!rawRefreshToken) return;
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
        memberships: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                logoUrl: true,
                timezone: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found.' };
    }

    return user;
  }

  static async inviteStaff(clinicId: string, creatorId: string, input: InviteStaffInput) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitation = await prisma.invitation.create({
      data: {
        clinicId,
        email: input.email.toLowerCase(),
        role: input.role as UserRole,
        token: rawToken,
        branchId: input.branchId,
        specialty: input.specialty,
        expiresAt,
        createdBy: creatorId,
      },
    });

    return {
      invitationId: invitation.id,
      token: rawToken,
      expiresAt,
    };
  }

  static async acceptInvite(input: AcceptInviteInput) {
    const invite = await prisma.invitation.findUnique({
      where: { token: input.token },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw { statusCode: 400, code: 'INVALID_INVITE', message: 'Invitation is invalid or has expired.' };
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    return await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: invite.email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: invite.email,
            passwordHash,
            fullName: invite.email.split('@')[0],
          },
        });
      }

      await tx.clinicMembership.upsert({
        where: {
          clinicId_userId: { clinicId: invite.clinicId, userId: user.id },
        },
        create: {
          clinicId: invite.clinicId,
          userId: user.id,
          role: invite.role,
          status: MembershipStatus.ACTIVE,
        },
        update: {
          role: invite.role,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (invite.role === UserRole.DOCTOR && invite.branchId) {
        await tx.doctorProfile.create({
          data: {
            clinicId: invite.clinicId,
            userId: user.id,
            branchId: invite.branchId,
            fullName: user.fullName,
            specialty: invite.specialty || 'General Practitioner',
            email: user.email,
            phone: user.phone || '',
          },
        });
      }

      await tx.invitation.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return { success: true, message: 'Invitation accepted successfully.' };
    });
  }

  static async verifyEmailForPasswordReset(emailInput: string) {
    const email = emailInput.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
      },
    });

    if (!user) {
      throw {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'No registered account found with this email address.',
      };
    }

    if (!user.isActive) {
      throw {
        statusCode: 403,
        code: 'USER_INACTIVE',
        message: 'This account has been deactivated. Please contact your hospital administrator.',
      };
    }

    return {
      email: user.email,
      fullName: user.fullName,
    };
  }

  static async resetPassword(input: ForgotPasswordResetInput) {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: true,
      },
    });

    if (!user) {
      throw {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'No account found with this email address.',
      };
    }

    if (!user.isActive) {
      throw {
        statusCode: 403,
        code: 'USER_INACTIVE',
        message: 'This account has been deactivated.',
      };
    }

    if (input.confirmPassword && input.newPassword !== input.confirmPassword) {
      throw {
        statusCode: 400,
        code: 'PASSWORD_MISMATCH',
        message: 'Passwords do not match. Please verify and re-enter.',
      };
    }

    if (input.newPassword.length < 8) {
      throw {
        statusCode: 400,
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters long.',
      };
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);

    // Update password in PostgreSQL
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    // Revoke old sessions in PostgreSQL
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    // Record password reset activity in database AuditLog
    const primaryClinicId = user.memberships[0]?.clinicId || null;
    const primaryRole = user.memberships[0]?.role || 'USER';

    await prisma.auditLog.create({
      data: {
        clinicId: primaryClinicId,
        actorId: user.id,
        actorRole: primaryRole,
        action: 'PASSWORD_RESET',
        resourceType: 'User',
        resourceId: user.id,
        metadata: {
          email: user.email,
          fullName: user.fullName,
          resetAt: new Date().toISOString(),
          status: 'SUCCESS',
        },
      },
    });

    return {
      success: true,
      message: 'Password has been successfully updated in database.',
    };
  }
}

