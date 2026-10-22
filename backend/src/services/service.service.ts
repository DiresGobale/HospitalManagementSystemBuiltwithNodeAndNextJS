import { prisma } from '../config/prisma.js';
import { CreateServiceInput, UpdateServiceInput } from '../types/index.js';

export class ClinicServiceCatalog {
  static async listServices(clinicId: string) {
    return await prisma.service.findMany({
      where: { clinicId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  static async getServiceById(clinicId: string, serviceId: string) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, clinicId },
    });
    if (!service) {
      throw { statusCode: 404, code: 'SERVICE_NOT_FOUND', message: 'Service not found in this hospital.' };
    }
    return service;
  }

  static async createService(clinicId: string, input: CreateServiceInput) {
    return await prisma.service.create({
      data: {
        clinicId,
        name: input.name,
        description: input.description,
        durationMinutes: input.durationMinutes,
        price: input.price,
        isActive: input.isActive,
      },
    });
  }

  static async updateService(clinicId: string, serviceId: string, input: UpdateServiceInput) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, clinicId },
    });
    if (!service) {
      throw { statusCode: 404, code: 'SERVICE_NOT_FOUND', message: 'Service not found in this hospital.' };
    }

    return await prisma.service.update({
      where: { id: serviceId },
      data: input,
    });
  }

  static async deleteService(clinicId: string, serviceId: string) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, clinicId },
    });
    if (!service) {
      throw { statusCode: 404, code: 'SERVICE_NOT_FOUND', message: 'Service not found in this hospital.' };
    }

    return await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
  }
}

