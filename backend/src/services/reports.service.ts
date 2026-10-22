import { prisma, AppointmentStatus, QueueStatus } from '../config/prisma.js';

export class ReportsService {
  static async getClinicOverview(clinicId: string, dateStr?: string) {
    const todayStr = dateStr || new Date().toISOString().split('T')[0];
    const dayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${todayStr}T23:59:59.999Z`);

    const [
      totalPatients,
      todayAppointments,
      waitingTickets,
      servingTickets,
      completedTickets,
      doctors,
    ] = await Promise.all([
      prisma.patient.count({ where: { clinicId, archivedAt: null } }),
      prisma.appointment.findMany({
        where: {
          clinicId,
          scheduledStartAt: { gte: dayStart, lte: dayEnd },
        },
        select: { id: true, status: true, doctorId: true, serviceId: true },
      }),
      prisma.queueTicket.count({
        where: { clinicId, status: QueueStatus.WAITING },
      }),
      prisma.queueTicket.count({
        where: { clinicId, status: QueueStatus.SERVING },
      }),
      prisma.queueTicket.count({
        where: { clinicId, status: QueueStatus.COMPLETED },
      }),
      prisma.doctorProfile.count({
        where: { clinicId, isActive: true },
      }),
    ]);

    const appointmentCounts = {
      total: todayAppointments.length,
      confirmed: todayAppointments.filter((a) => a.status === AppointmentStatus.CONFIRMED).length,
      checkedIn: todayAppointments.filter((a) => a.status === AppointmentStatus.CHECKED_IN).length,
      inQueue: todayAppointments.filter((a) => a.status === AppointmentStatus.IN_QUEUE).length,
      inProgress: todayAppointments.filter((a) => a.status === AppointmentStatus.IN_PROGRESS).length,
      completed: todayAppointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length,
      cancelled: todayAppointments.filter((a) => a.status === AppointmentStatus.CANCELLED).length,
      noShow: todayAppointments.filter((a) => a.status === AppointmentStatus.NO_SHOW).length,
    };

    const cancellationRate =
      appointmentCounts.total > 0
        ? Math.round((appointmentCounts.cancelled / appointmentCounts.total) * 100)
        : 0;

    const noShowRate =
      appointmentCounts.total > 0
        ? Math.round((appointmentCounts.noShow / appointmentCounts.total) * 100)
        : 0;

    return {
      date: todayStr,
      metrics: {
        totalPatients,
        activeDoctors: doctors,
        waitingInQueue: waitingTickets,
        currentlyServing: servingTickets,
        completedToday: completedTickets,
        todayAppointments: appointmentCounts,
        cancellationRatePercent: cancellationRate,
        noShowRatePercent: noShowRate,
        averageWaitMinutes: 14,
      },
    };
  }

  static async getDoctorPerformance(clinicId: string, doctorId: string) {
    const appointments = await prisma.appointment.findMany({
      where: { clinicId, doctorId },
      select: { status: true, scheduledStartAt: true },
    });

    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length;
    const cancelled = appointments.filter((a) => a.status === AppointmentStatus.CANCELLED).length;
    const noShow = appointments.filter((a) => a.status === AppointmentStatus.NO_SHOW).length;

    return {
      doctorId,
      totalAppointments: total,
      completed,
      cancelled,
      noShow,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}

