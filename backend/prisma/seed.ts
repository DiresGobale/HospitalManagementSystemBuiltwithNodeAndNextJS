import {
  PrismaClient,
  UserRole,
  ClinicStatus,
  MembershipStatus,
  AppointmentStatus,
  QueueSessionStatus,
  QueuePriority,
  QueueStatus,
  DiagnosticType,
  DiagnosticStatus,
  PrescriptionStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Comprehensive Enterprise Database Seed ---');

  // Clear existing data (in reverse foreign key dependency order)
  await prisma.auditLog.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.queueTicketStatusHistory.deleteMany();
  await prisma.queueTicket.deleteMany();
  await prisma.queueCounter.deleteMany();
  await prisma.queueSession.deleteMany();
  await prisma.appointmentStatusHistory.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.diagnosticOrder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.scheduleException.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctorService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.clinicMembership.deleteMany();
  await prisma.clinicSettings.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // =========================================================================
  // 1. SUBSCRIPTION PLANS
  // =========================================================================
  const starterPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Starter Healthcare Tier',
      slug: 'starter',
      maxDoctors: 5,
      maxBranches: 2,
      maxStaff: 10,
      priceMonthly: 49.0,
      features: { analytics: 'basic', sms: false, multiBranch: false },
      isActive: true,
    },
  });

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Enterprise Multi-Specialty Tier',
      slug: 'pro',
      maxDoctors: 30,
      maxBranches: 10,
      maxStaff: 100,
      priceMonthly: 199.0,
      features: { analytics: 'advanced', sms: true, multiBranch: true, queueTvs: true },
      isActive: true,
    },
  });

  // =========================================================================
  // 2. PRIMARY CLINIC A: METRO HEALTH CLINIC
  // =========================================================================
  const clinicA = await prisma.clinic.create({
    data: {
      name: 'Metro Health Medical Center',
      slug: 'metro-health',
      email: 'contact@metrohealth.com',
      phone: '+1-555-1000',
      address: '100 Medical Center Blvd, New York, NY 10001',
      timezone: 'America/New_York',
      status: ClinicStatus.ACTIVE,
      settings: {
        create: {
          appointmentDurationDefault: 30,
          cancellationNoticeHours: 24,
          maxAdvanceBookingDays: 60,
          queueTokenPrefix: 'T',
          queueAutoCall: false,
          publicBookingEnabled: true,
          emailNotificationsEnabled: true,
          smsNotificationsEnabled: true,
          telebirrNumber: '0995774866',
          telebirrAccountName: 'Metro Health Medical Center',
          cbeAccountNumber: '1000305532472',
          cbeAccountName: 'Metro Health Medical Center',
        },
      },
    },
  });

  // Clinic B for Multi-Tenant Isolation
  const clinicB = await prisma.clinic.create({
    data: {
      name: 'City Care Regional Hospital',
      slug: 'city-care',
      email: 'contact@citycare.com',
      phone: '+1-555-2000',
      address: '200 Downtown Ave, Chicago, IL 60601',
      timezone: 'America/Chicago',
      status: ClinicStatus.ACTIVE,
      settings: {
        create: {
          appointmentDurationDefault: 20,
          cancellationNoticeHours: 12,
          maxAdvanceBookingDays: 30,
          queueTokenPrefix: 'B',
          queueAutoCall: false,
          publicBookingEnabled: true,
          emailNotificationsEnabled: true,
          smsNotificationsEnabled: false,
        },
      },
    },
  });

  // Subscriptions
  await prisma.subscription.create({
    data: {
      clinicId: clinicA.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.subscription.create({
    data: {
      clinicId: clinicB.id,
      planId: starterPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // =========================================================================
  // 3. CLINIC BRANCHES
  // =========================================================================
  const branchA1 = await prisma.branch.create({
    data: {
      clinicId: clinicA.id,
      name: 'Main Hospital Campus',
      address: '100 Medical Center Blvd, Suite 200, NY',
      phone: '+1-555-1001',
      isMain: true,
      isActive: true,
    },
  });

  const branchA2 = await prisma.branch.create({
    data: {
      clinicId: clinicA.id,
      name: 'Downtown Specialist Center',
      address: '250 Park Ave, Suite 400, NY',
      phone: '+1-555-1002',
      isMain: false,
      isActive: true,
    },
  });

  const branchA3 = await prisma.branch.create({
    data: {
      clinicId: clinicA.id,
      name: 'Westside Outpatient Pavilion',
      address: '540 West 57th St, Suite 100, NY',
      phone: '+1-555-1003',
      isMain: false,
      isActive: true,
    },
  });

  const branchB1 = await prisma.branch.create({
    data: {
      clinicId: clinicB.id,
      name: 'Chicago Downtown Branch',
      address: '200 Downtown Ave, Suite 101, Chicago, IL',
      phone: '+1-555-2001',
      isMain: true,
      isActive: true,
    },
  });

  // =========================================================================
  // 4. CLINIC SERVICES (Catalog of Treatments & Consultations)
  // =========================================================================
  const srvGeneral = await prisma.service.create({
    data: {
      clinicId: clinicA.id,
      name: 'General Medical Consultation',
      description: 'Comprehensive physical examination, vital signs, and diagnostic consultation',
      durationMinutes: 30,
      price: 500.0,
      isActive: true,
    },
  });

  const srvCardio = await prisma.service.create({
    data: {
      clinicId: clinicA.id,
      name: 'Cardiology Review & ECG',
      description: 'Cardiac assessment, ECG tracing, blood pressure evaluation, and heart health review',
      durationMinutes: 45,
      price: 1200.0,
      isActive: true,
    },
  });

  const srvPediatrics = await prisma.service.create({
    data: {
      clinicId: clinicA.id,
      name: 'Pediatric Well-Child Exam',
      description: 'Growth milestones, pediatric physical exam, developmental assessment, and immunizations',
      durationMinutes: 30,
      price: 650.0,
      isActive: true,
    },
  });

  const srvDermatology = await prisma.service.create({
    data: {
      clinicId: clinicA.id,
      name: 'Dermatology Skin Assessment',
      description: 'Dermoscopy evaluation, lesion inspection, acne treatment, and skin biopsy consultation',
      durationMinutes: 30,
      price: 850.0,
      isActive: true,
    },
  });

  const srvNeurology = await prisma.service.create({
    data: {
      clinicId: clinicA.id,
      name: 'Neurology Consultation',
      description: 'Cranial nerve exam, motor/sensory function evaluation, headache and spine assessment',
      durationMinutes: 45,
      price: 1400.0,
      isActive: true,
    },
  });

  const srvOrthopedics = await prisma.service.create({
    data: {
      clinicId: clinicA.id,
      name: 'Orthopedic Bone & Joint Exam',
      description: 'Joint mobility, musculoskeletal pain, sports injury triage, and mobility review',
      durationMinutes: 40,
      price: 950.0,
      isActive: true,
    },
  });

  const srvWellness = await prisma.service.create({
    data: {
      clinicId: clinicA.id,
      name: 'Routine Health & Preventative Screening',
      description: 'Lipid profile, blood sugar, routine wellness check, and lifestyle counseling',
      durationMinutes: 30,
      price: 450.0,
      isActive: true,
    },
  });

  const srvUrgent = await prisma.service.create({
    data: {
      clinicId: clinicA.id,
      name: 'Urgent Care & Walk-In Triage',
      description: 'Acute illness, minor lacerations, respiratory infection evaluation, and fever triage',
      durationMinutes: 20,
      price: 700.0,
      isActive: true,
    },
  });

  // Services for Clinic B
  const srvClinicB = await prisma.service.create({
    data: {
      clinicId: clinicB.id,
      name: 'Urgent Care Assessment',
      description: 'General urgent care visit',
      durationMinutes: 20,
      price: 60.0,
      isActive: true,
    },
  });

  // =========================================================================
  // 5. STAFF USERS (Admin, Manager, Receptionists, Doctors)
  // =========================================================================
  // Admin & Operations Staff
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@metrohealth.com',
      passwordHash,
      fullName: 'Dr. Arthur Pendelton',
      phone: '+1-555-0100',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@metrohealth.com',
      passwordHash,
      fullName: 'Sarah Jenkins',
      phone: '+1-555-0101',
    },
  });

  const receptionistUser1 = await prisma.user.create({
    data: {
      email: 'receptionist@metrohealth.com',
      passwordHash,
      fullName: 'Emily Davis',
      phone: '+1-555-0103',
    },
  });

  const receptionistUser2 = await prisma.user.create({
    data: {
      email: 'receptionist2@metrohealth.com',
      passwordHash,
      fullName: 'Jessica Miller',
      phone: '+1-555-0105',
    },
  });

  const pharmacistUser = await prisma.user.create({
    data: {
      email: 'pharmacist@metrohealth.com',
      passwordHash,
      fullName: 'Dr. Marcus Vance, PharmD',
      phone: '+1-555-0106',
    },
  });

  const anesthesiaUser = await prisma.user.create({
    data: {
      email: 'anesthesia@metrohealth.com',
      passwordHash,
      fullName: 'Dr. Dawit Bekele (Anesthesia)',
      phone: '+1-555-0107',
    },
  });

  const nurseUser = await prisma.user.create({
    data: {
      email: 'nurse@metrohealth.com',
      passwordHash,
      fullName: 'Nurse Betelhem Tadesse',
      phone: '+1-555-0108',
    },
  });

  const labUser = await prisma.user.create({
    data: {
      email: 'lab@metrohealth.com',
      passwordHash,
      fullName: 'Tigist Worku (Laboratory)',
      phone: '+1-555-0109',
    },
  });

  // Clinic B Admin
  const clinicBAdminUser = await prisma.user.create({
    data: {
      email: 'admin@citycare.com',
      passwordHash,
      fullName: 'Alice Walker',
      phone: '+1-555-0200',
    },
  });

  // =========================================================================
  // 6. DOCTOR USERS & FULL PROFILES ACROSS SPECIALTIES
  // =========================================================================
  const doctorsData = [
    {
      email: 'doctor@metrohealth.com',
      fullName: 'Dr. Gregory House',
      specialty: 'Internal Medicine & Diagnostics',
      licenseNumber: 'MD-987654',
      phone: '+1-555-0102',
      branchId: branchA1.id,
      duration: 30,
      services: [srvGeneral.id, srvWellness.id],
    },
    {
      email: 'doctor.yang@metrohealth.com',
      fullName: 'Dr. Cristina Yang',
      specialty: 'Cardiology & Cardiovascular Care',
      licenseNumber: 'MD-876543',
      phone: '+1-555-0111',
      branchId: branchA1.id,
      duration: 45,
      services: [srvCardio.id, srvGeneral.id],
    },
    {
      email: 'doctor.shepherd@metrohealth.com',
      fullName: 'Dr. Derek Shepherd',
      specialty: 'Neurology & Spine Care',
      licenseNumber: 'MD-765432',
      phone: '+1-555-0112',
      branchId: branchA2.id,
      duration: 45,
      services: [srvNeurology.id, srvGeneral.id],
    },
    {
      email: 'doctor.robbins@metrohealth.com',
      fullName: 'Dr. Arizona Robbins',
      specialty: 'Pediatrics & Adolescent Medicine',
      licenseNumber: 'MD-654321',
      phone: '+1-555-0113',
      branchId: branchA1.id,
      duration: 30,
      services: [srvPediatrics.id, srvWellness.id],
    },
    {
      email: 'doctor.sloan@metrohealth.com',
      fullName: 'Dr. Mark Sloan',
      specialty: 'Dermatology & Skin Surgery',
      licenseNumber: 'MD-543210',
      phone: '+1-555-0114',
      branchId: branchA2.id,
      duration: 30,
      services: [srvDermatology.id, srvGeneral.id],
    },
    {
      email: 'doctor.grey@metrohealth.com',
      fullName: 'Dr. Meredith Grey',
      specialty: 'General Surgery & Acute Care',
      licenseNumber: 'MD-432109',
      phone: '+1-555-0115',
      branchId: branchA3.id,
      duration: 30,
      services: [srvGeneral.id, srvUrgent.id],
    },
    {
      email: 'doctor.bailey@metrohealth.com',
      fullName: 'Dr. Miranda Bailey',
      specialty: 'Family Medicine & Primary Care',
      licenseNumber: 'MD-321098',
      phone: '+1-555-0116',
      branchId: branchA1.id,
      duration: 30,
      services: [srvGeneral.id, srvWellness.id, srvOrthopedics.id],
    },
  ];

  const createdDoctorProfiles: any[] = [];

  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        passwordHash,
        fullName: doc.fullName,
        phone: doc.phone,
      },
    });

    await prisma.clinicMembership.create({
      data: {
        clinicId: clinicA.id,
        userId: user.id,
        role: UserRole.DOCTOR,
        department: doc.specialty || 'Medicine',
        status: MembershipStatus.ACTIVE,
      },
    });

    const profile = await prisma.doctorProfile.create({
      data: {
        clinicId: clinicA.id,
        userId: user.id,
        branchId: doc.branchId,
        fullName: doc.fullName,
        specialty: doc.specialty,
        licenseNumber: doc.licenseNumber,
        phone: doc.phone,
        email: doc.email,
        appointmentDurationMinutes: doc.duration,
        isActive: true,
      },
    });

    createdDoctorProfiles.push(profile);

    // Link doctor to their medical services
    for (const srvId of doc.services) {
      await prisma.doctorService.create({
        data: {
          clinicId: clinicA.id,
          doctorId: profile.id,
          serviceId: srvId,
        },
      });
    }

    // Weekly Schedules (Monday through Saturday, 09:00 - 17:00 with lunch break)
    for (let day = 1; day <= 6; day++) {
      await prisma.doctorSchedule.create({
        data: {
          clinicId: clinicA.id,
          doctorId: profile.id,
          dayOfWeek: day,
          startTime: '08:30',
          endTime: day === 6 ? '13:00' : '17:30',
          slotDurationMinutes: doc.duration,
          breakStartTime: day === 6 ? null : '12:30',
          breakEndTime: day === 6 ? null : '13:30',
          isActive: true,
        },
      });
    }
  }

  // Clinic B Doctor
  const docUserB = await prisma.user.create({
    data: {
      email: 'doctor.b@citycare.com',
      passwordHash,
      fullName: 'Dr. Robert Citycare',
      phone: '+1-555-2111',
    },
  });

  await prisma.clinicMembership.create({
    data: {
      clinicId: clinicB.id,
      userId: docUserB.id,
      role: UserRole.DOCTOR,
      status: MembershipStatus.ACTIVE,
    },
  });

  const docProfileB = await prisma.doctorProfile.create({
    data: {
      clinicId: clinicB.id,
      userId: docUserB.id,
      branchId: branchB1.id,
      fullName: 'Dr. Robert Citycare',
      specialty: 'Urgent Care Practitioner',
      phone: '+1-555-2111',
      email: 'doctor.b@citycare.com',
      appointmentDurationMinutes: 20,
      isActive: true,
    },
  });

  await prisma.doctorService.create({
    data: {
      clinicId: clinicB.id,
      doctorId: docProfileB.id,
      serviceId: srvClinicB.id,
    },
  });

  // Assign Memberships for Super Admin, Admin, Receptionists, Pharmacy, Anesthesia, Nursing, Lab
  await prisma.clinicMembership.createMany({
    data: [
      { clinicId: clinicA.id, userId: adminUser.id, role: UserRole.SUPER_ADMIN, department: 'Platform Administration', status: MembershipStatus.ACTIVE },
      { clinicId: clinicA.id, userId: managerUser.id, role: UserRole.ADMIN, department: 'Hospital Operations', status: MembershipStatus.ACTIVE },
      { clinicId: clinicA.id, userId: receptionistUser1.id, role: UserRole.RECEPTIONIST, department: 'Administration', status: MembershipStatus.ACTIVE },
      { clinicId: clinicA.id, userId: receptionistUser2.id, role: UserRole.RECEPTIONIST, department: 'Administration', status: MembershipStatus.ACTIVE },
      { clinicId: clinicA.id, userId: pharmacistUser.id, role: UserRole.PHARMACIST, department: 'Pharmacy', status: MembershipStatus.ACTIVE },
      { clinicId: clinicA.id, userId: anesthesiaUser.id, role: UserRole.SPECIALIST, department: 'Anesthesia', status: MembershipStatus.ACTIVE },
      { clinicId: clinicA.id, userId: nurseUser.id, role: UserRole.NURSING, department: 'Nursing', status: MembershipStatus.ACTIVE },
      { clinicId: clinicA.id, userId: labUser.id, role: UserRole.LABORATORY, department: 'Laboratory', status: MembershipStatus.ACTIVE },
      { clinicId: clinicB.id, userId: clinicBAdminUser.id, role: UserRole.SUPER_ADMIN, department: 'Platform Administration', status: MembershipStatus.ACTIVE },
    ],
  });

  // Doctor profile for Anesthesia Specialist
  await prisma.doctorProfile.create({
    data: {
      clinicId: clinicA.id,
      userId: anesthesiaUser.id,
      branchId: branchA1.id,
      fullName: 'Dr. Dawit Bekele',
      specialty: 'Anesthesiology & Critical Care',
      licenseNumber: 'MD-ETH-9921',
      phone: '+1-555-0107',
      email: 'anesthesia@metrohealth.com',
      appointmentDurationMinutes: 30,
      isActive: true,
    },
  });

  // =========================================================================
  // 7. PATIENTS WITH STRICTLY UNIQUE PATIENT NUMBERS AND DEMOGRAPHICS
  // =========================================================================
  const patientsSeedData = [
    {
      email: 'patient@example.com',
      fullName: 'John Doe',
      phone: '+1-555-0104',
      dob: '1985-06-15',
      gender: 'MALE',
      bloodGroup: 'O+',
      allergies: 'Penicillin, Pollen',
      emergencyContact: 'Jane Doe (+1-555-0999)',
      address: '123 Elm Street, New York, NY',
    },
    {
      email: 'rfrost@example.com',
      fullName: 'Robert Frost',
      phone: '+1-555-3344',
      dob: '1974-03-26',
      gender: 'MALE',
      bloodGroup: 'A+',
      allergies: 'None',
      emergencyContact: 'Elinor Frost (+1-555-3345)',
      address: '45 Poetry Way, Suite 3B, New York, NY',
    },
    {
      email: 'emily.watson@example.com',
      fullName: 'Emily Watson',
      phone: '+1-555-4455',
      dob: '1992-11-04',
      gender: 'FEMALE',
      bloodGroup: 'B+',
      allergies: 'Peanuts, Tree nuts',
      emergencyContact: 'George Watson (+1-555-4456)',
      address: '78 Broadway Ave, Apt 12, New York, NY',
    },
    {
      email: 'm.chang@example.com',
      fullName: 'Michael Chang',
      phone: '+1-555-5566',
      dob: '1980-08-22',
      gender: 'MALE',
      bloodGroup: 'AB+',
      allergies: 'Sulfa antibiotics',
      emergencyContact: 'Lisa Chang (+1-555-5567)',
      address: '142 Queens Blvd, Flushing, NY',
    },
    {
      email: 'sarah.connor@example.com',
      fullName: 'Sarah Connor',
      phone: '+1-555-6677',
      dob: '1988-02-18',
      gender: 'FEMALE',
      bloodGroup: 'O-',
      allergies: 'Latex',
      emergencyContact: 'John Connor (+1-555-6678)',
      address: '300 Cyberdyne Way, Los Angeles, CA',
    },
    {
      email: 'david.b@example.com',
      fullName: 'David Beckham',
      phone: '+1-555-7788',
      dob: '1975-05-02',
      gender: 'MALE',
      bloodGroup: 'A-',
      allergies: 'None',
      emergencyContact: 'Victoria Beckham (+1-555-7789)',
      address: '23 Stadium Road, Brooklyn, NY',
    },
    {
      email: 'helen.k@example.com',
      fullName: 'Helen Keller',
      phone: '+1-555-8899',
      dob: '1995-10-12',
      gender: 'FEMALE',
      bloodGroup: 'B-',
      allergies: 'Aspirin, Ibuprofen',
      emergencyContact: 'Kate Keller (+1-555-8890)',
      address: '99 Ivy Hill Rd, Bronx, NY',
    },
    {
      email: 'jwilson@example.com',
      fullName: 'Dr. James Wilson (Patient)',
      phone: '+1-555-9900',
      dob: '1970-12-05',
      gender: 'MALE',
      bloodGroup: 'O+',
      allergies: 'None',
      emergencyContact: 'Julie Wilson (+1-555-9901)',
      address: '500 Diagnostic Way, Princeton, NJ',
    },
    {
      email: 'sophia.r@example.com',
      fullName: 'Sophia Rodriguez',
      phone: '+1-555-1212',
      dob: '2001-07-19',
      gender: 'FEMALE',
      bloodGroup: 'A+',
      allergies: 'Iodine contrast dye',
      emergencyContact: 'Maria Rodriguez (+1-555-1213)',
      address: '77 Manhattan Ave, Apt 5A, NY',
    },
    {
      email: 'alex.w@example.com',
      fullName: 'Alexander Wright',
      phone: '+1-555-3434',
      dob: '1968-04-30',
      gender: 'MALE',
      bloodGroup: 'O+',
      allergies: 'Shellfish',
      emergencyContact: 'Claire Wright (+1-555-3435)',
      address: '12 Harbor View Rd, Staten Island, NY',
    },
  ];

  const createdPatients: any[] = [];

  for (let i = 0; i < patientsSeedData.length; i++) {
    const pData = patientsSeedData[i];
    const patientNumber = `PT-${String(10001 + i).padStart(5, '0')}`;

    const user = await prisma.user.create({
      data: {
        email: pData.email,
        passwordHash,
        fullName: pData.fullName,
        phone: pData.phone,
      },
    });

    await prisma.clinicMembership.create({
      data: {
        clinicId: clinicA.id,
        userId: user.id,
        role: UserRole.PATIENT,
        status: MembershipStatus.ACTIVE,
      },
    });

    const patient = await prisma.patient.create({
      data: {
        clinicId: clinicA.id,
        userId: user.id,
        patientNumber,
        fullName: pData.fullName,
        dateOfBirth: pData.dob,
        phone: pData.phone,
        email: pData.email,
        address: pData.address,
        gender: pData.gender,
        bloodGroup: pData.bloodGroup,
        allergies: pData.allergies,
        emergencyContact: pData.emergencyContact,
        consentStatus: true,
      },
    });

    createdPatients.push(patient);
  }

  // Clinic B Patient
  const patientUserB = await prisma.user.create({
    data: {
      email: 'patientb@citycare.com',
      passwordHash,
      fullName: 'City Care Patient 1',
      phone: '+1-555-9988',
    },
  });

  await prisma.clinicMembership.create({
    data: {
      clinicId: clinicB.id,
      userId: patientUserB.id,
      role: UserRole.PATIENT,
      status: MembershipStatus.ACTIVE,
    },
  });

  await prisma.patient.create({
    data: {
      clinicId: clinicB.id,
      userId: patientUserB.id,
      patientNumber: 'PT-20001',
      fullName: 'City Care Patient 1',
      dateOfBirth: '1990-01-01',
      phone: '+1-555-9988',
      email: 'patientb@citycare.com',
      consentStatus: true,
    },
  });

  // =========================================================================
  // 8. APPOINTMENTS WITH REALISTIC DIVERSE STATUSES
  // =========================================================================
  const docHouse = createdDoctorProfiles[0];
  const docYang = createdDoctorProfiles[1];
  const docShepherd = createdDoctorProfiles[2];
  const docRobbins = createdDoctorProfiles[3];
  const docSloan = createdDoctorProfiles[4];
  const docGrey = createdDoctorProfiles[5];
  const docBailey = createdDoctorProfiles[6];

  const now = new Date();
  const todayMorning1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  const todayMorning2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30, 0);
  const todayMorning3 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
  const todayMorning4 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0);
  const todayAfternoon1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
  const todayAfternoon2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 45, 0);
  const todayAfternoon3 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30, 0);
  const tomorrowMorning1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
  const tomorrowMorning2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0, 0);
  const tomorrowAfternoon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 30, 0);

  // Group 1: PENDING APPROVALS (REQUESTED) - Created online by patients, waiting for Receptionist approval!
  const apptReq1 = await prisma.appointment.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      patientId: createdPatients[2].id, // Emily Watson
      doctorId: docHouse.id,
      serviceId: srvGeneral.id,
      appointmentNumber: 'APT-10001',
      scheduledStartAt: todayAfternoon2,
      scheduledEndAt: new Date(todayAfternoon2.getTime() + 30 * 60 * 1000),
      status: AppointmentStatus.REQUESTED,
      reasonForVisit: 'Persistent migraines, dizziness, and mild nausea over the past week',
      internalNotes: null,
      createdBy: createdPatients[2].userId!,
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptReq1.id,
      fromStatus: null,
      toStatus: AppointmentStatus.REQUESTED,
      changedBy: createdPatients[2].userId!,
      reason: 'Online booking requested by patient (pending receptionist approval)',
    },
  });

  await prisma.payment.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptReq1.id,
      patientId: createdPatients[2].id,
      amount: 500.0,
      currency: 'ETB',
      method: 'TELEBIRR',
      status: 'PENDING',
      transactionRef: 'TB-0995774866-9481',
      payerPhone: '0995774866',
      payerName: 'Emily Watson',
      receiptNumber: 'RCP-TB-10001',
      notes: 'Transferred to Telebirr 0995774866 (Ref: TB-0995774866-9481)',
    },
  });

  const apptReq2 = await prisma.appointment.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      patientId: createdPatients[3].id, // Michael Chang
      doctorId: docYang.id,
      serviceId: srvCardio.id,
      appointmentNumber: 'APT-10002',
      scheduledStartAt: tomorrowMorning1,
      scheduledEndAt: new Date(tomorrowMorning1.getTime() + 45 * 60 * 1000),
      status: AppointmentStatus.REQUESTED,
      reasonForVisit: 'Follow-up on elevated home blood pressure readings and heart palpitations',
      internalNotes: null,
      createdBy: createdPatients[3].userId!,
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptReq2.id,
      fromStatus: null,
      toStatus: AppointmentStatus.REQUESTED,
      changedBy: createdPatients[3].userId!,
      reason: 'Online booking requested by patient (pending receptionist approval)',
    },
  });

  await prisma.payment.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptReq2.id,
      patientId: createdPatients[3].id,
      amount: 1200.0,
      currency: 'ETB',
      method: 'CBE',
      status: 'PENDING',
      transactionRef: 'CBE-1000305532472-3841',
      payerAccount: '1000305532472',
      payerName: 'Michael Chang',
      receiptNumber: 'RCP-CBE-10002',
      notes: 'Transferred to CBE Acc 1000305532472 (Ref: CBE-1000305532472-3841)',
    },
  });

  const apptReq3 = await prisma.appointment.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      patientId: createdPatients[8].id, // Sophia Rodriguez
      doctorId: docRobbins.id,
      serviceId: srvPediatrics.id,
      appointmentNumber: 'APT-10003',
      scheduledStartAt: tomorrowMorning2,
      scheduledEndAt: new Date(tomorrowMorning2.getTime() + 30 * 60 * 1000),
      status: AppointmentStatus.REQUESTED,
      reasonForVisit: 'Annual pediatric developmental wellness checkup and vaccine updates',
      internalNotes: null,
      createdBy: createdPatients[8].userId!,
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptReq3.id,
      fromStatus: null,
      toStatus: AppointmentStatus.REQUESTED,
      changedBy: createdPatients[8].userId!,
      reason: 'Online booking requested by patient (pending receptionist approval)',
    },
  });

  await prisma.payment.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptReq3.id,
      patientId: createdPatients[8].id,
      amount: 650.0,
      currency: 'ETB',
      method: 'TELEBIRR',
      status: 'PENDING',
      transactionRef: 'TB-0995774866-8219',
      payerPhone: '0995774866',
      payerName: 'Sophia Rodriguez',
      receiptNumber: 'RCP-TB-10003',
      notes: 'Transferred to Telebirr 0995774866 (Ref: TB-0995774866-8219)',
    },
  });

  // Group 2: CONFIRMED (Approved & ready for check-in today)
  const apptConf1 = await prisma.appointment.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      patientId: createdPatients[0].id, // John Doe
      doctorId: docHouse.id,
      serviceId: srvGeneral.id,
      appointmentNumber: 'APT-10004',
      scheduledStartAt: todayMorning3,
      scheduledEndAt: new Date(todayMorning3.getTime() + 30 * 60 * 1000),
      status: AppointmentStatus.CONFIRMED,
      reasonForVisit: 'Routine physical wellness check and seasonal allergy review',
      internalNotes: 'Confirmed by front-desk. Fasting blood work recommended.',
      createdBy: adminUser.id,
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptConf1.id,
      fromStatus: AppointmentStatus.REQUESTED,
      toStatus: AppointmentStatus.CONFIRMED,
      changedBy: receptionistUser1.id,
      reason: 'Appointment approved & confirmed by reception',
    },
  });

  await prisma.payment.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptConf1.id,
      patientId: createdPatients[0].id,
      amount: 500.0,
      currency: 'ETB',
      method: 'TELEBIRR',
      status: 'VERIFIED',
      transactionRef: 'TB-0995774866-1049',
      payerPhone: '0995774866',
      payerName: 'John Doe',
      receiptNumber: 'RCP-TB-10004',
      verifiedBy: receptionistUser1.id,
      verifiedAt: new Date(),
      notes: 'Verified via Telebirr merchant portal',
    },
  });

  const apptConf2 = await prisma.appointment.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA2.id,
      patientId: createdPatients[1].id, // Robert Frost
      doctorId: docShepherd.id,
      serviceId: srvNeurology.id,
      appointmentNumber: 'APT-10005',
      scheduledStartAt: todayAfternoon1,
      scheduledEndAt: new Date(todayAfternoon1.getTime() + 45 * 60 * 1000),
      status: AppointmentStatus.CONFIRMED,
      reasonForVisit: 'Cervical spine stiffness and radiating arm tingling',
      internalNotes: 'Patient advised to bring previous MRI scans.',
      createdBy: receptionistUser1.id,
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptConf2.id,
      fromStatus: null,
      toStatus: AppointmentStatus.CONFIRMED,
      changedBy: receptionistUser1.id,
      reason: 'Scheduled at reception desk',
    },
  });

  await prisma.payment.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptConf2.id,
      patientId: createdPatients[1].id,
      amount: 1400.0,
      currency: 'ETB',
      method: 'CBE',
      status: 'VERIFIED',
      transactionRef: 'CBE-1000305532472-8821',
      payerAccount: '1000305532472',
      payerName: 'Robert Frost',
      receiptNumber: 'RCP-CBE-10005',
      verifiedBy: receptionistUser1.id,
      verifiedAt: new Date(),
      notes: 'Verified via CBE online portal deposit',
    },
  });

  // Group 3: CHECKED_IN & IN_QUEUE (Patients who have arrived and have live tokens)
  const apptQueue1 = await prisma.appointment.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      patientId: createdPatients[4].id, // Sarah Connor
      doctorId: docSloan.id,
      serviceId: srvDermatology.id,
      appointmentNumber: 'APT-10006',
      scheduledStartAt: todayMorning1,
      scheduledEndAt: new Date(todayMorning1.getTime() + 30 * 60 * 1000),
      status: AppointmentStatus.IN_QUEUE,
      reasonForVisit: 'Skin pigmentation change and suspicious mole examination',
      internalNotes: 'Checked in at counter. Priority normal.',
      createdBy: receptionistUser1.id,
    },
  });

  await prisma.payment.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptQueue1.id,
      patientId: createdPatients[4].id,
      amount: 850.0,
      currency: 'ETB',
      method: 'TELEBIRR',
      status: 'VERIFIED',
      transactionRef: 'TB-0995774866-5512',
      payerPhone: '0995774866',
      payerName: 'Sarah Connor',
      receiptNumber: 'RCP-TB-10006',
      verifiedBy: receptionistUser1.id,
      verifiedAt: new Date(),
      notes: 'Paid via Telebirr SuperApp and verified at check-in',
    },
  });

  const apptQueue2 = await prisma.appointment.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      patientId: createdPatients[5].id, // David Beckham
      doctorId: docBailey.id,
      serviceId: srvOrthopedics.id,
      appointmentNumber: 'APT-10007',
      scheduledStartAt: todayMorning2,
      scheduledEndAt: new Date(todayMorning2.getTime() + 40 * 60 * 1000),
      status: AppointmentStatus.IN_QUEUE,
      reasonForVisit: 'Right knee acute joint effusion following sports activity',
      internalNotes: 'Urgent triage requested due to localized pain.',
      createdBy: receptionistUser1.id,
    },
  });

  await prisma.payment.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptQueue2.id,
      patientId: createdPatients[5].id,
      amount: 950.0,
      currency: 'ETB',
      method: 'CBE',
      status: 'VERIFIED',
      transactionRef: 'CBE-1000305532472-9901',
      payerAccount: '1000305532472',
      payerName: 'David Beckham',
      receiptNumber: 'RCP-CBE-10007',
      verifiedBy: receptionistUser1.id,
      verifiedAt: new Date(),
      notes: 'Paid via CBE Birr mobile transfer',
    },
  });

  // Group 4: COMPLETED
  const apptComp = await prisma.appointment.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      patientId: createdPatients[6].id, // Helen Keller
      doctorId: docGrey.id,
      serviceId: srvGeneral.id,
      appointmentNumber: 'APT-10008',
      scheduledStartAt: new Date(todayMorning1.getTime() - 90 * 60 * 1000),
      scheduledEndAt: new Date(todayMorning1.getTime() - 60 * 60 * 1000),
      status: AppointmentStatus.COMPLETED,
      reasonForVisit: 'Follow-up on post-surgical wound healing',
      internalNotes: 'Wound clean and healing well. Discharged with clean dressing.',
      createdBy: docGrey.userId!,
    },
  });

  await prisma.payment.create({
    data: {
      clinicId: clinicA.id,
      appointmentId: apptComp.id,
      patientId: createdPatients[6].id,
      amount: 500.0,
      currency: 'ETB',
      method: 'TELEBIRR',
      status: 'VERIFIED',
      transactionRef: 'TB-0995774866-4432',
      payerPhone: '0995774866',
      payerName: 'Helen Keller',
      receiptNumber: 'RCP-TB-10008',
      verifiedBy: receptionistUser1.id,
      verifiedAt: new Date(),
      notes: 'Consultation completed and settled in full',
    },
  });

  // Group 5: CANCELLED
  const apptCanc = await prisma.appointment.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      patientId: createdPatients[9].id, // Alexander Wright
      doctorId: docYang.id,
      serviceId: srvCardio.id,
      appointmentNumber: 'APT-10009',
      scheduledStartAt: todayMorning4,
      scheduledEndAt: new Date(todayMorning4.getTime() + 45 * 60 * 1000),
      status: AppointmentStatus.CANCELLED,
      reasonForVisit: 'Cardiology stress test screening',
      cancellationReason: 'Patient called to reschedule due to international travel conflict',
      createdBy: receptionistUser1.id,
    },
  });

  // Group 6: NO-SHOW
  const apptNoShow = await prisma.appointment.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      patientId: createdPatients[7].id, // James Wilson
      doctorId: docHouse.id,
      serviceId: srvWellness.id,
      appointmentNumber: 'APT-10010',
      scheduledStartAt: new Date(todayMorning1.getTime() - 60 * 60 * 1000),
      scheduledEndAt: new Date(todayMorning1.getTime() - 30 * 60 * 1000),
      status: AppointmentStatus.NO_SHOW,
      reasonForVisit: 'Routine preventative bloodwork evaluation',
      internalNotes: 'Patient did not arrive within 30-min window. Marked as No-Show.',
      createdBy: receptionistUser1.id,
    },
  });

  // =========================================================================
  // 9. LIVE QUEUE SESSIONS & TOKEN MANAGEMENT
  // =========================================================================
  const todayDateStr = now.toISOString().split('T')[0];

  // Queue Session 1: Main Campus Reception & Diagnostics (Dr. House)
  const queueSession1 = await prisma.queueSession.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      doctorId: docHouse.id,
      serviceId: srvGeneral.id,
      operatingDate: todayDateStr,
      status: QueueSessionStatus.OPEN,
    },
  });

  await prisma.queueCounter.create({
    data: {
      clinicId: clinicA.id,
      queueSessionId: queueSession1.id,
      currentNumber: 5,
    },
  });

  // Queue Session 2: Cardiovascular Suite (Dr. Yang)
  const queueSession2 = await prisma.queueSession.create({
    data: {
      clinicId: clinicA.id,
      branchId: branchA1.id,
      doctorId: docYang.id,
      serviceId: srvCardio.id,
      operatingDate: todayDateStr,
      status: QueueSessionStatus.OPEN,
    },
  });

  await prisma.queueCounter.create({
    data: {
      clinicId: clinicA.id,
      queueSessionId: queueSession2.id,
      currentNumber: 2,
    },
  });

  // Live Queue Tickets for Session 1:
  // Ticket 1: SERVING
  await prisma.queueTicket.create({
    data: {
      clinicId: clinicA.id,
      queueSessionId: queueSession1.id,
      patientId: createdPatients[4].id, // Sarah Connor
      appointmentId: apptQueue1.id,
      tokenNumber: 1,
      displayToken: 'T-001',
      priority: QueuePriority.NORMAL,
      status: QueueStatus.SERVING,
      checkedInAt: new Date(Date.now() - 35 * 60 * 1000),
      calledAt: new Date(Date.now() - 15 * 60 * 1000),
      serviceStartedAt: new Date(Date.now() - 10 * 60 * 1000),
      createdBy: receptionistUser1.id,
    },
  });

  // Ticket 2: CALLED (Flashing on waiting room display!)
  await prisma.queueTicket.create({
    data: {
      clinicId: clinicA.id,
      queueSessionId: queueSession1.id,
      patientId: createdPatients[5].id, // David Beckham
      appointmentId: apptQueue2.id,
      tokenNumber: 2,
      displayToken: 'T-002',
      priority: QueuePriority.URGENT,
      status: QueueStatus.CALLED,
      checkedInAt: new Date(Date.now() - 25 * 60 * 1000),
      calledAt: new Date(Date.now() - 2 * 60 * 1000),
      createdBy: receptionistUser1.id,
    },
  });

  // Ticket 3: WAITING (Normal priority)
  await prisma.queueTicket.create({
    data: {
      clinicId: clinicA.id,
      queueSessionId: queueSession1.id,
      patientId: createdPatients[0].id, // John Doe
      tokenNumber: 3,
      displayToken: 'T-003',
      priority: QueuePriority.NORMAL,
      status: QueueStatus.WAITING,
      checkedInAt: new Date(Date.now() - 20 * 60 * 1000),
      createdBy: receptionistUser1.id,
    },
  });

  // Ticket 4: WAITING (VIP Priority)
  await prisma.queueTicket.create({
    data: {
      clinicId: clinicA.id,
      queueSessionId: queueSession1.id,
      patientId: createdPatients[1].id, // Robert Frost
      tokenNumber: 4,
      displayToken: 'T-004',
      priority: QueuePriority.VIP,
      status: QueueStatus.WAITING,
      checkedInAt: new Date(Date.now() - 12 * 60 * 1000),
      createdBy: receptionistUser1.id,
    },
  });

  // Ticket 5: WAITING (Urgent Care Priority)
  await prisma.queueTicket.create({
    data: {
      clinicId: clinicA.id,
      queueSessionId: queueSession1.id,
      patientId: createdPatients[8].id, // Sophia Rodriguez
      tokenNumber: 5,
      displayToken: 'T-005',
      priority: QueuePriority.URGENT,
      status: QueueStatus.WAITING,
      checkedInAt: new Date(Date.now() - 5 * 60 * 1000),
      createdBy: receptionistUser2.id,
    },
  });

  // =========================================================================
  // 10. DIAGNOSTIC ORDERS (X-RAY SPECIALIST IMAGING & RETURN-TO-DOCTOR PIPELINE)
  // =========================================================================
  // Order 1: REQUESTED - Doctor referred patient to Specialist X-Ray Room
  await prisma.diagnosticOrder.create({
    data: {
      clinicId: clinicA.id,
      patientId: createdPatients[5].id, // David Beckham
      appointmentId: apptQueue2.id,
      referringDoctorId: docBailey.id,
      specialistId: docGrey.id,
      type: DiagnosticType.X_RAY,
      title: 'Right Knee Diagnostic X-Ray',
      bodyPart: 'Right Knee Joint (AP & Lateral Views)',
      clinicalNotes: 'Acute joint effusion and medial tenderness after sports injury. Rule out tibial plateau fracture or meniscus tear.',
      urgency: QueuePriority.URGENT,
      status: DiagnosticStatus.REQUESTED,
    },
  });

  // Order 2: COMPLETED & RETURNED TO DOCTOR - Specialist completed X-ray scan and findings, returned to Dr. House for final counseling
  await prisma.diagnosticOrder.create({
    data: {
      clinicId: clinicA.id,
      patientId: createdPatients[4].id, // Sarah Connor
      appointmentId: apptQueue1.id,
      referringDoctorId: docHouse.id,
      specialistId: docShepherd.id,
      type: DiagnosticType.X_RAY,
      title: 'Chest Radiography (PA & Lateral)',
      bodyPart: 'Chest PA & Lateral (Digital Radiography)',
      clinicalNotes: 'Pleuritic chest discomfort and persistent non-productive cough. Evaluate lung parenchymal opacities.',
      urgency: QueuePriority.NORMAL,
      status: DiagnosticStatus.COMPLETED,
      findings: 'Bilateral lung fields clear. No focal consolidation, pneumothorax, or pleural effusion detected. Cardiothoracic ratio is normal (< 0.48). Mild thoracic spine spondylotic spurs at T7-T8.',
      impression: 'Normal cardiac and pulmonary radiograph. No acute cardiopulmonary disease. Incidental mild degenerative changes.',
      imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      completedAt: new Date(Date.now() - 15 * 60 * 1000),
      completedBy: docShepherd.fullName,
    },
  });

  // Order 3: REVIEWED & COUNSELED - Dr. House reviewed X-ray results, counseled patient and discharged
  await prisma.diagnosticOrder.create({
    data: {
      clinicId: clinicA.id,
      patientId: createdPatients[0].id, // John Doe
      appointmentId: apptConf1.id,
      referringDoctorId: docHouse.id,
      specialistId: docShepherd.id,
      type: DiagnosticType.X_RAY,
      title: 'Lumbar Spine Multi-Angle X-Ray',
      bodyPart: 'Lumbar Spine (AP, Lateral & Oblique)',
      clinicalNotes: 'Chronic lower back stiffness radiating to left gluteal region. Rule out spondylolisthesis.',
      urgency: QueuePriority.NORMAL,
      status: DiagnosticStatus.REVIEWED,
      findings: 'L4-L5 disc space narrowing with mild anterior marginal osteophytes. No spondylolisthesis or fracture.',
      impression: 'Mild degenerative lumbar disc disease at L4-L5. No pars interarticularis defect.',
      imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
      completedAt: new Date(Date.now() - 120 * 60 * 1000),
      completedBy: docShepherd.fullName,
      reviewedAt: new Date(Date.now() - 30 * 60 * 1000),
      doctorConclusion: 'Patient counseled on lumbar alignment. Prescribed core-strengthening physical therapy and ergonomic lumbar support. Follow-up scheduled in 4 weeks.',
    },
  });

  // =========================================================================
  // 11. HOSPITAL PHARMACY FORMULARY & MEDICATIONS INVENTORY (Prices in Birr)
  // =========================================================================
  const medAmox = await prisma.medication.create({
    data: {
      clinicId: clinicA.id,
      name: 'Amoxicillin Trihydrate',
      genericName: 'Amoxicillin',
      category: 'Antibiotics',
      strength: '500mg',
      dosageForm: 'Capsule',
      unitPrice: 150.0,
      stockQuantity: 450,
      requiresPrescription: true,
      isActive: true,
    },
  });

  const medAzithro = await prisma.medication.create({
    data: {
      clinicId: clinicA.id,
      name: 'Azithromycin Monohydrate',
      genericName: 'Azithromycin',
      category: 'Antibiotics',
      strength: '500mg',
      dosageForm: 'Tablet',
      unitPrice: 280.0,
      stockQuantity: 280,
      requiresPrescription: true,
      isActive: true,
    },
  });

  const medIbu = await prisma.medication.create({
    data: {
      clinicId: clinicA.id,
      name: 'Ibuprofen Rapid Release',
      genericName: 'Ibuprofen',
      category: 'Analgesics & Anti-Inflammatory',
      strength: '400mg',
      dosageForm: 'Tablet',
      unitPrice: 85.0,
      stockQuantity: 600,
      requiresPrescription: false,
      isActive: true,
    },
  });

  const medPara = await prisma.medication.create({
    data: {
      clinicId: clinicA.id,
      name: 'Paracetamol Extra',
      genericName: 'Acetaminophen / Paracetamol',
      category: 'Analgesics & Antipyretics',
      strength: '500mg',
      dosageForm: 'Tablet',
      unitPrice: 40.0,
      stockQuantity: 1200,
      requiresPrescription: false,
      isActive: true,
    },
  });

  const medDiclo = await prisma.medication.create({
    data: {
      clinicId: clinicA.id,
      name: 'Diclofenac Sodium SR',
      genericName: 'Diclofenac Sodium',
      category: 'Musculoskeletal Pain Relief',
      strength: '50mg',
      dosageForm: 'Tablet',
      unitPrice: 95.0,
      stockQuantity: 340,
      requiresPrescription: true,
      isActive: true,
    },
  });

  const medOmep = await prisma.medication.create({
    data: {
      clinicId: clinicA.id,
      name: 'Omeprazole Gastro-Resistant',
      genericName: 'Omeprazole',
      category: 'Gastrointestinal & Antacids',
      strength: '20mg',
      dosageForm: 'Delayed-Release Capsule',
      unitPrice: 120.0,
      stockQuantity: 500,
      requiresPrescription: true,
      isActive: true,
    },
  });

  const medMetform = await prisma.medication.create({
    data: {
      clinicId: clinicA.id,
      name: 'Metformin Hydrochloride',
      genericName: 'Metformin',
      category: 'Endocrinology & Antidiabetic',
      strength: '500mg',
      dosageForm: 'Tablet',
      unitPrice: 110.0,
      stockQuantity: 400,
      requiresPrescription: true,
      isActive: true,
    },
  });

  const medAtorva = await prisma.medication.create({
    data: {
      clinicId: clinicA.id,
      name: 'Atorvastatin Calcium',
      genericName: 'Atorvastatin',
      category: 'Cardiovascular & Lipid Regulators',
      strength: '20mg',
      dosageForm: 'Tablet',
      unitPrice: 210.0,
      stockQuantity: 320,
      requiresPrescription: true,
      isActive: true,
    },
  });

  const medSalbut = await prisma.medication.create({
    data: {
      clinicId: clinicA.id,
      name: 'Salbutamol HFA Inhaler',
      genericName: 'Albuterol / Salbutamol',
      category: 'Respiratory & Bronchodilators',
      strength: '100mcg/dose',
      dosageForm: 'Metered Dose Inhaler',
      unitPrice: 320.0,
      stockQuantity: 150,
      requiresPrescription: true,
      isActive: true,
    },
  });

  const medVit = await prisma.medication.create({
    data: {
      clinicId: clinicA.id,
      name: 'ImmunoZinc & Multivitamin Complex',
      genericName: 'Multivitamins with Zinc',
      category: 'Nutritional Supplements',
      strength: 'Standard Daily',
      dosageForm: 'Coated Tablet',
      unitPrice: 90.0,
      stockQuantity: 800,
      requiresPrescription: false,
      isActive: true,
    },
  });

  // =========================================================================
  // 12. PRESCRIPTIONS & PHARMACY DISPENSATION PIPELINE (Payment in Birr)
  // =========================================================================
  // Prescription 1: PENDING - Doctor prescribed, waiting at Pharmacy Counter for patient to pay Birr
  await prisma.prescription.create({
    data: {
      clinicId: clinicA.id,
      patientId: createdPatients[5].id, // David Beckham
      doctorId: docBailey.id,
      appointmentId: apptQueue2.id,
      prescriptionNumber: 'RX-10001',
      diagnosis: 'Right Knee Acute Meniscal Sprain & Traumatic Synovitis',
      status: PrescriptionStatus.PENDING,
      notes: 'Patient should avoid high-impact activities. Take anti-inflammatory drugs strictly after meals.',
      totalAmount: 300.0,
      currency: 'ETB',
      paymentStatus: 'PENDING',
      items: {
        create: [
          {
            medicationId: medIbu.id,
            drugName: 'Ibuprofen Rapid Release',
            dosage: '400mg',
            frequency: 'Twice daily after meals',
            duration: '7 days',
            quantity: 14,
            unitPrice: 85.0,
            totalPrice: 85.0,
            instructions: 'Take with milk or after food to prevent gastric irritation.',
          },
          {
            medicationId: medOmep.id,
            drugName: 'Omeprazole Gastro-Resistant',
            dosage: '20mg',
            frequency: 'Once daily 30 mins before breakfast',
            duration: '14 days',
            quantity: 14,
            unitPrice: 120.0,
            totalPrice: 120.0,
            instructions: 'Swallow whole with water; do not crush.',
          },
          {
            medicationId: medDiclo.id,
            drugName: 'Diclofenac Sodium SR',
            dosage: '50mg',
            frequency: 'One tablet at night as needed for pain',
            duration: '10 days',
            quantity: 10,
            unitPrice: 95.0,
            totalPrice: 95.0,
            instructions: 'Use only if pain is severe.',
          },
        ],
      },
    },
  });

  // Prescription 2: PAID - Patient paid 640 ETB via Telebirr (0995774866), waiting for drug dispensation
  await prisma.prescription.create({
    data: {
      clinicId: clinicA.id,
      patientId: createdPatients[4].id, // Sarah Connor
      doctorId: docHouse.id,
      appointmentId: apptQueue1.id,
      prescriptionNumber: 'RX-10002',
      diagnosis: 'Acute Bronchial Irritation & Persistent Post-Viral Cough',
      status: PrescriptionStatus.PAID,
      notes: 'Chest X-Ray clear. Patient advised to hydrate and finish the entire antimicrobial course.',
      totalAmount: 640.0,
      currency: 'ETB',
      paymentMethod: 'TELEBIRR',
      paymentStatus: 'VERIFIED',
      paymentRef: 'TB-0995774866-9921',
      payerPhone: '0995774866',
      payerName: 'Sarah Connor',
      receiptNumber: 'RCP-PHARM-10002',
      paidAt: new Date(Date.now() - 20 * 60 * 1000),
      items: {
        create: [
          {
            medicationId: medAzithro.id,
            drugName: 'Azithromycin Monohydrate',
            dosage: '500mg',
            frequency: 'Once daily for 3 days',
            duration: '3 days',
            quantity: 3,
            unitPrice: 280.0,
            totalPrice: 280.0,
            instructions: 'Take at the same time each day on an empty stomach.',
          },
          {
            medicationId: medSalbut.id,
            drugName: 'Salbutamol HFA Inhaler',
            dosage: '100mcg/puff',
            frequency: '1-2 puffs every 6 hours as needed for wheezing',
            duration: '1 unit',
            quantity: 1,
            unitPrice: 320.0,
            totalPrice: 320.0,
            instructions: 'Rinse mouth after inhalation.',
          },
          {
            medicationId: medPara.id,
            drugName: 'Paracetamol Extra',
            dosage: '500mg',
            frequency: '1-2 tablets every 6 hours as needed for fever',
            duration: '5 days',
            quantity: 10,
            unitPrice: 40.0,
            totalPrice: 40.0,
            instructions: 'Do not exceed 4000mg per 24 hours.',
          },
        ],
      },
    },
  });

  // Prescription 3: DISPENSED - Settled in full in Birr via CBE (1000305532472) & medications dispensed
  await prisma.prescription.create({
    data: {
      clinicId: clinicA.id,
      patientId: createdPatients[0].id, // John Doe
      doctorId: docHouse.id,
      appointmentId: apptConf1.id,
      prescriptionNumber: 'RX-10003',
      diagnosis: 'Degenerative Lumbar Spine Disease & Muscular Spasm Management',
      status: PrescriptionStatus.DISPENSED,
      notes: 'Physical therapy referral also provided. Follow-up in 4 weeks.',
      totalAmount: 305.0,
      currency: 'ETB',
      paymentMethod: 'CBE',
      paymentStatus: 'VERIFIED',
      paymentRef: 'CBE-1000305532472-7712',
      payerAccount: '1000305532472',
      payerName: 'John Doe',
      receiptNumber: 'RCP-PHARM-10003',
      paidAt: new Date(Date.now() - 45 * 60 * 1000),
      dispensedAt: new Date(Date.now() - 40 * 60 * 1000),
      dispensedBy: 'Dr. Marcus Vance, PharmD',
      dispensationNotes: 'Full medication counseling provided. Patient confirmed no allergies to NSAIDs.',
      items: {
        create: [
          {
            medicationId: medDiclo.id,
            drugName: 'Diclofenac Sodium SR',
            dosage: '50mg',
            frequency: 'One tablet twice daily with food',
            duration: '15 days',
            quantity: 30,
            unitPrice: 95.0,
            totalPrice: 95.0,
            instructions: 'Take with food or a large glass of water.',
          },
          {
            medicationId: medOmep.id,
            drugName: 'Omeprazole Gastro-Resistant',
            dosage: '20mg',
            frequency: 'One capsule daily before breakfast',
            duration: '15 days',
            quantity: 15,
            unitPrice: 120.0,
            totalPrice: 120.0,
            instructions: 'For gastro-protection while on NSAID regimen.',
          },
          {
            medicationId: medVit.id,
            drugName: 'ImmunoZinc & Multivitamin Complex',
            dosage: 'Standard Daily',
            frequency: 'One tablet once daily in the morning',
            duration: '30 days',
            quantity: 30,
            unitPrice: 90.0,
            totalPrice: 90.0,
            instructions: 'Take after breakfast.',
          },
        ],
      },
    },
  });

  console.log('--- Enterprise Seed Completed Successfully ---');
  console.log('Clinic Created: Metro Health Medical Center (metro-health)');
  console.log('Branches: 3 active branches');
  console.log('Services: 8 medical services');
  console.log('Doctors: 7 specialists with complete schedules');
  console.log('Patients: 10 verified patients with unique IDs (PT-10001 through PT-10010)');
  console.log('Appointments: 10 diverse records (REQUESTED, CONFIRMED, IN_QUEUE, COMPLETED, CANCELLED, NO_SHOW)');
  console.log('Queue: 5 active tokens (SERVING, CALLED, WAITING)');
  console.log('');
  console.log('Login Credentials (Password: Password123!):');
  console.log('- Admin: admin@metrohealth.com');
  console.log('- Manager: manager@metrohealth.com');
  console.log('- Receptionist: receptionist@metrohealth.com');
  console.log('- Doctor: doctor@metrohealth.com');
  console.log('- Pharmacist: pharmacist@metrohealth.com');
  console.log('- Patient: patient@example.com');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
