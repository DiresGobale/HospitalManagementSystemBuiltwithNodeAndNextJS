import { z } from 'zod';

// Express Request Augmentation
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        fullName: string;
      };
      clinicId?: string;
      membership?: {
        id: string;
        clinicId: string;
        userId: string;
        role: UserRole;
        status: string;
      };
      doctorProfileId?: string;
      patientId?: string;
    }
  }
}

// Roles
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
  RECEPTIONIST: 'RECEPTIONIST',
  PHARMACIST: 'PHARMACIST',
  SPECIALIST: 'SPECIALIST',
  LABORATORY: 'LABORATORY',
  NURSING: 'NURSING',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// Statuses
export const CLINIC_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE',
} as const;

export const MEMBERSHIP_STATUS = {
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
} as const;

export const APPOINTMENT_STATUS = {
  REQUESTED: 'REQUESTED',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  IN_QUEUE: 'IN_QUEUE',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export const QUEUE_STATUS = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  SERVING: 'SERVING',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export const QUEUE_SESSION_STATUS = {
  OPEN: 'OPEN',
  PAUSED: 'PAUSED',
  CLOSED: 'CLOSED',
} as const;

export const QUEUE_PRIORITY = {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
  VIP: 'VIP',
  EMERGENCY: 'EMERGENCY',
} as const;

export const QUEUE_SOCKET_EVENTS = {
  TICKET_CREATED: 'queue:ticket-created',
  TICKET_CALLED: 'queue:ticket-called',
  TICKET_SERVING: 'queue:ticket-serving',
  TICKET_COMPLETED: 'queue:ticket-completed',
  TICKET_SKIPPED: 'queue:ticket-skipped',
  TICKET_REQUEUED: 'queue:ticket-requeued',
  TICKET_CANCELLED: 'queue:ticket-cancelled',
  POSITION_UPDATED: 'queue:position-updated',
  SESSION_CLOSED: 'queue:session-closed',
  SESSION_OPENED: 'queue:session-opened',
} as const;

// Permissions
export const PERMISSIONS = {
  CLINIC_VIEW: 'clinic:view',
  CLINIC_UPDATE: 'clinic:update',
  SETTINGS_MANAGE: 'settings:manage',
  BRANCH_MANAGE: 'branch:manage',
  STAFF_MANAGE: 'staff:manage',
  AUDIT_LOG_VIEW: 'audit_log:view',
  SUBSCRIPTION_VIEW: 'subscription:view',
  SERVICE_MANAGE: 'service:manage',
  DOCTOR_MANAGE: 'doctor:manage',
  SCHEDULE_MANAGE: 'schedule:manage',
  DOCTOR_SCHEDULE_VIEW: 'doctor_schedule:view',
  PATIENT_CREATE: 'patient:create',
  PATIENT_VIEW: 'patient:view',
  PATIENT_UPDATE: 'patient:update',
  PATIENT_ARCHIVE: 'patient:archive',
  PATIENT_OWN_VIEW: 'patient:own_view',
  PATIENT_OWN_UPDATE: 'patient:own_update',
  APPOINTMENT_CREATE: 'appointment:create',
  APPOINTMENT_VIEW_ALL: 'appointment:view_all',
  APPOINTMENT_VIEW_ASSIGNED: 'appointment:view_assigned',
  APPOINTMENT_VIEW_OWN: 'appointment:view_own',
  APPOINTMENT_UPDATE: 'appointment:update',
  APPOINTMENT_CANCEL_OWN: 'appointment:cancel_own',
  APPOINTMENT_RESCHEDULE_OWN: 'appointment:reschedule_own',
  APPOINTMENT_CHECKIN: 'appointment:checkin',
  APPOINTMENT_NOTES_EDIT: 'appointment:notes_edit',
  QUEUE_SESSION_MANAGE: 'queue_session:manage',
  QUEUE_VIEW: 'queue:view',
  QUEUE_TICKET_GENERATE: 'queue_ticket:generate',
  QUEUE_TICKET_CALL: 'queue_ticket:call',
  QUEUE_TICKET_SERVE: 'queue_ticket:serve',
  QUEUE_TICKET_COMPLETE: 'queue_ticket:complete',
  QUEUE_TICKET_SKIP: 'queue_ticket:skip',
  QUEUE_TICKET_REQUEUE: 'queue_ticket:requeue',
  QUEUE_TICKET_CANCEL: 'queue_ticket:cancel',
  QUEUE_TICKET_TRANSFER: 'queue_ticket:transfer',
  QUEUE_OWN_VIEW: 'queue:own_view',
  REPORTS_OPERATIONAL_VIEW: 'reports:operational_view',
  REPORTS_ANALYTICS_VIEW: 'reports:analytics_view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    PERMISSIONS.CLINIC_VIEW,
    PERMISSIONS.CLINIC_UPDATE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.BRANCH_MANAGE,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.SUBSCRIPTION_VIEW,
    PERMISSIONS.SERVICE_MANAGE,
    PERMISSIONS.DOCTOR_MANAGE,
    PERMISSIONS.SCHEDULE_MANAGE,
    PERMISSIONS.DOCTOR_SCHEDULE_VIEW,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_ARCHIVE,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_VIEW_ALL,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CHECKIN,
    PERMISSIONS.APPOINTMENT_NOTES_EDIT,
    PERMISSIONS.QUEUE_SESSION_MANAGE,
    PERMISSIONS.QUEUE_VIEW,
    PERMISSIONS.QUEUE_TICKET_GENERATE,
    PERMISSIONS.QUEUE_TICKET_CALL,
    PERMISSIONS.QUEUE_TICKET_SERVE,
    PERMISSIONS.QUEUE_TICKET_COMPLETE,
    PERMISSIONS.QUEUE_TICKET_SKIP,
    PERMISSIONS.QUEUE_TICKET_REQUEUE,
    PERMISSIONS.QUEUE_TICKET_CANCEL,
    PERMISSIONS.QUEUE_TICKET_TRANSFER,
    PERMISSIONS.REPORTS_OPERATIONAL_VIEW,
    PERMISSIONS.REPORTS_ANALYTICS_VIEW,
  ],
  ADMIN: [
    PERMISSIONS.CLINIC_VIEW,
    PERMISSIONS.CLINIC_UPDATE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.BRANCH_MANAGE,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.SUBSCRIPTION_VIEW,
    PERMISSIONS.SERVICE_MANAGE,
    PERMISSIONS.DOCTOR_MANAGE,
    PERMISSIONS.SCHEDULE_MANAGE,
    PERMISSIONS.DOCTOR_SCHEDULE_VIEW,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_ARCHIVE,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_VIEW_ALL,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CHECKIN,
    PERMISSIONS.APPOINTMENT_NOTES_EDIT,
    PERMISSIONS.QUEUE_SESSION_MANAGE,
    PERMISSIONS.QUEUE_VIEW,
    PERMISSIONS.QUEUE_TICKET_GENERATE,
    PERMISSIONS.QUEUE_TICKET_CALL,
    PERMISSIONS.QUEUE_TICKET_SERVE,
    PERMISSIONS.QUEUE_TICKET_COMPLETE,
    PERMISSIONS.QUEUE_TICKET_SKIP,
    PERMISSIONS.QUEUE_TICKET_REQUEUE,
    PERMISSIONS.QUEUE_TICKET_CANCEL,
    PERMISSIONS.QUEUE_TICKET_TRANSFER,
    PERMISSIONS.REPORTS_OPERATIONAL_VIEW,
    PERMISSIONS.REPORTS_ANALYTICS_VIEW,
  ],
  MANAGER: [
    PERMISSIONS.CLINIC_VIEW,
    PERMISSIONS.BRANCH_MANAGE,
    PERMISSIONS.SERVICE_MANAGE,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.DOCTOR_SCHEDULE_VIEW,
    PERMISSIONS.SCHEDULE_MANAGE,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_VIEW_ALL,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CHECKIN,
    PERMISSIONS.QUEUE_SESSION_MANAGE,
    PERMISSIONS.QUEUE_VIEW,
    PERMISSIONS.QUEUE_TICKET_GENERATE,
    PERMISSIONS.QUEUE_TICKET_CALL,
    PERMISSIONS.QUEUE_TICKET_SERVE,
    PERMISSIONS.QUEUE_TICKET_COMPLETE,
    PERMISSIONS.QUEUE_TICKET_SKIP,
    PERMISSIONS.QUEUE_TICKET_REQUEUE,
    PERMISSIONS.QUEUE_TICKET_CANCEL,
    PERMISSIONS.QUEUE_TICKET_TRANSFER,
    PERMISSIONS.REPORTS_OPERATIONAL_VIEW,
  ],
  DOCTOR: [
    PERMISSIONS.DOCTOR_SCHEDULE_VIEW,
    PERMISSIONS.APPOINTMENT_VIEW_ASSIGNED,
    PERMISSIONS.APPOINTMENT_NOTES_EDIT,
    PERMISSIONS.QUEUE_VIEW,
    PERMISSIONS.QUEUE_TICKET_CALL,
    PERMISSIONS.QUEUE_TICKET_SERVE,
    PERMISSIONS.QUEUE_TICKET_COMPLETE,
    PERMISSIONS.QUEUE_TICKET_SKIP,
    PERMISSIONS.PATIENT_VIEW,
  ],
  SPECIALIST: [
    PERMISSIONS.DOCTOR_SCHEDULE_VIEW,
    PERMISSIONS.APPOINTMENT_VIEW_ASSIGNED,
    PERMISSIONS.APPOINTMENT_NOTES_EDIT,
    PERMISSIONS.QUEUE_VIEW,
    PERMISSIONS.QUEUE_TICKET_CALL,
    PERMISSIONS.QUEUE_TICKET_SERVE,
    PERMISSIONS.QUEUE_TICKET_COMPLETE,
    PERMISSIONS.QUEUE_TICKET_SKIP,
    PERMISSIONS.PATIENT_VIEW,
  ],
  LABORATORY: [
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.APPOINTMENT_VIEW_ALL,
    PERMISSIONS.QUEUE_VIEW,
    PERMISSIONS.REPORTS_OPERATIONAL_VIEW,
  ],
  NURSING: [
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.APPOINTMENT_CHECKIN,
    PERMISSIONS.QUEUE_VIEW,
    PERMISSIONS.QUEUE_TICKET_CALL,
    PERMISSIONS.QUEUE_TICKET_SERVE,
    PERMISSIONS.QUEUE_TICKET_COMPLETE,
    PERMISSIONS.QUEUE_TICKET_SKIP,
    PERMISSIONS.QUEUE_TICKET_GENERATE,
  ],
  RECEPTIONIST: [
    PERMISSIONS.DOCTOR_SCHEDULE_VIEW,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_VIEW_ALL,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_CHECKIN,
    PERMISSIONS.QUEUE_VIEW,
    PERMISSIONS.QUEUE_TICKET_GENERATE,
    PERMISSIONS.QUEUE_TICKET_CALL,
    PERMISSIONS.QUEUE_TICKET_SKIP,
    PERMISSIONS.QUEUE_TICKET_REQUEUE,
    PERMISSIONS.QUEUE_TICKET_CANCEL,
    PERMISSIONS.REPORTS_OPERATIONAL_VIEW,
  ],
  PATIENT: [
    PERMISSIONS.PATIENT_OWN_VIEW,
    PERMISSIONS.PATIENT_OWN_UPDATE,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_VIEW_OWN,
    PERMISSIONS.APPOINTMENT_CANCEL_OWN,
    PERMISSIONS.APPOINTMENT_RESCHEDULE_OWN,
    PERMISSIONS.QUEUE_OWN_VIEW,
  ],
  PHARMACIST: [
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.APPOINTMENT_VIEW_ALL,
    PERMISSIONS.QUEUE_VIEW,
    PERMISSIONS.REPORTS_OPERATIONAL_VIEW,
  ],
};

