import { prisma, PrescriptionStatus, PaymentStatus, PaymentMethod } from '../config/prisma.js';
import {
  CreatePrescriptionInput,
  PayPrescriptionInput,
  DispensePrescriptionInput,
  SearchPrescriptionsQuery,
  CreateMedicationInput,
  UpdateMedicationInput,
} from '../types/index.js';
import { ActivityService } from './activity.service.js';

export class PharmacyService {
  /**
   * Doctor orders a prescription for a patient with specified drugs, dosages, quantities, and ETB prices.
   */
  static async createPrescription(
    clinicId: string,
    doctorIdOrUserId: string,
    input: CreatePrescriptionInput
  ) {
    // 1. Resolve Doctor Profile
    let doctorId = input.doctorId;
    if (!doctorId) {
      const doc = await prisma.doctorProfile.findFirst({
        where: { clinicId, userId: doctorIdOrUserId },
      });
      if (doc) {
        doctorId = doc.id;
      } else {
        if (input.appointmentId) {
          const appt = await prisma.appointment.findUnique({ where: { id: input.appointmentId } });
          if (appt) doctorId = appt.doctorId;
        }
        if (!doctorId) {
          const firstDoc = await prisma.doctorProfile.findFirst({ where: { clinicId, isActive: true } });
          doctorId = firstDoc?.id;
        }
      }
    }

    if (!doctorId) {
      throw { statusCode: 400, code: 'DOCTOR_REQUIRED', message: 'A prescribing doctor profile is required.' };
    }

    // 2. Verify Patient
    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId, clinicId },
    });
    if (!patient) {
      throw { statusCode: 404, code: 'PATIENT_NOT_FOUND', message: 'Patient not found in this hospital.' };
    }

    // 3. Calculate Item Totals & Overall Total in Birr
    let prescriptionTotal = 0;
    const itemsData = input.items.map((item) => {
      const unitPrice = Number(item.unitPrice || 0);
      const quantity = Number(item.quantity || 1);
      const itemTotal = unitPrice * quantity;
      prescriptionTotal += itemTotal;

      return {
        medicationId: item.medicationId || undefined,
        drugName: item.drugName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity,
        unitPrice,
        totalPrice: itemTotal,
        instructions: item.instructions || undefined,
      };
    });

    // 4. Generate Unique Prescription Number
    const count = await prisma.prescription.count({ where: { clinicId } });
    const prescriptionNumber = `RX-${String(count + 1).padStart(5, '0')}`;

    // 5. Create Prescription Record
    const prescription = await prisma.prescription.create({
      data: {
        clinicId,
        patientId: input.patientId,
        doctorId,
        appointmentId: input.appointmentId || undefined,
        prescriptionNumber,
        diagnosis: input.diagnosis,
        status: PrescriptionStatus.PENDING,
        notes: input.notes || undefined,
        roomNumber: input.roomNumber || 'Room 105 - Central Pharmacy',
        totalAmount: prescriptionTotal,
        currency: 'ETB',
        paymentStatus: PaymentStatus.PENDING,
        items: {
          create: itemsData,
        },
      },
      include: {
        patient: true,
        doctor: true,
        appointment: {
          include: {
            service: true,
            branch: true,
          },
        },
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    // 6. If linked to an appointment, append prescription details to clinical notes
    if (input.appointmentId) {
      const appt = await prisma.appointment.findUnique({ where: { id: input.appointmentId } });
      if (appt) {
        const drugSummary = input.items.map((i) => `${i.drugName} (${i.dosage}, ${i.frequency})`).join(', ');
        const noteAddition = `\n[Prescription Sent to Pharmacy - ${prescriptionNumber}]: Total: ${prescriptionTotal} ETB | Drugs: ${drugSummary}`;
        await prisma.appointment.update({
          where: { id: input.appointmentId },
          data: {
            internalNotes: appt.internalNotes ? `${appt.internalNotes}${noteAddition}` : noteAddition,
          },
        });
      }
    }

    await ActivityService.log({
      clinicId,
      actorId: doctorIdOrUserId,
      actorRole: 'DOCTOR',
      action: 'PRESCRIPTION_CREATED',
      resourceType: 'PRESCRIPTION',
      resourceId: prescription.id,
      description: `Doctor prescribed ${input.items.length} medications (${prescriptionTotal} ETB) for ${patient.fullName}`,
      metadata: {
        patientName: patient.fullName,
        prescriptionNumber,
        totalAmount: prescriptionTotal,
        itemsCount: input.items.length,
      },
    });

    return prescription;
  }

  /**
   * List prescriptions with filters for Pharmacy queue, patient portal, or doctor view.
   */
  static async listPrescriptions(clinicId: string, query: SearchPrescriptionsQuery) {
    const { status, patientId, doctorId, appointmentId, query: textQuery, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = { clinicId };
    if (status) where.status = status as any;
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (appointmentId) where.appointmentId = appointmentId;

    if (textQuery) {
      where.OR = [
        { prescriptionNumber: { contains: textQuery, mode: 'insensitive' } },
        { diagnosis: { contains: textQuery, mode: 'insensitive' } },
        { patient: { fullName: { contains: textQuery, mode: 'insensitive' } } },
        { patient: { patientNumber: { contains: textQuery, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: true,
          doctor: true,
          appointment: {
            include: {
              service: true,
              branch: true,
            },
          },
          items: {
            include: {
              medication: true,
            },
          },
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single prescription with full details.
   */
  static async getPrescriptionById(clinicId: string, prescriptionId: string) {
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, clinicId },
      include: {
        patient: true,
        doctor: true,
        appointment: {
          include: {
            service: true,
            branch: true,
          },
        },
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    if (!prescription) {
      throw { statusCode: 404, code: 'PRESCRIPTION_NOT_FOUND', message: 'Prescription not found.' };
    }

    return prescription;
  }

  /**
   * Process payment for drugs at pharmacy counter (in cash, Telebirr 0995774866, or CBE 1000305532472).
   */
  static async payPrescription(
    clinicId: string,
    prescriptionId: string,
    processedByUserId: string,
    input: PayPrescriptionInput
  ) {
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, clinicId },
      include: { items: true, patient: true, doctor: true },
    });

    if (!prescription) {
      throw { statusCode: 404, code: 'PRESCRIPTION_NOT_FOUND', message: 'Prescription not found.' };
    }

    // Resolve pharmacist name
    let pharmacistName = 'Hospital Pharmacist';
    const user = await prisma.user.findUnique({ where: { id: processedByUserId } });
    if (user) pharmacistName = user.fullName;

    // Generate unique receipt number
    const count = await prisma.prescription.count({
      where: { clinicId, paymentStatus: PaymentStatus.VERIFIED },
    });
    const receiptNumber = input.receiptNumber || `RCP-PHARM-${String(count + 1).padStart(5, '0')}`;

    const now = new Date();
    const willDispense = input.dispenseImmediately !== false;

    // Update prescription payment & dispensation status
    const updated = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: willDispense ? PrescriptionStatus.DISPENSED : PrescriptionStatus.PAID,
        paymentStatus: PaymentStatus.VERIFIED,
        paymentMethod: input.paymentMethod as PaymentMethod,
        paymentRef: input.transactionRef || undefined,
        payerPhone: input.payerPhone || undefined,
        payerAccount: input.payerAccount || undefined,
        payerName: input.payerName || prescription.patient.fullName,
        receiptNumber,
        paidAt: now,
        dispensedAt: willDispense ? now : undefined,
        dispensedBy: willDispense ? pharmacistName : undefined,
        dispensationNotes: input.dispensationNotes || input.notes || 'Medications dispensed with patient counseling.',
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    // If dispensing, reduce inventory stock for linked medications
    if (willDispense) {
      for (const item of prescription.items) {
        if (item.medicationId) {
          await prisma.medication.update({
            where: { id: item.medicationId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          }).catch(() => null);
        }
      }
    }

    await ActivityService.log({
      clinicId,
      actorId: processedByUserId,
      actorRole: 'PHARMACIST',
      action: willDispense ? 'DRUG_PAYMENT_AND_DISPENSED' : 'DRUG_PAYMENT_VERIFIED',
      resourceType: 'PRESCRIPTION',
      resourceId: prescription.id,
      description: `Collected ${prescription.totalAmount} ETB (${input.paymentMethod}) for ${prescription.patient.fullName} - Receipt ${receiptNumber}`,
      metadata: {
        patientName: prescription.patient.fullName,
        receiptNumber,
        totalAmount: prescription.totalAmount,
        paymentMethod: input.paymentMethod,
        dispensed: willDispense,
      },
    });

    return updated;
  }

  /**
   * Dispense medications that were already paid.
   */
  static async dispensePrescription(
    clinicId: string,
    prescriptionId: string,
    pharmacistUserId: string,
    input: DispensePrescriptionInput
  ) {
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, clinicId },
      include: { items: true },
    });

    if (!prescription) {
      throw { statusCode: 404, code: 'PRESCRIPTION_NOT_FOUND', message: 'Prescription not found.' };
    }

    let pharmacistName = 'Hospital Pharmacist';
    const user = await prisma.user.findUnique({ where: { id: pharmacistUserId } });
    if (user) pharmacistName = user.fullName;

    const updated = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: PrescriptionStatus.DISPENSED,
        dispensedAt: new Date(),
        dispensedBy: pharmacistName,
        dispensationNotes: input.dispensationNotes || 'Medications dispensed with patient instructions.',
      },
      include: {
        patient: true,
        doctor: true,
        items: true,
      },
    });

    // Reduce inventory stock
    for (const item of prescription.items) {
      if (item.medicationId) {
        await prisma.medication.update({
          where: { id: item.medicationId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        }).catch(() => null);
      }
    }

    await ActivityService.log({
      clinicId,
      actorId: pharmacistUserId,
      actorRole: 'PHARMACIST',
      action: 'DRUGS_DISPENSED',
      resourceType: 'PRESCRIPTION',
      resourceId: prescriptionId,
      description: `Dispensed prescribed drugs to patient ${updated.patient?.fullName}`,
      metadata: {
        patientName: updated.patient?.fullName,
        prescriptionNumber: updated.prescriptionNumber,
      },
    });

    return updated;
  }

  /**
   * List available drugs/medications in hospital pharmacy formulary.
   */
  static async listMedications(clinicId: string) {
    return prisma.medication.findMany({
      where: { clinicId, isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Add medication to hospital pharmacy formulary with manufacture, expiry, and hospital input dates.
   */
  static async createMedication(clinicId: string, input: CreateMedicationInput, actorId?: string, actorRole?: string) {
    const med = await prisma.medication.create({
      data: {
        clinicId,
        name: input.name,
        genericName: input.genericName,
        category: input.category,
        strength: input.strength,
        dosageForm: input.dosageForm,
        unitPrice: input.unitPrice,
        stockQuantity: input.stockQuantity,
        batchNumber: input.batchNumber,
        manufactureDate: input.manufactureDate ? new Date(input.manufactureDate) : undefined,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
        hospitalInputDate: input.hospitalInputDate ? new Date(input.hospitalInputDate) : new Date(),
        requiresPrescription: input.requiresPrescription,
      },
    });

    await ActivityService.log({
      clinicId,
      actorId,
      actorRole: actorRole || 'PHARMACIST',
      action: 'DRUG_ADDED',
      resourceType: 'MEDICATION',
      resourceId: med.id,
      description: `Added drug to formulary: ${med.name} (${med.strength}) - Stock: ${med.stockQuantity}, Price: ${med.unitPrice} ETB`,
      metadata: {
        drugName: med.name,
        batchNumber: med.batchNumber,
        expiryDate: med.expiryDate,
      },
    });

    return med;
  }

  /**
   * Update medication in hospital pharmacy formulary.
   */
  static async updateMedication(
    clinicId: string,
    medicationId: string,
    input: UpdateMedicationInput,
    actorId?: string,
    actorRole?: string
  ) {
    const existing = await prisma.medication.findFirst({
      where: { id: medicationId, clinicId },
    });
    if (!existing) {
      throw { statusCode: 404, code: 'MEDICATION_NOT_FOUND', message: 'Medication not found in hospital formulary.' };
    }

    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.genericName !== undefined) data.genericName = input.genericName;
    if (input.category !== undefined) data.category = input.category;
    if (input.strength !== undefined) data.strength = input.strength;
    if (input.dosageForm !== undefined) data.dosageForm = input.dosageForm;
    if (input.unitPrice !== undefined) data.unitPrice = input.unitPrice;
    if (input.stockQuantity !== undefined) data.stockQuantity = input.stockQuantity;
    if (input.batchNumber !== undefined) data.batchNumber = input.batchNumber;
    if (input.manufactureDate !== undefined) data.manufactureDate = input.manufactureDate ? new Date(input.manufactureDate) : null;
    if (input.expiryDate !== undefined) data.expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
    if (input.hospitalInputDate !== undefined) data.hospitalInputDate = input.hospitalInputDate ? new Date(input.hospitalInputDate) : null;
    if (input.requiresPrescription !== undefined) data.requiresPrescription = input.requiresPrescription;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const updated = await prisma.medication.update({
      where: { id: medicationId },
      data,
    });

    await ActivityService.log({
      clinicId,
      actorId,
      actorRole: actorRole || 'PHARMACIST',
      action: 'DRUG_UPDATED',
      resourceType: 'MEDICATION',
      resourceId: updated.id,
      description: `Updated drug information: ${updated.name} (${updated.strength}) - Stock: ${updated.stockQuantity}, Price: ${updated.unitPrice} ETB`,
      metadata: {
        drugName: updated.name,
        batchNumber: updated.batchNumber,
        expiryDate: updated.expiryDate,
      },
    });

    return updated;
  }

  /**
   * Delete medication from hospital pharmacy formulary.
   */
  static async deleteMedication(clinicId: string, medicationId: string, actorId?: string, actorRole?: string) {
    const existing = await prisma.medication.findFirst({
      where: { id: medicationId, clinicId },
    });
    if (!existing) {
      throw { statusCode: 404, code: 'MEDICATION_NOT_FOUND', message: 'Medication not found in hospital formulary.' };
    }

    // Soft delete or delete
    await prisma.medication.delete({
      where: { id: medicationId },
    });

    await ActivityService.log({
      clinicId,
      actorId,
      actorRole: actorRole || 'PHARMACIST',
      action: 'DRUG_DELETED',
      resourceType: 'MEDICATION',
      resourceId: medicationId,
      description: `Removed drug from hospital formulary: ${existing.name} (${existing.strength})`,
      metadata: {
        drugName: existing.name,
      },
    });

    return { message: 'Medication removed from hospital formulary.' };
  }
}

