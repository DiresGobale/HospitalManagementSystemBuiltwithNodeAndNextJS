export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
  RECEPTIONIST: 'RECEPTIONIST',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export interface ClinicDTO {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  logoUrl?: string | null;
  status: string;
}

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
}

export interface PatientDTO {
  id: string;
  clinicId: string;
  patientNumber: string;
  fullName: string;
  phone: string;
  email?: string | null;
  dateOfBirth?: string | null;
}

export interface DoctorDTO {
  id: string;
  clinicId: string;
  branchId: string;
  fullName: string;
  specialty: string;
  phone: string;
  email: string;
  appointmentDurationMinutes: number;
}

export interface ServiceDTO {
  id: string;
  clinicId: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
}

export interface AppointmentDTO {
  id: string;
  clinicId: string;
  branchId: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  appointmentNumber: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: string;
  reasonForVisit?: string | null;
  internalNotes?: string | null;
  patient?: PatientDTO;
  doctor?: DoctorDTO;
  service?: ServiceDTO;
}

export interface QueueTicketDTO {
  id: string;
  clinicId: string;
  queueSessionId: string;
  patientId: string;
  tokenNumber: number;
  displayToken: string;
  priority: string;
  status: string;
  checkedInAt: string;
  calledAt?: string | null;
  serviceStartedAt?: string | null;
  completedAt?: string | null;
  patient?: PatientDTO;
}