// Zod Schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Ethiopian standard phone regex (09... or 07... 10 digits, or +251 9/7...)
export const ethiopianPhoneRegex = /^(?:\+251|251|0)?([97]\d{8})$/;
// Name regex: only alphabetic characters, spaces, and standard name punctuation
export const personNameRegex = /^[A-Za-z\s.'\-\u1200-\u137F]+$/;

export const registerPatientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).regex(personNameRegex, 'Full name can only contain alphabetic characters and spaces'),
  phone: z.string().regex(ethiopianPhoneRegex, 'Must be a valid Ethiopian phone number (e.g. 0911234567 or +251911234567)').optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  clinicId: z.string().uuid().optional().nullable(),
});

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).regex(personNameRegex, 'Full name can only contain alphabetic characters and spaces'),
  role: z.enum([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.PHARMACIST, ROLES.SPECIALIST, ROLES.LABORATORY, ROLES.NURSING]),
  branchId: z.string().uuid().optional(),
  specialty: z.string().optional(),
});

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').regex(personNameRegex, 'Full name can only contain alphabetic characters and spaces'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(ethiopianPhoneRegex, 'Must be a valid Ethiopian phone number (e.g. 0911234567 or +251911234567)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().min(1, 'Department is required'),
  role: z.enum([
    ROLES.DOCTOR,
    ROLES.RECEPTIONIST,
    ROLES.PHARMACIST,
    ROLES.SPECIALIST,
    ROLES.LABORATORY,
    ROLES.NURSING,
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.SUPER_ADMIN,
  ]),
  specialty: z.string().optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10),
});

export const forgotPasswordVerifyEmailSchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordResetSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8).optional(),
});

export const createClinicSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().regex(ethiopianPhoneRegex, 'Must be a valid Ethiopian phone number (e.g. 0911234567 or +251911234567)'),
  address: z.string().min(3),
  timezone: z.string().default('UTC'),
  logoUrl: z.string().url().optional(),
  adminFullName: z.string().min(2).regex(personNameRegex, 'Admin full name can only contain alphabetic characters and spaces'),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

export const updateClinicSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(ethiopianPhoneRegex, 'Must be a valid Ethiopian phone number').optional(),
  address: z.string().min(3).optional(),
  timezone: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
});

export const updateClinicSettingsSchema = z.object({
  appointmentDurationDefault: z.number().int().min(5).max(240).default(30),
  cancellationNoticeHours: z.number().int().min(0).default(24),
  maxAdvanceBookingDays: z.number().int().min(1).default(60),
  queueTokenPrefix: z.string().max(4).default('T'),
  queueAutoCall: z.boolean().default(false),
  publicBookingEnabled: z.boolean().default(true),
  smsNotificationsEnabled: z.boolean().default(false),
  emailNotificationsEnabled: z.boolean().default(true),
});

export const createBranchSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(3),
  phone: z.string().regex(ethiopianPhoneRegex, 'Must be a valid Ethiopian phone number (e.g. 0911234567 or +251911234567)'),
  isMain: z.boolean().default(false),
});

