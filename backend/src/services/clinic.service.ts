import bcrypt from 'bcrypt';
import { prisma, UserRole, MembershipStatus, ClinicStatus } from '../config/prisma.js';
import { CreateClinicInput, UpdateClinicInput, UpdateClinicSettingsInput, CreateBranchInput, CreateUserInput } from '../types/index.js';
import { ActivityService } from './activity.service.js';

export class ClinicService {
  static async registerClinic(input: CreateClinicInput) {
    const existingClinic = await prisma.clinic.findUnique({
      where: { slug: input.slug.toLowerCase() },
    });
    if (existingClinic) {
      throw { statusCode: 409, code: 'SLUG_TAKEN', message: 'Hospital slug is already in use.' };
    }

    const adminPasswordHash = await bcrypt.hash(input.adminPassword, 10);

    return await prisma.$transaction(async (tx) => {
      let adminUser = await tx.user.findUnique({
        where: { email: input.adminEmail.toLowerCase() },
      });

      if (!adminUser) {
        adminUser = await tx.user.create({
          data: {
            email: input.adminEmail.toLowerCase(),
            passwordHash: adminPasswordHash,
            fullName: input.adminFullName,
            phone: input.phone,
          },
        });
      }

      const clinic = await tx.clinic.create({
        data: {
          name: input.name,
          slug: input.slug.toLowerCase(),
          email: input.email.toLowerCase(),
          phone: input.phone,
          address: input.address,
          timezone: input.timezone || 'UTC',
          logoUrl: input.logoUrl,
          status: ClinicStatus.ACTIVE,
        },
      });

      await tx.clinicSettings.create({
        data: {
          clinicId: clinic.id,
          appointmentDurationDefault: 30,
          cancellationNoticeHours: 24,
          maxAdvanceBookingDays: 60,
          queueTokenPrefix: 'T',
          queueAutoCall: false,
          publicBookingEnabled: true,
          emailNotificationsEnabled: true,
          smsNotificationsEnabled: false,
        },
      });

      const branch = await tx.branch.create({
        data: {
          clinicId: clinic.id,
          name: 'Main Hospital Center',
          address: input.address,
          phone: input.phone,
          isMain: true,
          isActive: true,
        },
      });

      await tx.clinicMembership.create({
        data: {
          clinicId: clinic.id,
          userId: adminUser.id,
          role: UserRole.ADMIN,
          status: MembershipStatus.ACTIVE,
        },
      });

      return {
        clinic,
        adminUser: { id: adminUser.id, email: adminUser.email, fullName: adminUser.fullName },
        mainBranch: branch,
      };
    });
  }

