import { prisma } from '../config/prisma.js';
import { CreateDoctorInput, UpdateDoctorInput, CreateScheduleInput, CreateScheduleExceptionInput, AvailabilityQuery } from '../types/index.js';

export class DoctorService {
  static async listDoctors(clinicId: string, branchId?: string) {
    return await prisma.doctorProfile.findMany({
      where: {
        clinicId,
        ...(branchId && { branchId }),
        isActive: true,
      },
      include: {
        branch: true,
        doctorServices: {
          include: { service: true },
        },
        doctorSchedules: {
          where: { isActive: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  static async getDoctorById(clinicId: string, doctorId: string) {
    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, clinicId },
      include: {
        branch: true,
        doctorServices: {
          include: { service: true },
        },
        doctorSchedules: {
          where: { isActive: true },
        },
        scheduleExceptions: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this hospital.' };
    }

    return doctor;
  }

  static async createDoctor(clinicId: string, input: CreateDoctorInput) {
    return await prisma.$transaction(async (tx) => {
      const doctor = await tx.doctorProfile.create({
        data: {
          clinicId,
          branchId: input.branchId,
          fullName: input.fullName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          specialty: input.specialty,
          licenseNumber: input.licenseNumber,
          appointmentDurationMinutes: input.appointmentDurationMinutes,
          isActive: true,
        },
      });

      if (input.serviceIds && input.serviceIds.length > 0) {
        await tx.doctorService.createMany({
          data: input.serviceIds.map((serviceId) => ({
            clinicId,
            doctorId: doctor.id,
            serviceId,
          })),
        });
      }

      return doctor;
    });
  }

  static async updateDoctor(clinicId: string, doctorId: string, input: UpdateDoctorInput) {
    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, clinicId },
    });

    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this hospital.' };
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.doctorProfile.update({
        where: { id: doctorId },
        data: {
          fullName: input.fullName,
          phone: input.phone,
          specialty: input.specialty,
          licenseNumber: input.licenseNumber,
          branchId: input.branchId,
          appointmentDurationMinutes: input.appointmentDurationMinutes,
          isActive: input.isActive,
        },
      });

      if (input.serviceIds) {
        await tx.doctorService.deleteMany({
          where: { doctorId },
        });

        if (input.serviceIds.length > 0) {
          await tx.doctorService.createMany({
            data: input.serviceIds.map((serviceId) => ({
              clinicId,
              doctorId,
              serviceId,
            })),
          });
        }
      }

      return updated;
    });
  }

  static async deleteDoctor(clinicId: string, doctorId: string) {
    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, clinicId },
    });
    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this hospital.' };
    }
    return await prisma.doctorProfile.update({
      where: { id: doctorId },
      data: { isActive: false },
    });
  }

  static async setSchedule(clinicId: string, input: CreateScheduleInput) {
    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: input.doctorId, clinicId },
    });
    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this hospital.' };
    }

    return await prisma.doctorSchedule.create({
      data: {
        clinicId,
        doctorId: input.doctorId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        slotDurationMinutes: input.slotDurationMinutes,
        breakStartTime: input.breakStartTime,
        breakEndTime: input.breakEndTime,
        isActive: input.isActive,
      },
    });
  }

  static async addScheduleException(clinicId: string, input: CreateScheduleExceptionInput) {
    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: input.doctorId, clinicId },
    });
    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found in this hospital.' };
    }

    return await prisma.scheduleException.create({
      data: {
        clinicId,
        doctorId: input.doctorId,
        date: input.date,
        isAvailable: input.isAvailable,
        startTime: input.startTime,
        endTime: input.endTime,
        reason: input.reason,
      },
    });
  }

  static async getAvailability(clinicId: string, query: AvailabilityQuery) {
    const { doctorId, date, serviceId } = query;

    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, clinicId, isActive: true },
      include: {
        doctorSchedules: { where: { isActive: true } },
        scheduleExceptions: { where: { date } },
      },
    });

    if (!doctor) {
      throw { statusCode: 404, code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found.' };
    }

    let slotDuration = doctor.appointmentDurationMinutes || 30;
    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: { id: serviceId, clinicId, isActive: true },
      });
      if (service && service.durationMinutes) {
        slotDuration = service.durationMinutes;
      }
    }

    const exception = doctor.scheduleExceptions[0];
    if (exception && !exception.isAvailable) {
      return { date, doctorId, slots: [] };
    }

    const targetDate = new Date(`${date}T00:00:00Z`);
    const dayOfWeek = targetDate.getUTCDay();

    const regularSchedule = doctor.doctorSchedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!regularSchedule && !exception) {
      return { date, doctorId, slots: [] };
    }

    const startTimeStr = exception?.startTime || regularSchedule?.startTime || '09:00';
    const endTimeStr = exception?.endTime || regularSchedule?.endTime || '17:00';
    const breakStartStr = regularSchedule?.breakStartTime;
    const breakEndStr = regularSchedule?.breakEndTime;

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    let breakStartM = -1;
    let breakEndM = -1;
    if (breakStartStr && breakEndStr) {
      const [bsh, bsm] = breakStartStr.split(':').map(Number);
      const [beh, bem] = breakEndStr.split(':').map(Number);
      breakStartM = bsh * 60 + bsm;
      breakEndM = beh * 60 + bem;
    }

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        doctorId,
        scheduledStartAt: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['CANCELLED'] },
      },
      select: { scheduledStartAt: true, scheduledEndAt: true },
    });

    const slots: Array<{ startTime: string; endTime: string; isAvailable: boolean }> = [];

    for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
      const slotStartH = Math.floor(m / 60).toString().padStart(2, '0');
      const slotStartM = (m % 60).toString().padStart(2, '0');
      const slotEndMinutes = m + slotDuration;
      const slotEndH = Math.floor(slotEndMinutes / 60).toString().padStart(2, '0');
      const slotEndM = (slotEndMinutes % 60).toString().padStart(2, '0');

      const slotStartIso = `${date}T${slotStartH}:${slotStartM}:00.000Z`;
      const slotEndIso = `${date}T${slotEndH}:${slotEndM}:00.000Z`;

      const slotStartDate = new Date(slotStartIso);
      const slotEndDate = new Date(slotEndIso);

      let overlapsBreak = false;
      if (breakStartM !== -1 && breakEndM !== -1) {
        if (m < breakEndM && slotEndMinutes > breakStartM) {
          overlapsBreak = true;
        }
      }

      let overlapsAppointment = false;
      for (const appt of existingAppointments) {
        if (slotStartDate < appt.scheduledEndAt && slotEndDate > appt.scheduledStartAt) {
          overlapsAppointment = true;
          break;
        }
      }

      slots.push({
        startTime: slotStartIso,
        endTime: slotEndIso,
        isAvailable: !overlapsBreak && !overlapsAppointment,
      });
    }

    return {
      date,
      doctorId,
      slotDurationMinutes: slotDuration,
      slots,
    };
  }
}