export const createPatientSchema = z.object({
  fullName: z.string().min(2).regex(personNameRegex, 'Full name can only contain alphabetic characters and spaces'),
  email: z.string().email().optional().nullable(),
  phone: z.string().regex(ethiopianPhoneRegex, 'Must be a valid Ethiopian phone number (e.g. 0911234567 or +251911234567)'),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const searchPatientSchema = z.object({
  query: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createDoctorSchema = z.object({
  fullName: z.string().min(2).regex(personNameRegex, 'Full name can only contain alphabetic characters and spaces'),
  email: z.string().email(),
  phone: z.string().regex(ethiopianPhoneRegex, 'Must be a valid Ethiopian phone number (e.g. 0911234567 or +251911234567)'),
  specialty: z.string().min(2),
  licenseNumber: z.string().optional().nullable(),
  branchId: z.string().uuid(),
  appointmentDurationMinutes: z.number().int().min(5).max(180).default(30),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export const updateDoctorSchema = z.object({
  fullName: z.string().min(2).regex(personNameRegex, 'Full name can only contain alphabetic characters and spaces').optional(),
  phone: z.string().regex(ethiopianPhoneRegex, 'Must be a valid Ethiopian phone number').optional(),
  specialty: z.string().min(2).optional(),
  licenseNumber: z.string().optional().nullable(),
  branchId: z.string().uuid().optional(),
  appointmentDurationMinutes: z.number().int().min(5).max(180).optional(),
  isActive: z.boolean().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export const createScheduleSchema = z.object({
  doctorId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  slotDurationMinutes: z.number().int().min(5).max(120).default(30),
  breakStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  breakEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const createScheduleExceptionSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isAvailable: z.boolean().default(false),
  reason: z.string().optional().nullable(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
});

export const availabilityQuerySchema = z.object({
  doctorId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  price: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export const appointmentPaymentInputSchema = z.object({
  method: z.enum(['TELEBIRR', 'CBE', 'CASH', 'CARD']),
  transactionRef: z.string().min(3, 'Transaction reference number is required'),
  payerPhone: z.string().regex(ethiopianPhoneRegex, 'Must be a valid Ethiopian phone number').optional().nullable(),
  payerAccount: z.string().optional().nullable(),
  payerName: z.string().regex(personNameRegex, 'Payer name can only contain alphabetic characters and spaces').optional().nullable(),
  amount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export const verifyPaymentSchema = z.object({
  status: z.enum(['VERIFIED', 'FAILED', 'REFUNDED']),
  notes: z.string().optional().nullable(),
});

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  serviceId: z.string().uuid(),
  branchId: z.string().uuid(),
  scheduledStartAt: z.string().datetime(),
  roomNumber: z.string().optional().nullable(),
  assignedRole: z.string().optional().nullable(),
  reasonForVisit: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  status: z.enum(['REQUESTED', 'CONFIRMED']).optional(),
  idempotencyKey: z.string().optional(),
  payment: appointmentPaymentInputSchema.optional(),
});

export const approveAppointmentSchema = z.object({
  doctorId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  roomNumber: z.string().optional().nullable(),
  assignedRole: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  verifyPayment: z.boolean().optional().default(true),
});

export const assignDoctorSchema = z.object({
  doctorId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  roomNumber: z.string().optional().nullable(),
  assignedRole: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const rescheduleAppointmentSchema = z.object({
  scheduledStartAt: z.string().datetime(),
  reason: z.string().optional().nullable(),
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().min(2),
});

export const checkInAppointmentSchema = z.object({
  branchId: z.string().uuid().optional(),
  priority: z.enum(['NORMAL', 'URGENT', 'VIP', 'EMERGENCY']).default('NORMAL'),
});

export const searchAppointmentsQuerySchema = z.object({
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createQueueSessionSchema = z.object({
  branchId: z.string().uuid(),
  doctorId: z.string().uuid().optional().nullable(),
  serviceId: z.string().uuid().optional().nullable(),
  operatingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const createWalkInTicketSchema = z.object({
  queueSessionId: z.string().uuid(),
  patientId: z.string().uuid(),
  priority: z.enum(['NORMAL', 'URGENT', 'VIP', 'EMERGENCY']).default('NORMAL'),
  notes: z.string().optional().nullable(),
});

export const transferTicketSchema = z.object({
  targetSessionId: z.string().uuid(),
  reason: z.string().optional().nullable(),
});

export const createDiagnosticOrderSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  referringDoctorId: z.string().uuid().optional().nullable(),
  specialistId: z.string().uuid().optional().nullable(),
  type: z.enum(['X_RAY', 'LAB_TEST', 'ULTRASOUND', 'ECG', 'CT_SCAN', 'MRI']).default('X_RAY'),
  title: z.string().min(2),
  bodyPart: z.string().optional().nullable(),
  clinicalNotes: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  diagnosticDept: z.string().optional().nullable(),
  urgency: z.enum(['NORMAL', 'URGENT', 'VIP', 'EMERGENCY']).default('NORMAL'),
});

export const completeDiagnosticOrderSchema = z.object({
  findings: z.string().min(2, 'Diagnostic findings are required'),
  impression: z.string().min(2, 'Radiologist impression/conclusion is required'),
  radiologyNotes: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  specialistId: z.string().uuid().optional().nullable(),
});

export const reviewDiagnosticOrderSchema = z.object({
  doctorConclusion: z.string().min(2, 'Doctor conclusion and counseling plan is required'),
  completeAppointment: z.boolean().optional().default(true),
});

export const searchDiagnosticOrdersSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  patientId: z.string().uuid().optional(),
  referringDoctorId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type CreateClinicInput = z.infer<typeof createClinicSchema>;
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>;
export type UpdateClinicSettingsInput = z.infer<typeof updateClinicSettingsSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type SearchPatientQuery = z.infer<typeof searchPatientSchema>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type CreateScheduleExceptionInput = z.infer<typeof createScheduleExceptionSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type ApproveAppointmentInput = z.infer<typeof approveAppointmentSchema>;
export type AssignDoctorInput = z.infer<typeof assignDoctorSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type CheckInAppointmentInput = z.infer<typeof checkInAppointmentSchema>;
export type SearchAppointmentsQuery = z.infer<typeof searchAppointmentsQuerySchema>;
export type CreateQueueSessionInput = z.infer<typeof createQueueSessionSchema>;
export type CreateWalkInTicketInput = z.infer<typeof createWalkInTicketSchema>;
export type TransferTicketInput = z.infer<typeof transferTicketSchema>;
export type ForgotPasswordVerifyEmailInput = z.infer<typeof forgotPasswordVerifyEmailSchema>;
export type ForgotPasswordResetInput = z.infer<typeof forgotPasswordResetSchema>;
export type CreateDiagnosticOrderInput = z.infer<typeof createDiagnosticOrderSchema>;
export type CompleteDiagnosticOrderInput = z.infer<typeof completeDiagnosticOrderSchema>;
export type ReviewDiagnosticOrderInput = z.infer<typeof reviewDiagnosticOrderSchema>;
export type SearchDiagnosticOrdersQuery = z.infer<typeof searchDiagnosticOrdersSchema>;

// Pharmacy & Medication Schemas
export const createPrescriptionItemSchema = z.object({
  medicationId: z.string().uuid().optional().nullable(),
  drugName: z.string().min(1, 'Drug name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0).default(0), // Price in ETB
  instructions: z.string().optional().nullable(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  notes: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  items: z.array(createPrescriptionItemSchema).min(1, 'At least one medication is required'),
});

export const payPrescriptionSchema = z.object({
  paymentMethod: z.enum(['TELEBIRR', 'CBE', 'CASH', 'CARD']),
  amount: z.coerce.number().positive('Payment amount must be positive'),
  transactionRef: z.string().optional().nullable(),
  payerPhone: z.string().optional().nullable(),
  payerAccount: z.string().optional().nullable(),
  payerName: z.string().optional().nullable(),
  receiptNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  dispenseImmediately: z.boolean().optional().default(true),
  dispensationNotes: z.string().optional().nullable(),
});

export const dispensePrescriptionSchema = z.object({
  dispensationNotes: z.string().optional().nullable(),
});

export const searchPrescriptionsSchema = z.object({
  status: z.string().optional(),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  query: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createMedicationSchema = z.object({
  name: z.string().min(2),
  genericName: z.string().optional().nullable(),
  category: z.string().min(2),
  strength: z.string().min(1),
  dosageForm: z.string().min(1),
  unitPrice: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().int().min(0).default(100),
  batchNumber: z.string().optional().nullable(),
  manufactureDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  hospitalInputDate: z.string().optional().nullable(),
  requiresPrescription: z.boolean().default(true),
});

export const updateMedicationSchema = createMedicationSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreatePrescriptionItemInput = z.infer<typeof createPrescriptionItemSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type PayPrescriptionInput = z.infer<typeof payPrescriptionSchema>;
export type DispensePrescriptionInput = z.infer<typeof dispensePrescriptionSchema>;
export type SearchPrescriptionsQuery = z.infer<typeof searchPrescriptionsSchema>;
export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;