  static async getClinic(clinicId: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        settings: true,
        branches: { where: { isActive: true } },
      },
    });

    if (!clinic) {
      throw { statusCode: 404, code: 'CLINIC_NOT_FOUND', message: 'Hospital facility not found.' };
    }

    return clinic;
  }

  static async updateClinic(clinicId: string, input: UpdateClinicInput) {
    return await prisma.clinic.update({
      where: { id: clinicId },
      data: input,
    });
  }

  static async getSettings(clinicId: string) {
    const settings = await prisma.clinicSettings.findUnique({
      where: { clinicId },
    });
    if (!settings) {
      throw { statusCode: 404, code: 'SETTINGS_NOT_FOUND', message: 'Hospital settings not found.' };
    }
    return settings;
  }

  static async updateSettings(clinicId: string, input: UpdateClinicSettingsInput) {
    return await prisma.clinicSettings.update({
      where: { clinicId },
      data: input,
    });
  }

  static async listMembers(clinicId: string) {
    return await prisma.clinicMembership.findMany({
      where: { clinicId },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phone: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createUser(clinicId: string, input: CreateUserInput) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const normalizedEmail = input.email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: input.fullName,
          phone: input.phone,
          passwordHash,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: input.fullName,
          phone: input.phone,
          isActive: true,
        },
      });
    }

    const membership = await prisma.clinicMembership.upsert({
      where: {
        clinicId_userId: {
          clinicId,
          userId: user.id,
        },
      },
      update: {
        role: input.role as any,
        department: input.department,
        status: MembershipStatus.ACTIVE,
      },
      create: {
        clinicId,
        userId: user.id,
        role: input.role as any,
        department: input.department,
        status: MembershipStatus.ACTIVE,
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phone: true, isActive: true },
        },
      },
    });

    if (input.role === 'DOCTOR' || input.role === 'SPECIALIST') {
      const branch = await prisma.branch.findFirst({
        where: { clinicId, isActive: true },
        orderBy: { isMain: 'desc' },
      });

      if (branch) {
        const existingProfile = await prisma.doctorProfile.findFirst({
          where: { clinicId, userId: user.id },
        });

        if (existingProfile) {
          await prisma.doctorProfile.update({
            where: { id: existingProfile.id },
            data: {
              fullName: input.fullName,
              specialty: input.specialty || input.department || 'Specialist',
              phone: input.phone,
              email: normalizedEmail,
              isActive: true,
            },
          });
        } else {
          await prisma.doctorProfile.create({
            data: {
              clinicId,
              userId: user.id,
              branchId: branch.id,
              fullName: input.fullName,
              specialty: input.specialty || input.department || 'Specialist',
              phone: input.phone,
              email: normalizedEmail,
              appointmentDurationMinutes: 30,
              isActive: true,
            },
          });
        }
      }
    }

    await ActivityService.log({
      clinicId,
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: user.id,
      description: `Hospital staff member registered: ${input.fullName} (${input.role}) in department ${input.department || 'General'}`,
      metadata: {
        userId: user.id,
        email: user.email,
        role: input.role,
        department: input.department,
      },
    });

    return membership;
  }

  static async updateMemberRole(
    clinicId: string,
    membershipId: string,
    newRole?: UserRole,
    newStatus?: MembershipStatus,
    newDepartment?: string,
    fullName?: string,
    phone?: string,
    specialty?: string,
    actorId?: string,
    actorRole?: string
  ) {
    const member = await prisma.clinicMembership.findFirst({
      where: { id: membershipId, clinicId },
      include: { user: true },
    });

    if (!member) {
      throw { statusCode: 404, code: 'MEMBER_NOT_FOUND', message: 'Membership not found in this hospital.' };
    }

    // Update user personal details if passed
    if (fullName || phone) {
      const userUpdate: any = {};
      if (fullName) userUpdate.fullName = fullName;
      if (phone) userUpdate.phone = phone;
      await prisma.user.update({
        where: { id: member.userId },
        data: userUpdate,
      });
    }

    // Update doctor profile if applicable
    if (specialty || fullName || phone) {
      const docProfile = await prisma.doctorProfile.findFirst({
        where: { clinicId, userId: member.userId },
      });
      if (docProfile) {
        const docUpdate: any = {};
        if (fullName) docUpdate.fullName = fullName;
        if (phone) docUpdate.phone = phone;
        if (specialty) docUpdate.specialty = specialty;
        await prisma.doctorProfile.update({
          where: { id: docProfile.id },
          data: docUpdate,
        });
      }
    }

    const data: any = {};
    if (newRole) data.role = newRole;
    if (newStatus) data.status = newStatus;
    if (newDepartment !== undefined) data.department = newDepartment;

    const updated = await prisma.clinicMembership.update({
      where: { id: membershipId },
      data,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    await ActivityService.log({
      clinicId,
      actorId,
      actorRole: actorRole || 'ADMIN',
      action: 'USER_UPDATED',
      resourceType: 'USER',
      resourceId: member.userId,
      description: `Updated profile for ${fullName || member.user.fullName}: Role=${newRole || member.role}, Status=${newStatus || member.status}, Dept=${newDepartment || member.department || 'N/A'}`,
      metadata: {
        membershipId,
        userId: member.userId,
        role: newRole || member.role,
        status: newStatus || member.status,
      },
    });

    return updated;
  }

  static async removeMember(clinicId: string, membershipId: string, actorId?: string, actorRole?: string) {
    const member = await prisma.clinicMembership.findFirst({
      where: { id: membershipId, clinicId },
      include: { user: true },
    });

    if (!member) {
      throw { statusCode: 404, code: 'MEMBER_NOT_FOUND', message: 'Membership not found in this hospital.' };
    }

    await prisma.clinicMembership.delete({
      where: { id: membershipId },
    });

    await ActivityService.log({
      clinicId,
      actorId,
      actorRole: actorRole || 'ADMIN',
      action: 'USER_DELETED',
      resourceType: 'USER',
      resourceId: member.userId,
      description: `Removed hospital staff access for: ${member.user.fullName} (${member.role})`,
      metadata: {
        userId: member.userId,
        email: member.user.email,
        role: member.role,
      },
    });

    return { success: true };
  }

  static async listBranches(clinicId: string) {
    return await prisma.branch.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async createBranch(clinicId: string, input: CreateBranchInput) {
    return await prisma.branch.create({
      data: {
        clinicId,
        ...input,
      },
    });
  }

  static async updateBranch(clinicId: string, branchId: string, input: Partial<CreateBranchInput>) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clinicId },
    });
    if (!branch) {
      throw { statusCode: 404, code: 'BRANCH_NOT_FOUND', message: 'Branch not found in this hospital.' };
    }
    return await prisma.branch.update({
      where: { id: branchId },
      data: input,
    });
  }

  static async deleteBranch(clinicId: string, branchId: string) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clinicId },
    });
    if (!branch) {
      throw { statusCode: 404, code: 'BRANCH_NOT_FOUND', message: 'Branch not found in this hospital.' };
    }
    return await prisma.branch.delete({
      where: { id: branchId },
    });
  }
}

