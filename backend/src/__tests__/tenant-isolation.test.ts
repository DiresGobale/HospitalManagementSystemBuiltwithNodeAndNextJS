import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma, UserRole, ClinicStatus, MembershipStatus } from '../config/prisma.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const app = createApp();

describe('Multi-Tenant Isolation & Role Authorization Security Tests', () => {
  let clinicA: any;
  let clinicB: any;
  let adminA: any;
  let doctorA: any;
  let patientA1: any;
  let adminB: any;
  let patientB: any;
  let branchA: any;
  let doctorProfileA: any;
  let serviceA: any;

  let tokenAdminA: string;
  let tokenDoctorA: string;
  let tokenPatientA1: string;

  beforeAll(async () => {
    clinicA = await prisma.clinic.create({
      data: {
        name: 'Isolation Test Clinic A',
        slug: `test-clinic-a-${Date.now()}`,
        email: 'clinica@test.com',
        phone: '1234567890',
        address: '123 A Street',
        timezone: 'UTC',
        status: ClinicStatus.ACTIVE,
      },
    });

    clinicB = await prisma.clinic.create({
      data: {
        name: 'Isolation Test Clinic B',
        slug: `test-clinic-b-${Date.now()}`,
        email: 'clinicb@test.com',
        phone: '0987654321',
        address: '456 B Avenue',
        timezone: 'UTC',
        status: ClinicStatus.ACTIVE,
      },
    });

    adminA = await prisma.user.create({
      data: { email: `adminA_${Date.now()}@test.com`, fullName: 'Admin Clinic A', passwordHash: 'hash' },
    });
    doctorA = await prisma.user.create({
      data: { email: `doctorA_${Date.now()}@test.com`, fullName: 'Doctor Clinic A', passwordHash: 'hash' },
    });
    patientA1 = await prisma.user.create({
      data: { email: `patientA1_${Date.now()}@test.com`, fullName: 'Patient A1', passwordHash: 'hash' },
    });
    adminB = await prisma.user.create({
      data: { email: `adminB_${Date.now()}@test.com`, fullName: 'Admin Clinic B', passwordHash: 'hash' },
    });

    await prisma.clinicMembership.createMany({
      data: [
        { clinicId: clinicA.id, userId: adminA.id, role: UserRole.ADMIN, status: MembershipStatus.ACTIVE },
        { clinicId: clinicA.id, userId: doctorA.id, role: UserRole.DOCTOR, status: MembershipStatus.ACTIVE },
        { clinicId: clinicA.id, userId: patientA1.id, role: UserRole.PATIENT, status: MembershipStatus.ACTIVE },
        { clinicId: clinicB.id, userId: adminB.id, role: UserRole.ADMIN, status: MembershipStatus.ACTIVE },
      ],
    });

    branchA = await prisma.branch.create({
      data: { clinicId: clinicA.id, name: 'Branch A', address: 'Addr', phone: '123' },
    });

    doctorProfileA = await prisma.doctorProfile.create({
      data: {
        clinicId: clinicA.id,
        userId: doctorA.id,
        branchId: branchA.id,
        fullName: 'Doctor Clinic A',
        specialty: 'Pediatrics',
        phone: '123',
        email: doctorA.email,
        appointmentDurationMinutes: 30,
      },
    });

    serviceA = await prisma.service.create({
      data: { clinicId: clinicA.id, name: 'Service A', durationMinutes: 30, price: 100 },
    });

    await prisma.patient.create({
      data: {
        clinicId: clinicA.id,
        userId: patientA1.id,
        patientNumber: 'PT-A001',
        fullName: 'Patient A1 Record',
        phone: '1111111111',
      },
    });

    patientB = await prisma.patient.create({
      data: {
        clinicId: clinicB.id,
        patientNumber: 'PT-B001',
        fullName: 'Patient B Secret Record',
        phone: '2222222222',
      },
    });

    tokenAdminA = jwt.sign({ userId: adminA.id, email: adminA.email, fullName: adminA.fullName }, env.JWT_ACCESS_SECRET);
    tokenDoctorA = jwt.sign({ userId: doctorA.id, email: doctorA.email, fullName: doctorA.fullName }, env.JWT_ACCESS_SECRET);
    tokenPatientA1 = jwt.sign({ userId: patientA1.id, email: patientA1.email, fullName: patientA1.fullName }, env.JWT_ACCESS_SECRET);
  });

  it('RULE 1 & 2: User from Clinic A cannot access Clinic B using Clinic B header', async () => {
    const res = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .set('x-clinic-id', clinicB.id);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN_TENANT_ACCESS');
  });

  it('RULE 5 & 6: User from Clinic A cannot access Clinic B patient record even if ID is guessed', async () => {
    const res = await request(app)
      .get(`/api/v1/patients/${patientB.id}`)
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .set('x-clinic-id', clinicA.id);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PATIENT_NOT_FOUND');
  });

  it('RULE 5: Clinic A patient list does NOT contain Clinic B patients', async () => {
    const res = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .set('x-clinic-id', clinicA.id);

    expect(res.status).toBe(200);
    const patientNames = res.body.data.items.map((p: any) => p.fullName);
    expect(patientNames).toContain('Patient A1 Record');
    expect(patientNames).not.toContain('Patient B Secret Record');
  });

  it('ROLE-BASED: Patient cannot modify clinic settings', async () => {
    const res = await request(app)
      .patch('/api/v1/clinics/current/settings')
      .set('Authorization', `Bearer ${tokenPatientA1}`)
      .set('x-clinic-id', clinicA.id)
      .send({ appointmentDurationDefault: 45 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('INSUFFICIENT_ROLE');
  });
});

