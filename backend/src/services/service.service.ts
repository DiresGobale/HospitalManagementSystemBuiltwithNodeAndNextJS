import { prisma } from '../config/prisma.js';
import { CreateServiceInput, UpdateServiceInput } from '../types/index.js';

export class ClinicServiceCatalog {
  static async listServices(clinicId: string) {
    let services = await prisma.service.findMany({
      where: { clinicId, isActive: true },
      orderBy: { name: 'asc' },
    });

    if (services.length === 0) {
      const defaultServices = [
        { name: 'General Medical Consultation', description: 'Comprehensive primary physician evaluation & triage', durationMinutes: 30, price: 150 },
        { name: 'Emergency & Urgent Triage', description: 'Immediate trauma and acute illness assessment', durationMinutes: 20, price: 200 },
        { name: 'Cardiology Review & ECG', description: 'Heart rhythm assessment and specialist cardiac review', durationMinutes: 45, price: 350 },
        { name: 'Pediatric Well-Child Exam', description: 'Infant and child wellness examination and immunization', durationMinutes: 30, price: 180 },
        { name: 'Routine Health & Preventative Screening', description: 'Annual diagnostic vitals, lab order, and wellness review', durationMinutes: 30, price: 200 },
        { name: 'Orthopedic Bone & Joint Exam', description: 'Musculoskeletal evaluation and mobility consultation', durationMinutes: 30, price: 250 },
      ];
      await prisma.service.createMany({
        data: defaultServices.map((s) => ({ ...s, clinicId, isActive: true })),
        skipDuplicates: true,
      });
      services = await prisma.service.findMany({
        where: { clinicId, isActive: true },
        orderBy: { name: 'asc' },
      });
    }

    return services;
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

