'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DashboardLayout } from '../../components/DashboardLayout';
import { apiFetch } from '../../lib/api';
import {
  sanitizeNameInput,
  sanitizePhoneInput,
  validatePersonName,
  validateEthiopianPhone,
} from '../../lib/validation';
import {
  Users,
  Calendar,
  Activity,
  Settings,
  UserPlus,
  Clock,
  Shield,
  FileText,
  Building,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
  MapPin,
  Save,
  Trash2,
  Edit,
  Plus,
  DollarSign,
  Tag,
  Building2,
  RefreshCw,
  Download,
  ShieldAlert,
  KeyRound,
  Bell,
  Sliders,
  ChevronRight,
  Check,
  X,
  Search,
  Lock,
  UserX,
  UserCheck,
  CreditCard,
  Briefcase,
  Layers,
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  Pill,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, activeMembership, switchClinic, isLoading } = useAuth();
  const router = useRouter();

  // Navigation tab state covering all Admin permissions
  const [activeTab, setActiveTab] = useState<
    | 'users'
    | 'overview'
    | 'patients'
    | 'appointments'
    | 'queues'
    | 'doctors'
    | 'services'
    | 'branches'
    | 'staff'
    | 'profile'
    | 'settings'
    | 'audit'
    | 'subscription'
    | 'export'
    | 'superadmin'
  >('users');

  // Loaded clinic data
  const [overview, setOverview] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [clinicProfile, setClinicProfile] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  // Search & filter states
  const [patientSearch, setPatientSearch] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState('ALL');
  const [staffRoleFilter, setStaffRoleFilter] = useState('ALL');
  const [userDepartmentFilter, setUserDepartmentFilter] = useState('ALL');
  const [userSearchText, setUserSearchText] = useState('');

  // Add User Form Modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDepartment, setNewDepartment] = useState('Anesthesia');
  const [newRole, setNewRole] = useState<'Doctor' | 'Receptionist' | 'Pharmacist' | 'Specialist' | 'Laboratory' | 'Nursing' | 'Admin'>('Doctor');
  const [newSpeciality, setNewSpeciality] = useState('Anesthesiology & Critical Care');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [addUserMsg, setAddUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Staff invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('DOCTOR');
  const [inviteBranchId, setInviteBranchId] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Service creation form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState(50);
  const [serviceMsg, setServiceMsg] = useState('');
  const [isSavingService, setIsSavingService] = useState(false);

  // Branch creation form
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchIsMain, setBranchIsMain] = useState(false);
  const [branchMsg, setBranchMsg] = useState('');
  const [isSavingBranch, setIsSavingBranch] = useState(false);

  // Clinic profile form
  const [clinicName, setClinicName] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicTimezone, setClinicTimezone] = useState('UTC');
  const [profileMsg, setProfileMsg] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Settings form state
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Edit modals state
  const [editingService, setEditingService] = useState<any>(null);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Dedicated Platform Super-Admin Clinic Provisioning Modal State
  const [showCreateClinicModal, setShowCreateClinicModal] = useState(false);
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicSlug, setNewClinicSlug] = useState('');
  const [newClinicEmail, setNewClinicEmail] = useState('');
  const [newClinicPhone, setNewClinicPhone] = useState('');
  const [newClinicAddress, setNewClinicAddress] = useState('');
  const [newClinicTimezone, setNewClinicTimezone] = useState('America/New_York');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isSubmittingClinic, setIsSubmittingClinic] = useState(false);
  const [createClinicMsg, setCreateClinicMsg] = useState('');

  const handleClinicNameChange = (val: string) => {
    setNewClinicName(val);
    setNewClinicSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    );
  };

  const handleCreateClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClinic(true);
    setCreateClinicMsg('');

    const adminNameVal = validatePersonName(newAdminName);
    if (!adminNameVal.valid) {
      setCreateClinicMsg(adminNameVal.error || 'Invalid administrator name. Letters and characters only.');
      setIsSubmittingClinic(false);
      return;
    }
    const phoneVal = validateEthiopianPhone(newClinicPhone);
    if (!phoneVal.valid) {
      setCreateClinicMsg(phoneVal.error || 'Invalid clinic phone. Must be a valid Ethiopian phone number (09... or 07...).');
      setIsSubmittingClinic(false);
      return;
    }

    const res = await apiFetch('/clinics', {
      method: 'POST',
      body: JSON.stringify({
        name: newClinicName.trim(),
        slug: newClinicSlug.trim(),
        email: newClinicEmail.trim(),
        phone: phoneVal.normalizedPhone || newClinicPhone.trim(),
        address: newClinicAddress.trim(),
        timezone: newClinicTimezone,
        adminFullName: newAdminName.trim(),
        adminEmail: newAdminEmail.trim(),
        adminPassword: newAdminPassword,
      }),
    });

    setIsSubmittingClinic(false);

    if (res.success) {
      alert(`Clinic "${newClinicName}" registered successfully! Initial clinic admin: ${newAdminEmail}`);
      setShowCreateClinicModal(false);
      setNewClinicName('');
      setNewClinicSlug('');
      setNewClinicEmail('');
      setNewClinicPhone('');
      setNewClinicAddress('');
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      loadData();
    } else {
      setCreateClinicMsg(`Error: ${res.error?.message || 'Failed to create clinic'}`);
    }
  };

  useEffect(() => {
    if (
      !isLoading &&
      (!user ||
        (activeMembership?.role !== 'ADMIN' &&
          activeMembership?.role !== 'SUPER_ADMIN' &&
          activeMembership?.role !== 'MANAGER'))
    ) {
      router.push('/');
    }
  }, [user, activeMembership, isLoading, router]);

  const loadData = async () => {
    if (!activeMembership?.clinicId) return;

    const [
      ovRes,
      memRes,
      setRes,
      srvRes,
      docRes,
      brRes,
      clRes,
      patRes,
      aptRes,
      auditRes,
      subRes,
    ] = await Promise.all([
      apiFetch('/reports/overview'),
      apiFetch('/clinics/current/members'),
      apiFetch('/clinics/current/settings'),
      apiFetch('/services'),
      apiFetch('/doctors'),
      apiFetch('/clinics/current/branches'),
      apiFetch('/clinics/current'),
      apiFetch('/patients?limit=100'),
      apiFetch('/appointments?limit=100'),
      apiFetch('/clinics/current/today-activities'),
      apiFetch('/clinics/current/subscription'),
    ]);

    if (ovRes.success) setOverview(ovRes.data);
    if (memRes.success) setMembers(memRes.data);
    if (setRes.success) setSettings(setRes.data);
    if (srvRes.success) setServices(srvRes.data);
    if (docRes.success) setDoctors(docRes.data);
    if (brRes.success) setBranches(brRes.data);
    if (patRes.success && patRes.data) {
      setPatients(Array.isArray(patRes.data) ? patRes.data : patRes.data.patients || []);
    }
    if (aptRes.success && aptRes.data) {
      setAppointments(Array.isArray(aptRes.data) ? aptRes.data : []);
    }
    if (auditRes.success) setAuditLogs(auditRes.data || []);
    if (subRes.success) setSubscriptionInfo(subRes.data);

    if (clRes.success && clRes.data) {
      setClinicProfile(clRes.data);
      setClinicName(clRes.data.name || '');
      setClinicEmail(clRes.data.email || '');
      setClinicPhone(clRes.data.phone || '');
      setClinicAddress(clRes.data.address || '');
      setClinicTimezone(clRes.data.timezone || 'UTC');
    }
  };

  useEffect(() => {
    if (activeMembership?.clinicId) {
      loadData();
    }
  }, [activeMembership]);

  // Add new hospital user / staff directly
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUser(true);
    setAddUserMsg(null);

    let roleEnum: string = 'DOCTOR';
    switch (newRole) {
      case 'Doctor':
        roleEnum = 'DOCTOR';
        break;
      case 'Receptionist':
        roleEnum = 'RECEPTIONIST';
        break;
      case 'Pharmacist':
        roleEnum = 'PHARMACIST';
        break;
      case 'Specialist':
        roleEnum = 'SPECIALIST';
        break;
      case 'Laboratory':
        roleEnum = 'LABORATORY';
        break;
      case 'Nursing':
        roleEnum = 'NURSING';
        break;
      case 'Admin':
        roleEnum = 'ADMIN';
        break;
    }

    const nameVal = validatePersonName(newFullName);
    if (!nameVal.valid) {
      setAddUserMsg({ type: 'error', text: nameVal.error || 'Invalid staff name. Letters and characters only.' });
      return;
    }
    const phoneVal = validateEthiopianPhone(newPhone);
    if (!phoneVal.valid) {
      setAddUserMsg({ type: 'error', text: phoneVal.error || 'Invalid phone. Must be a valid Ethiopian phone number (09... or 07...).' });
      return;
    }

    try {
      const res = await apiFetch('/clinics/current/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          phone: phoneVal.normalizedPhone || newPhone.trim(),
          password: newPassword,
          department: newDepartment,
          role: roleEnum,
          specialty: newSpeciality,
        }),
      });

      if (res.success) {
        setAddUserMsg({ type: 'success', text: `Staff member ${newFullName} successfully added as ${newRole} in ${newDepartment}!` });
        setNewFullName('');
        setNewEmail('');
        setNewPhone('');
        setNewPassword('');
        await loadData();
        setTimeout(() => {
          setIsAddUserModalOpen(false);
          setAddUserMsg(null);
        }, 1200);
      } else {
        setAddUserMsg({ type: 'error', text: res.error?.message || 'Failed to add user.' });
      }
    } catch (err: any) {
      setAddUserMsg({ type: 'error', text: err?.message || 'Network error while adding user.' });
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Invite staff member
  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteMsg('');

    const nameVal = validatePersonName(inviteName);
    if (!nameVal.valid) {
      setInviteMsg(nameVal.error || 'Invalid staff name. Letters and characters only.');
      setIsInviting(false);
      return;
    }

    const res = await apiFetch('/auth/invite', {
      method: 'POST',
      body: JSON.stringify({
        email: inviteEmail.trim(),
        fullName: inviteName.trim(),
        role: inviteRole,
        branchId: inviteBranchId || undefined,
      }),
    });

    setIsInviting(false);

    if (res.success) {
      setInviteMsg(`Staff invitation created successfully! Token: ${res.data.token}`);
      setInviteEmail('');
      setInviteName('');
      loadData();
    } else {
      setInviteMsg(`Error: ${res.error?.message || 'Failed to send invite'}`);
    }
  };

  // Update member role
  const handleUpdateRole = async (memberId: string, newRole: string) => {
    const res = await apiFetch(`/clinics/current/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole }),
    });
    if (res.success) {
      alert('Member role updated successfully in database.');
      loadData();
    } else {
      alert(`Error updating role: ${res.error?.message}`);
    }
  };

  // Toggle member status (Assign / Suspend / Activate)
  const handleToggleMemberStatus = async (member: any) => {
    const nextStatus = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const res = await apiFetch(`/clinics/current/members/${member.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.success) {
      alert(`Membership status changed to ${nextStatus}.`);
      loadData();
    } else {
      alert(`Error updating membership: ${res.error?.message}`);
    }
  };

  // Revoke / Remove membership
  const handleRevokeMembership = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to revoke clinic access for ${memberName}?`)) return;
    const res = await apiFetch(`/clinics/current/members/${memberId}`, {
      method: 'DELETE',
    });
    if (res.success) {
      alert('Clinic membership revoked successfully.');
      loadData();
    } else {
      alert(`Error revoking membership: ${res.error?.message}`);
    }
  };

  // Update hospital user details (Full CRUD)
  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const nameVal = validatePersonName(editingUser.fullName || '');
    if (!nameVal.valid) {
      alert(nameVal.error || 'Invalid staff name. Letters and characters only.');
      return;
    }
    let normPhone = editingUser.phone;
    if (editingUser.phone && editingUser.phone.trim()) {
      const phoneVal = validateEthiopianPhone(editingUser.phone);
      if (!phoneVal.valid) {
        alert(phoneVal.error || 'Invalid phone. Must be a valid Ethiopian phone number (09... or 07...).');
        return;
      }
      normPhone = phoneVal.normalizedPhone || editingUser.phone;
    }

    setIsUpdatingUser(true);
    try {
      const res = await apiFetch(`/clinics/current/members/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editingUser.fullName.trim(),
          phone: normPhone ? normPhone.trim() : null,
          department: editingUser.department,
          role: editingUser.role,
          specialty: editingUser.specialty,
          status: editingUser.status,
        }),
      });
      if (res.success) {
        alert('Hospital staff member updated successfully in database.');
        setEditingUser(null);
        await loadData();
      } else {
        alert(`Error updating user: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Network error updating user: ${err?.message}`);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Create service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingService(true);
    setServiceMsg('');
    const res = await apiFetch('/services', {
      method: 'POST',
      body: JSON.stringify({
        name: newServiceName.trim(),
        description: newServiceDesc.trim() || undefined,
        durationMinutes: Number(newServiceDuration),
        price: Number(newServicePrice),
      }),
    });
    setIsSavingService(false);
    if (res.success) {
      setServiceMsg('Service added to catalog!');
      setNewServiceName('');
      setNewServiceDesc('');
      setNewServiceDuration(30);
      setNewServicePrice(50);
      loadData();
    } else {
      setServiceMsg(`Error: ${res.error?.message || 'Failed to create service'}`);
    }
  };

  // Update service
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    const res = await apiFetch(`/services/${editingService.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: editingService.name,
        description: editingService.description,
        durationMinutes: Number(editingService.durationMinutes),
        price: Number(editingService.price),
        isActive: editingService.isActive,
      }),
    });
    if (res.success) {
      alert('Service updated successfully.');
      setEditingService(null);
      loadData();
    } else {
      alert(`Error updating service: ${res.error?.message}`);
    }
  };

  // Delete service
  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate/delete this service?')) return;
    const res = await apiFetch(`/services/${id}`, { method: 'DELETE' });
    if (res.success) {
      alert('Service deleted successfully.');
      loadData();
    } else {
      alert(`Error: ${res.error?.message}`);
    }
  };

  // Create branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBranch(true);
    setBranchMsg('');

    let normPhone = branchPhone;
    if (branchPhone.trim()) {
      const phoneVal = validateEthiopianPhone(branchPhone);
      if (!phoneVal.valid) {
        setBranchMsg(phoneVal.error || 'Invalid branch phone. Must be a valid Ethiopian phone number (09... or 07...).');
        setIsSavingBranch(false);
        return;
      }
      normPhone = phoneVal.normalizedPhone || branchPhone;
    }

    const res = await apiFetch('/clinics/current/branches', {
      method: 'POST',
      body: JSON.stringify({
        name: branchName.trim(),
        address: branchAddress.trim(),
        phone: normPhone.trim(),
        isMain: branchIsMain,
      }),
    });
    setIsSavingBranch(false);
    if (res.success) {
      setBranchMsg('Branch registered successfully!');
      setBranchName('');
      setBranchAddress('');
      setBranchPhone('');
      setBranchIsMain(false);
      loadData();
    } else {
      setBranchMsg(`Error: ${res.error?.message || 'Failed to create branch'}`);
    }
  };

  // Update branch
  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    let normPhone = editingBranch.phone;
    if (editingBranch.phone && editingBranch.phone.trim()) {
      const phoneVal = validateEthiopianPhone(editingBranch.phone);
      if (!phoneVal.valid) {
        alert(phoneVal.error || 'Invalid branch phone. Must be a valid Ethiopian phone number (09... or 07...).');
        return;
      }
      normPhone = phoneVal.normalizedPhone || editingBranch.phone;
    }

    const res = await apiFetch(`/clinics/current/branches/${editingBranch.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: editingBranch.name,
        address: editingBranch.address,
        phone: normPhone,
        isMain: editingBranch.isMain,
      }),
    });
    if (res.success) {
      alert('Branch updated successfully.');
      setEditingBranch(null);
      loadData();
    } else {
      alert(`Error updating branch: ${res.error?.message}`);
    }
  };

  // Delete branch
  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    const res = await apiFetch(`/clinics/current/branches/${id}`, { method: 'DELETE' });
    if (res.success) {
      alert('Branch deleted successfully.');
      loadData();
    } else {
      alert(`Error: ${res.error?.message}`);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg('');

    let normPhone = clinicPhone;
    if (clinicPhone.trim()) {
      const phoneVal = validateEthiopianPhone(clinicPhone);
      if (!phoneVal.valid) {
        setProfileMsg(phoneVal.error || 'Invalid hospital phone. Must be a valid Ethiopian phone number (09... or 07...).');
        setIsSavingProfile(false);
        return;
      }
      normPhone = phoneVal.normalizedPhone || clinicPhone;
    }

    const res = await apiFetch('/clinics/current', {
      method: 'PATCH',
      body: JSON.stringify({
        name: clinicName.trim(),
        email: clinicEmail.trim(),
        phone: normPhone.trim(),
        address: clinicAddress.trim(),
        timezone: clinicTimezone,
      }),
    });
    setIsSavingProfile(false);
    if (res.success) {
      setProfileMsg('Hospital profile updated successfully in database!');
      loadData();
    } else {
      setProfileMsg(`Error: ${res.error?.message || 'Failed to update profile'}`);
    }
  };

  // Update policies & settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg('');

    const res = await apiFetch('/clinics/current/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        appointmentDurationDefault: Number(settings.appointmentDurationDefault),
        cancellationNoticeHours: Number(settings.cancellationNoticeHours),
        maxAdvanceBookingDays: Number(settings.maxAdvanceBookingDays),
        queueTokenPrefix: settings.queueTokenPrefix,
        queueAutoCall: Boolean(settings.queueAutoCall),
        publicBookingEnabled: Boolean(settings.publicBookingEnabled),
        smsNotificationsEnabled: Boolean(settings.smsNotificationsEnabled),
        emailNotificationsEnabled: Boolean(settings.emailNotificationsEnabled),
      }),
    });

    setSavingSettings(false);
    if (res.success) {
      setSettingsMsg('Operational policies and notification settings updated successfully!');
      loadData();
    } else {
      setSettingsMsg(`Error: ${res.error?.message}`);
    }
  };

  // Export clinic data to CSV helper
  const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPatients = () => {
    const headers = ['Patient ID', 'Full Name', 'Email', 'Phone', 'Gender', 'DOB', 'Address'];
    const rows = patients.map((p) => [
      p.patientNumber || p.id,
      p.user?.fullName || '',
      p.user?.email || '',
      p.user?.phone || '',
      p.gender || '',
      p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
      p.address || '',
    ]);
    exportToCsv('authorized-hospital-patients', headers, rows);
  };

  const exportAppointments = () => {
    const headers = ['Appointment ID', 'Patient Name', 'Doctor', 'Service', 'Date & Time', 'Status'];
    const rows = appointments.map((a) => [
      a.id,
      a.patient?.user?.fullName || 'Walk-in',
      a.doctor?.fullName || 'Assigned',
      a.service?.name || 'General',
      new Date(a.startTime).toLocaleString(),
      a.status,
    ]);
    exportToCsv('authorized-hospital-appointments', headers, rows);
  };

  const exportAuditLogs = () => {
    const headers = ['Audit ID', 'Timestamp', 'Actor ID', 'Role', 'Action', 'Resource', 'Resource ID'];
    const rows = auditLogs.map((log) => [
      log.id,
      new Date(log.createdAt).toLocaleString(),
      log.actorId || 'SYSTEM',
      log.actorRole || 'N/A',
      log.action,
      log.resourceType,
      log.resourceId || '',
    ]);
    exportToCsv('authorized-hospital-audit-logs', headers, rows);
  };

  if (isLoading || !user) {
    return <div className="p-10 text-center text-slate-500">Loading Hospital Administration Console...</div>;
  }

  const m = overview?.metrics;

  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase();
    const name = p.user?.fullName?.toLowerCase() || '';
    const email = p.user?.email?.toLowerCase() || '';
    const num = p.patientNumber?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || num.includes(q);
  });

  const filteredAppointments = appointments.filter((a) => {
    if (appointmentFilter === 'ALL') return true;
    return a.status === appointmentFilter;
  });

  const filteredStaff = members.filter((mem) => {
    if (staffRoleFilter === 'ALL') return true;
    return mem.role === staffRoleFilter;
  });

  const filteredUsers = members.filter((mem) => {
    if (staffRoleFilter !== 'ALL' && mem.role !== staffRoleFilter) return false;
    if (userDepartmentFilter !== 'ALL') {
      const dept = mem.department?.toLowerCase() || '';
      if (!dept.includes(userDepartmentFilter.toLowerCase())) return false;
    }
    if (userSearchText.trim()) {
      const q = userSearchText.toLowerCase();
      const name = mem.user?.fullName?.toLowerCase() || '';
      const email = mem.user?.email?.toLowerCase() || '';
      const phone = mem.user?.phone?.toLowerCase() || '';
      const dept = mem.department?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || phone.includes(q) || dept.includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout
      roleTitle="Hospital Administration"
      roleBadge={activeMembership?.role === 'SUPER_ADMIN' ? '👑 Super Admin' : '🛡️ Admin'}
      roleColor="indigo"
      activeItemId={activeTab}
      onSelectNav={(id) => setActiveTab(id as any)}
      headerTitle={
        activeTab === 'users' || activeTab === 'staff'
          ? 'Hospital User & Staff Management'
          : activeTab === 'overview'
          ? 'Hospital Operational Overview'
          : activeTab === 'patients'
          ? 'Hospital Patients Registry'
          : activeTab === 'appointments'
          ? 'All Hospital Appointments'
          : activeTab === 'queues'
          ? 'Live Queue Sessions & Tokens'
          : activeTab === 'doctors'
          ? 'Doctor Schedules & Availability'
          : activeTab === 'services'
          ? 'Hospital Services & Clinical Specialties'
          : activeTab === 'branches'
          ? 'Hospital Facilities & Branches'
          : activeTab === 'profile'
          ? 'Hospital Facility & System Profile'
          : activeTab === 'settings'
          ? 'Policies, Queues & Notifications'
          : activeTab === 'audit'
          ? 'Hospital Security & Audit Logs'
          : activeTab === 'subscription'
          ? 'Subscription & Quota Usage'
          : activeTab === 'export'
          ? 'Hospital Data Export Center'
          : 'Platform Governance & Super-Admin'
      }
      headerSubtitle={`Authorized Hospital Scope: ${activeMembership?.clinicName || 'Hospital'} (${activeMembership?.clinicSlug})`}
      headerActions={
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setAddUserMsg(null);
              setIsAddUserModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add User</span>
          </button>

          {(activeMembership?.role === 'SUPER_ADMIN' || activeMembership?.role === 'ADMIN') && (
            <Link
              href="/superadmin"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Super Admin Console</span>
            </Link>
          )}

          <button
            onClick={loadData}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      }
      navGroups={[
        {
          groupLabel: 'User & Staff Management',
          items: [
            {
              id: 'users',
              label: 'User Management',
              icon: Users,
              badge: members.length,
              badgeColor: 'bg-blue-100 text-blue-800 font-bold',
            },
          ],
        },
        {
          groupLabel: 'Hospital Care Operations',
          items: [
            { id: 'overview', label: 'Operations Center', icon: Activity },
            { id: 'appointments', label: 'All Appointments', icon: Calendar, badge: appointments.length },
            { id: 'queues', label: 'Live Queue Manager', icon: Clock },
            { id: 'patients', label: 'Patients Registry', icon: UserCheck, badge: patients.length },
            { id: 'doctors', label: 'Doctor Availability', icon: Stethoscope, badge: doctors.length },
          ],
        },
        {
          groupLabel: 'Services & Facility',
          items: [
            { id: 'services', label: 'Services Catalog', icon: Tag, badge: services.length },
            { id: 'branches', label: 'Branches & Rooms', icon: Building2, badge: branches.length },
          ],
        },
        {
          groupLabel: 'Governance & Settings',
          items: [
            { id: 'profile', label: 'Hospital Profile', icon: Building },
            { id: 'settings', label: 'Policies & Notifications', icon: Settings },
            { id: 'audit', label: "Today's Activities (DB)", icon: FileText, badge: auditLogs.length },
            { id: 'subscription', label: 'Plan & Usage Quotas', icon: CreditCard },
            { id: 'export', label: 'Export Hospital Data', icon: Download },
          ],
        },
        {
          groupLabel: 'Platform Governance',
          items: [
            { id: 'superadmin', label: 'Super-Admin Console', icon: ShieldAlert },
          ],
        },
      ]}
    >
      {/* ========================================================= */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Patients</span>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{patients.length || m?.totalPatients || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Authorized clinic records</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Today Appointments</span>
                <Calendar className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{m?.todayAppointments?.total ?? appointments.length}</div>
              <p className="text-xs text-emerald-600 mt-1">
                {m?.todayAppointments?.completed ?? 0} Completed • {m?.todayAppointments?.inQueue ?? 0} In Queue
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Live Waiting Queue</span>
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{m?.waitingInQueue ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">{m?.currentlyServing ?? 0} Currently Serving</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Cancellation Rate</span>
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{m?.cancellationRatePercent ?? 0}%</div>
              <p className="text-xs text-slate-500 mt-1">No-show rate: {m?.noShowRatePercent ?? 0}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Active Staff Members</h3>
                <button onClick={() => setActiveTab('staff')} className="text-xs text-purple-600 font-semibold hover:underline">
                  Manage Staff →
                </button>
              </div>
              <div className="space-y-3">
                {members.slice(0, 5).map((mem) => (
                  <div key={mem.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">{mem.user?.fullName}</div>
                      <div className="text-[11px] text-slate-400">{mem.user?.email}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mem.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {mem.status}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                        {mem.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Recent Audit Activities</h3>
                <button onClick={() => setActiveTab('audit')} className="text-xs text-purple-600 font-semibold hover:underline">
                  View All Logs →
                </button>
              </div>
              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">{log.action}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {log.resourceType}
                    </span>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">No recent security events recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CLINIC PATIENTS REGISTRY */}
      {/* ========================================================= */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Clinic Patient Records</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and manage all registered patients affiliated with {activeMembership?.clinicName}.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search name, email, PT#..."
                    className="text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-purple-600 w-56"
                  />
                </div>
                <button
                  onClick={exportPatients}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Patient Number</th>
                    <th className="py-3 px-3">Full Legal Name</th>
                    <th className="py-3 px-3">Email Address</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Gender / DOB</th>
                    <th className="py-3 px-3">Residential Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-purple-700">{p.patientNumber || 'PT-PENDING'}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{p.user?.fullName}</td>
                      <td className="py-3 px-3 text-slate-600">{p.user?.email}</td>
                      <td className="py-3 px-3 text-slate-600">{p.user?.phone || '—'}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {p.gender || 'N/A'} • {p.dateOfBirth ? p.dateOfBirth.split('T')[0] : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{p.address || '—'}</td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No patient records found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ALL HOSPITAL APPOINTMENTS */}
      {/* ========================================================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">All Hospital Appointments</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comprehensive oversight of all scheduled, active, and completed appointments across clinical staff.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={appointmentFilter}
                  onChange={(e) => setAppointmentFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_QUEUE">IN_QUEUE</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <button
                  onClick={exportAppointments}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Attending Doctor</th>
                    <th className="py-3 px-3">Clinical Service</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {new Date(a.startTime).toLocaleDateString()} {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">{a.patient?.user?.fullName || 'Walk-in Patient'}</td>
                      <td className="py-3 px-3 text-slate-700">Dr. {a.doctor?.fullName || 'Assigned Physician'}</td>
                      <td className="py-3 px-3 text-slate-600">{a.service?.name || 'Consultation'}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            a.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.status === 'IN_PROGRESS' || a.status === 'IN_QUEUE'
                              ? 'bg-blue-100 text-blue-800'
                              : a.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No appointments found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: LIVE QUEUE MANAGER */}
      {/* ========================================================= */}
      {activeTab === 'queues' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Clinic Queue & Live Sessions</h2>
            <p className="text-xs text-slate-500 mb-6">
              Manage real-time queue sessions, token counters, and service flow.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <span className="text-xs font-semibold text-purple-700 block uppercase">Active Queue Prefix</span>
                <span className="text-2xl font-black text-purple-900 mt-1 block">{settings?.queueTokenPrefix || 'T'}</span>
                <span className="text-[11px] text-purple-600">Configured in Clinic Settings</span>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-xs font-semibold text-blue-700 block uppercase">Queue Auto-Calling</span>
                <span className="text-2xl font-black text-blue-900 mt-1 block">{settings?.queueAutoCall ? 'ENABLED' : 'MANUAL'}</span>
                <span className="text-[11px] text-blue-600">Automated queue dispatcher</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-semibold text-emerald-700 block uppercase">Currently Serving</span>
                <span className="text-2xl font-black text-emerald-900 mt-1 block">{m?.currentlyServing ?? 0}</span>
                <span className="text-[11px] text-emerald-600">{m?.waitingInQueue ?? 0} patients waiting</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Public Waiting Display Board</span>
                <span className="text-[11px] text-slate-500">Accessible for waiting room TV screens and patient mobile monitors.</span>
              </div>
              <a
                href={`/display/${clinicProfile?.slug || activeMembership?.clinicSlug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
              >
                <span>Open Display Board</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: DOCTOR SCHEDULES & AVAILABILITY */}
      {/* ========================================================= */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Doctor Profiles & Schedules</h2>
            <p className="text-xs text-slate-500 mb-6">
              Configure attending doctors, specialties, shift hours, and availability exceptions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doc) => (
                <div key={doc.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">Dr. {doc.fullName}</span>
                      <span className="text-xs text-purple-700 font-semibold">{doc.specialty || 'General Practitioner'}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {doc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                    <div>Email: <strong className="text-slate-700">{doc.email}</strong></div>
                    <div>Phone: <strong className="text-slate-700">{doc.phone || '—'}</strong></div>
                    <div>Branch: <strong className="text-slate-700">{doc.branch?.name || 'Main Branch'}</strong></div>
                  </div>
                </div>
              ))}
              {doctors.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center col-span-3">
                  No doctors registered yet. Use the Staff tab to invite doctors.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: SERVICES CATALOG */}
      {/* ========================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Add New Clinical Service</h2>
            {serviceMsg && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                {serviceMsg}
              </div>
            )}
            <form onSubmit={handleCreateService} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology Consultation"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes) *</label>
                <input
                  type="number"
                  required
                  min={5}
                  max={240}
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fee / Price ($) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief clinical description"
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Service to Catalog</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Configured Clinical Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((srv) => (
                <div key={srv.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-slate-900 text-xs block">{srv.name}</span>
                      <span className="text-xs font-extrabold text-emerald-700">${srv.price}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{srv.description || 'Standard appointment service'}</p>
                    <div className="mt-2 text-[10px] text-slate-400">Duration: {srv.durationMinutes} mins</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingService(srv)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Service"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(srv.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: BRANCHES & LOCATIONS */}
      {/* ========================================================= */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Add Clinic Branch Location</h2>
            {branchMsg && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                {branchMsg}
              </div>
            )}
            <form onSubmit={handleCreateBranch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Downtown Wellness Center"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Physical Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street, Suite, City, State"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone * <span className="text-slate-400 font-normal">(Ethiopian 09 / 07... numbers only)</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0911223344 or +251911223344"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(sanitizePhoneInput(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600 font-mono"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branchIsMain}
                    onChange={(e) => setBranchIsMain(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Designate as Main Headquarters Branch</span>
                </label>

                <button
                  type="submit"
                  disabled={isSavingBranch}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Branch</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Authorized Clinic Branches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b) => (
                <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-slate-900 text-xs block">{b.name}</span>
                      {b.isMain && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                          Main Branch
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-2 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{b.address}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">Phone: {b.phone}</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingBranch(b)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Branch"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(b.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: USER MANAGEMENT & CLINICAL STAFF DIRECTORY */}
      {/* ========================================================= */}
      {(activeTab === 'users' || activeTab === 'staff') && (
        <div className="space-y-6">
          {/* Header Action Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 rounded-2xl shadow-lg border border-indigo-800/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-semibold tracking-wide uppercase">
                  <Users className="w-3.5 h-3.5" />
                  <span>Hospital Staff Administration</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  User Management & Clinical Workforce
                </h2>
                <p className="text-xs sm:text-sm text-blue-200/80 max-w-2xl">
                  Provision new doctors, nursing personnel, pharmacists, lab technicians, specialists, and administrators. Manage role assignments and hospital access.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAddUserMsg(null);
                    setIsAddUserModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-blue-500/25 flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add User</span>
                </button>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-[11px] text-blue-200 font-medium">Total Hospital Staff</div>
                <div className="text-xl font-black text-white mt-0.5">{members.length}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-[11px] text-blue-200 font-medium">Doctors & Specialists</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">
                  {members.filter((m) => m.role === 'DOCTOR' || m.role === 'SPECIALIST').length}
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-[11px] text-blue-200 font-medium">Nursing Personnel</div>
                <div className="text-xl font-black text-teal-300 mt-0.5">
                  {members.filter((m) => m.role === 'NURSING').length}
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-[11px] text-blue-200 font-medium">Pharmacy & Laboratory</div>
                <div className="text-xl font-black text-amber-300 mt-0.5">
                  {members.filter((m) => m.role === 'PHARMACIST' || m.role === 'LABORATORY').length}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by full name, email, phone, or department..."
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Dept:</span>
                <select
                  value={userDepartmentFilter}
                  onChange={(e) => setUserDepartmentFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Anesthesia">Anesthesia</option>
                  <option value="Nursing">Nursing</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Diagnostics">Diagnostics</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Role:</span>
                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="SPECIALIST">SPECIALIST</option>
                  <option value="NURSING">NURSING</option>
                  <option value="PHARMACIST">PHARMACIST</option>
                  <option value="LABORATORY">LABORATORY</option>
                  <option value="RECEPTIONIST">RECEPTIONIST</option>
                  <option value="PATIENT">PATIENT</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAddUserMsg(null);
                  setIsAddUserModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add User</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hospital Users Directory ({filteredUsers.length})</h3>
                <p className="text-xs text-slate-500">Active medical, paramedical, clinical and administrative staff.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No hospital users found matching criteria.</p>
                        <p className="text-xs text-slate-400 mt-1">Try clearing your search query or department filter.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setAddUserMsg(null);
                            setIsAddUserModalOpen(true);
                          }}
                          className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Add New User</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((mem) => {
                      const dept = mem.department || 'General';
                      let deptBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (dept.toLowerCase().includes('anesth')) {
                        deptBadgeClass = 'bg-cyan-100 text-cyan-800 border-cyan-200';
                      } else if (dept.toLowerCase().includes('nurs')) {
                        deptBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      } else if (dept.toLowerCase().includes('pharm')) {
                        deptBadgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                      } else if (dept.toLowerCase().includes('lab')) {
                        deptBadgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
                      } else if (dept.toLowerCase().includes('surg')) {
                        deptBadgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
                      } else if (dept.toLowerCase().includes('ped')) {
                        deptBadgeClass = 'bg-teal-100 text-teal-800 border-teal-200';
                      } else if (dept.toLowerCase().includes('med')) {
                        deptBadgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                      }

                      return (
                        <tr key={mem.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                                {mem.user?.fullName
                                  ? mem.user.fullName
                                      .split(' ')
                                      .map((n: string) => n[0])
                                      .slice(0, 2)
                                      .join('')
                                      .toUpperCase()
                                  : 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{mem.user?.fullName || 'Hospital User'}</div>
                                <div className="text-[11px] text-slate-400">ID: {mem.user?.id?.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-slate-700 font-medium">{mem.user?.email}</div>
                            <div className="text-slate-400 text-[11px]">{mem.user?.phone || 'No phone recorded'}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg border ${deptBadgeClass}`}>
                              {mem.department || 'General Medicine'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={mem.role}
                              disabled={mem.userId === user?.id}
                              onChange={(e) => handleUpdateRole(mem.id, e.target.value)}
                              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-bold text-slate-800 outline-none focus:border-blue-600"
                            >
                              <option value="SUPER_ADMIN">👑 SUPER ADMIN</option>
                              <option value="ADMIN">🛡️ ADMIN</option>
                              <option value="MANAGER">MANAGER</option>
                              <option value="DOCTOR">🩺 DOCTOR</option>
                              <option value="SPECIALIST">🔬 SPECIALIST</option>
                              <option value="NURSING">🧑‍⚕️ NURSING</option>
                              <option value="PHARMACIST">💊 PHARMACIST</option>
                              <option value="LABORATORY">🧪 LABORATORY</option>
                              <option value="RECEPTIONIST">📋 RECEPTIONIST</option>
                              <option value="PATIENT">👤 PATIENT</option>
                            </select>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                                mem.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {mem.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingUser({
                                  id: mem.id,
                                  userId: mem.userId,
                                  fullName: mem.user?.fullName || '',
                                  email: mem.user?.email || '',
                                  phone: mem.user?.phone || '',
                                  department: mem.department || 'Medicine',
                                  role: mem.role,
                                  specialty: mem.user?.doctorProfiles?.[0]?.specialty || mem.department || '',
                                  status: mem.status,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition"
                            >
                              Edit
                            </button>
                            {mem.userId !== user?.id && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleMemberStatus(mem)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
                                    mem.status === 'ACTIVE'
                                      ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  {mem.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeMembership(mem.id, mem.user?.fullName)}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 transition"
                                >
                                  Revoke
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Staff Invitation Box (Preserved functionality) */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Send Email Invitation to New Staff</h3>
            <p className="text-xs text-slate-500 mb-4">
              Alternatively, generate a registration link token to invite remote practitioners.
            </p>
            {inviteMsg && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                {inviteMsg}
              </div>
            )}
            <form onSubmit={handleInviteStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name * <span className="text-slate-400 font-normal">(Letters & chars only)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Abebe"
                  value={inviteName}
                  onChange={(e) => setInviteName(sanitizeNameInput(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="doctor@hospital.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-blue-600 font-medium"
                >
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="SPECIALIST">SPECIALIST</option>
                  <option value="NURSING">NURSING</option>
                  <option value="PHARMACIST">PHARMACIST</option>
                  <option value="LABORATORY">LABORATORY</option>
                  <option value="RECEPTIONIST">RECEPTIONIST</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Branch</label>
                <select
                  value={inviteBranchId}
                  onChange={(e) => setInviteBranchId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-blue-600 font-medium"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Send Staff Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD USER FORM MODAL */}
      {/* ========================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Hospital User</h3>
                  <p className="text-xs text-slate-500">
                    Register a new verified user account with assigned department, role, and credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddUserModalOpen(false);
                  setAddUserMsg(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addUserMsg && (
              <div
                className={`mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
                  addUserMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {addUserMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{addUserMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} className="mt-5 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(Letters & chars only)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Abebe Bikila"
                  value={newFullName}
                  onChange={(e) => setNewFullName(sanitizeNameInput(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-medium"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. user@hospital.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(Ethiopian 09 / 07... numbers only)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0995774866"
                    value={newPhone}
                    onChange={(e) => setNewPhone(sanitizePhoneInput(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-mono font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter account initial password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white outline-none focus:border-blue-600 font-semibold text-slate-800"
                >
                  <option value="Anesthesia">Anesthesia (Anesthesia & Critical Care)</option>
                  <option value="Nursing">Nursing (Inpatient & Clinical Nursing)</option>
                  <option value="Medicine">Medicine (Internal Medicine & General Practice)</option>
                  <option value="Pharmacy">Pharmacy (Hospital Pharmacy & Dispensation)</option>
                  <option value="Laboratory">Laboratory (Diagnostic Pathology & Lab Science)</option>
                  <option value="Surgery">Surgery (General & Specialized Surgical Theater)</option>
                  <option value="Pediatrics">Pediatrics (Child Health & Neonatal Care)</option>
                  <option value="Diagnostics">Diagnostics (Radiology, X-Ray & Ultrasound)</option>
                  <option value="Emergency">Emergency (Casualty & Emergency Triage)</option>
                  <option value="Administration">Hospital Administration (Executive & Records)</option>
                </select>
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white outline-none focus:border-blue-600 font-semibold text-slate-800"
                >
                  <option value="Doctor">Doctor (Physician / Clinical Practitioner)</option>
                  <option value="Receptionist">Receptionist (Front Desk & Registration)</option>
                  <option value="Pharmacist">Pharmacist (Medication & Dispensing)</option>
                  <option value="Specialist">Specialist (Radiology, Imaging, Surgery)</option>
                  <option value="Laboratory">Laboratory (Lab Scientist / Technician)</option>
                  <option value="Nursing">Nursing (Registered Clinical Nurse)</option>
                  <option value="Admin">Admin (Hospital Operations Administrator)</option>
                </select>
              </div>

              {/* Speciality Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Speciality <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newSpeciality}
                  onChange={(e) => setNewSpeciality(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white outline-none focus:border-blue-600 font-semibold text-slate-800"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Anesthesiology & Critical Care">Anesthesiology & Critical Care</option>
                  <option value="Nursing Care & Clinical Triage">Nursing Care & Clinical Triage</option>
                  <option value="Clinical Pharmacy">Clinical Pharmacy & Dispensation</option>
                  <option value="Laboratory Science & Pathology">Laboratory Science & Pathology</option>
                  <option value="Radiology & Specialist Imaging">Radiology & Specialist Imaging (X-Ray / CT)</option>
                  <option value="General Surgery">General Surgery</option>
                  <option value="Orthopedic Surgery">Orthopedic Surgery</option>
                  <option value="Pediatrics & Child Health">Pediatrics & Child Health</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Emergency Medicine">Emergency Medicine</option>
                  <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                  <option value="Hospital Administration">Hospital Administration & Operations</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserModalOpen(false);
                    setAddUserMsg(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20 flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmittingUser ? (
                    <span>Registering Staff User...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Add User to Hospital</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 9: HOSPITAL PROFILE & BRANDING */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Hospital Identity & Facility Profile</h2>
            {profileMsg && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                {profileMsg}
              </div>
            )}
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Identifier Slug</label>
                  <input
                    type="text"
                    disabled
                    value={clinicProfile?.slug || ''}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-100 text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={clinicEmail}
                    onChange={(e) => setClinicEmail(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Contact Phone * <span className="text-slate-400 font-normal">(Ethiopian 09 / 07... numbers only)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0911223344 or +251911223344"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(sanitizePhoneInput(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Headquarters Address *</label>
                <input
                  type="text"
                  required
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone *</label>
                <select
                  value={clinicTimezone}
                  onChange={(e) => setClinicTimezone(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                >
                  <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (East Africa Time / UTC+3)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT / UTC+3)</option>
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">America/New_York (Eastern)</option>
                  <option value="America/Chicago">America/Chicago (Central)</option>
                  <option value="America/Denver">America/Denver (Mountain)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Hospital Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 10: POLICIES, QUEUES & NOTIFICATION SETTINGS */}
      {/* ========================================================= */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Operational Policies, Queue & Notifications</h2>
            {settingsMsg && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                {settingsMsg}
              </div>
            )}
            <form onSubmit={handleUpdateSettings} className="space-y-6 max-w-2xl">
              {/* Section 1: Appointment Policies */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-purple-900 block uppercase tracking-wide">
                  1. Appointment & Cancellation Policies
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Default Slot Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={240}
                      value={settings.appointmentDurationDefault}
                      onChange={(e) => setSettings({ ...settings, appointmentDurationDefault: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cancellation Notice Requirement (Hours)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={settings.cancellationNoticeHours}
                      onChange={(e) => setSettings({ ...settings, cancellationNoticeHours: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maximum Advance Booking Horizon (Days)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={settings.maxAdvanceBookingDays}
                    onChange={(e) => setSettings({ ...settings, maxAdvanceBookingDays: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Section 2: Queue Settings */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-purple-900 block uppercase tracking-wide">
                  2. Live Queue Configuration
                </span>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Queue Token Prefix</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={settings.queueTokenPrefix}
                    onChange={(e) => setSettings({ ...settings, queueTokenPrefix: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Example: Prefix &apos;T&apos; produces tokens like T-101, T-102.</p>
                </div>

                <div className="pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.queueAutoCall)}
                      onChange={(e) => setSettings({ ...settings, queueAutoCall: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Enable Automated Queue Next-Patient Dispatching</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.publicBookingEnabled)}
                      onChange={(e) => setSettings({ ...settings, publicBookingEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Allow Remote Online Self-Service Patient Appointments</span>
                  </label>
                </div>
              </div>

              {/* Section 3: Notification Policies */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-purple-900 block uppercase tracking-wide">
                  3. Clinic Notification Dispatchers
                </span>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.emailNotificationsEnabled)}
                      onChange={(e) => setSettings({ ...settings, emailNotificationsEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Email Notifications (Appointment confirmations & reminders)</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.smsNotificationsEnabled)}
                      onChange={(e) => setSettings({ ...settings, smsNotificationsEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>SMS Notifications (Queue call alerts & text reminders)</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Operational Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 11: HOSPITAL DATABASE ACTIVITIES & AUDIT LOGS */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span>Today's Hospital Database Activity & Audit Registry</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time record of all clinical, patient, appointment, diagnostic, pharmacy, and administrative activities logged directly in the database.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={loadData}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold transition border border-purple-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync DB Activities</span>
                </button>
                <button
                  onClick={exportAuditLogs}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Activity Trail</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Activity Action</th>
                    <th className="py-3 px-3">Activity Description & Details (DB)</th>
                    <th className="py-3 px-3">Resource Type</th>
                    <th className="py-3 px-3">Actor Role</th>
                    <th className="py-3 px-3">Resource ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => {
                    const desc = log.metadata?.description || log.metadata?.reason || log.action;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px] whitespace-nowrap">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium max-w-md">
                          <div>{desc}</div>
                          {log.metadata && Object.keys(log.metadata).length > 1 && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                              {JSON.stringify(
                                Object.fromEntries(
                                  Object.entries(log.metadata).filter(([k]) => k !== 'description')
                                )
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{log.resourceType}</td>
                        <td className="py-3 px-3 text-slate-600 font-semibold">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px]">
                            {log.actorRole || 'SYSTEM'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400 text-[10px]">{log.resourceId ? log.resourceId.slice(0, 8) + '...' : '—'}</td>
                      </tr>
                    );
                  })}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No activity events recorded today in database.</p>
                        <p className="text-xs text-slate-400 mt-1">Actions performed across the hospital will automatically populate here.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 12: SUBSCRIPTION & USAGE INFORMATION */}
      {/* ========================================================= */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Subscription Tier & Quota Limits</h2>
            <p className="text-xs text-slate-500 mb-6">
              Review current clinic capacity, active staff quota, and facility boundaries.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Active Plan</span>
                <span className="text-2xl font-black text-purple-950 mt-1 block">
                  {subscriptionInfo?.subscription?.plan?.name || 'Enterprise Clinic Pro'}
                </span>
                <span className="text-[11px] text-purple-700 font-medium">
                  Status: <strong className="text-emerald-700">{subscriptionInfo?.subscription?.status || 'ACTIVE'}</strong>
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Billing Frequency</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">$199.00 / mo</span>
                <span className="text-[11px] text-slate-500">Multi-branch enterprise tier</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Renews On</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {subscriptionInfo?.subscription?.currentPeriodEnd
                    ? new Date(subscriptionInfo.subscription.currentPeriodEnd).toLocaleDateString()
                    : 'Annual Renewal'}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">Automated healthcare compliance renewal</span>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 text-sm mb-4">Resource Utilization Against Plan Quotas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Doctors Employed</span>
                  <span className="text-purple-700">{doctors.length} / 25</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min((doctors.length / 25) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Branches Registered</span>
                  <span className="text-blue-700">{branches.length} / 10</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min((branches.length / 10) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Total Staff Members</span>
                  <span className="text-emerald-700">{members.length} / 50</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min((members.length / 50) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 13: CLINIC DATA EXPORT CENTER */}
      {/* ========================================================= */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Export Authorized Clinic Data</h2>
            <p className="text-xs text-slate-500 mb-6">
              Download authorized clinic data sets in standard CSV format for medical auditing and reporting.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Patients Directory</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Export all registered clinic patient IDs, contact information, and demographic profiles.
                  </p>
                </div>
                <button
                  onClick={exportPatients}
                  className="mt-5 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Patients CSV</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Appointments Ledger</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Export all scheduled, completed, and cancelled consultation visits across clinic doctors.
                  </p>
                </div>
                <button
                  onClick={exportAppointments}
                  className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Appointments CSV</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Security Audit Trail</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Export administrative activity logs, credential changes, and policy modifications.
                  </p>
                </div>
                <button
                  onClick={exportAuditLogs}
                  className="mt-5 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Audit Trail CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 14: PLATFORM GOVERNANCE & SUPER-ADMIN PROTECTION */}
      {/* ========================================================= */}
      {activeTab === 'superadmin' && (
        <div className="space-y-6">
          {/* Tenant Isolation Boundary Alert */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex items-start gap-3.5 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-sm">Multi-Tenant Isolation Boundary Policy</strong>
              <p className="text-xs text-amber-800 leading-relaxed mt-1">
                The Admin role is an owner-level administrator for their authorized clinic. An Admin only receives access to their authorized clinic or clinics, and does not automatically receive platform-wide access to other clinics. Platform-level governance is treated as a separate protected capability.
              </p>
            </div>
          </div>

          {/* Authorized Clinics Access Switcher */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Your Authorized Clinics</h3>
            <p className="text-xs text-slate-500 mb-4">
              You are officially authorized to administer the following clinic entities:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user?.memberships.map((m) => {
                const isCurrent = m.clinicId === activeMembership?.clinicId;
                return (
                  <div
                    key={m.clinicId}
                    className={`p-4 rounded-xl border transition flex items-center justify-between ${
                      isCurrent ? 'bg-purple-50/70 border-purple-300 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <Building2 className={`w-4 h-4 ${isCurrent ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span className="font-bold text-slate-900 text-xs">{m.clinicName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Role: {m.role}</span>
                    </div>

                    {isCurrent ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-200 text-purple-900 rounded-full">
                        Active Scope
                      </span>
                    ) : (
                      <button
                        onClick={() => switchClinic(m.clinicId)}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800 underline"
                      >
                        Switch To Clinic
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Protected Platform Super-Admin Capability */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2 border border-purple-400/30">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Platform Super-Admin Guard</span>
                </div>
                <h3 className="text-xl font-black text-white">Platform-Level Multi-Hospital Provisioning</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Platform-wide hospital creation is a dedicated super-administrative capability distinct from ordinary hospital administrator permissions.
                </p>
              </div>

              <button
                onClick={() => {
                  setCreateClinicMsg('');
                  setShowCreateClinicModal(true);
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-2 whitespace-nowrap self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Provision New Hospital Tenant</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-white block mb-1">Strict Isolation Boundary</span>
                <span className="text-slate-400 text-[11px]">No automatic cross-clinic data leakage. Tenant boundaries enforced via PostgreSQL Row Filters.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-white block mb-1">Super-Admin Distinction</span>
                <span className="text-slate-400 text-[11px]">Platform operations require separate elevated permissions and do not pollute clinic roles.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-white block mb-1">Audited Operations</span>
                <span className="text-slate-400 text-[11px]">All tenant creations and elevated changes produce immutable database audit entries.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT SERVICE MODAL */}
      {/* ========================================================= */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex-shrink-0">Edit Clinical Service</h3>
            <form onSubmit={handleUpdateService} className="flex-1 overflow-y-auto min-h-0 py-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={editingService.durationMinutes}
                    onChange={(e) => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT HOSPITAL USER MODAL (FULL USER CRUD) */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex-shrink-0 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Edit Hospital User Profile</span>
            </h3>

            <form onSubmit={handleUpdateUserSubmit} className="flex-1 overflow-y-auto min-h-0 py-2 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name * <span className="text-slate-400 font-normal">(Letters only)</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: sanitizeNameInput(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Account ID)</label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full text-xs border border-slate-200 bg-slate-100 rounded-xl px-3 py-2 text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-slate-400 font-normal">(Ethiopian 09 / 07... numbers only)</span>
                </label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: sanitizePhoneInput(e.target.value) })}
                  placeholder="e.g. 0911223344"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-medium text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="Anesthesia">Anesthesia</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Diagnostics">Diagnostics</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="SUPER_ADMIN">👑 Super Admin</option>
                    <option value="ADMIN">🛡️ Admin</option>
                    <option value="DOCTOR">🩺 Doctor</option>
                    <option value="SPECIALIST">🔬 Specialist</option>
                    <option value="NURSING">🧑‍⚕️ Nursing</option>
                    <option value="PHARMACIST">💊 Pharmacist</option>
                    <option value="LABORATORY">🧪 Laboratory</option>
                    <option value="RECEPTIONIST">📋 Receptionist</option>
                    <option value="PATIENT">👤 Patient</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Critical Care, Pathology, General Surgery"
                  value={editingUser.specialty || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, specialty: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Membership Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-semibold text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="ACTIVE">ACTIVE (Authorized Access)</option>
                  <option value="SUSPENDED">SUSPENDED (Access Blocked)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {isUpdatingUser ? 'Saving...' : 'Save User Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT BRANCH MODAL */}
      {/* ========================================================= */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex-shrink-0">Edit Clinic Branch</h3>
            <form onSubmit={handleUpdateBranch} className="flex-1 overflow-y-auto min-h-0 py-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={editingBranch.address}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone <span className="text-slate-400 font-normal">(Ethiopian 09 / 07... numbers only)</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0911223344"
                  value={editingBranch.phone}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone: sanitizePhoneInput(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBranch.isMain}
                    onChange={(e) => setEditingBranch({ ...editingBranch, isMain: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Designate as Main Branch</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT HOSPITAL USER MODAL (FULL USER CRUD) */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex-shrink-0 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Edit Hospital User Profile</span>
            </h3>

            <form onSubmit={handleUpdateUserSubmit} className="flex-1 overflow-y-auto min-h-0 py-2 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name * <span className="text-slate-400 font-normal">(Letters only)</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: sanitizeNameInput(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Account ID)</label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full text-xs border border-slate-200 bg-slate-100 rounded-xl px-3 py-2 text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-slate-400 font-normal">(Ethiopian 09 / 07... numbers only)</span>
                </label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: sanitizePhoneInput(e.target.value) })}
                  placeholder="e.g. 0911223344"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-medium text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="Anesthesia">Anesthesia</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Diagnostics">Diagnostics</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="SUPER_ADMIN">👑 Super Admin</option>
                    <option value="ADMIN">🛡️ Admin</option>
                    <option value="DOCTOR">🩺 Doctor</option>
                    <option value="SPECIALIST">🔬 Specialist</option>
                    <option value="NURSING">🧑‍⚕️ Nursing</option>
                    <option value="PHARMACIST">💊 Pharmacist</option>
                    <option value="LABORATORY">🧪 Laboratory</option>
                    <option value="RECEPTIONIST">📋 Receptionist</option>
                    <option value="PATIENT">👤 Patient</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Critical Care, Pathology, General Surgery"
                  value={editingUser.specialty || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, specialty: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Membership Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-semibold text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="ACTIVE">ACTIVE (Authorized Access)</option>
                  <option value="SUSPENDED">SUSPENDED (Access Blocked)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {isUpdatingUser ? 'Saving...' : 'Save User Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PROTECTED SUPER-ADMIN PROVISION NEW CLINIC MODAL */}
      {/* ========================================================= */}
      {showCreateClinicModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600 border border-purple-200">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Provision New Hospital Tenant</h3>
                  <p className="text-xs text-slate-500">Platform Super-Admin Capability • Multi-Tenant Partition</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateClinicModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createClinicMsg && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{createClinicMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateClinicSubmit} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide block">
                  1. Hospital Tenant Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. St. Jude General Hospital"
                      value={newClinicName}
                      onChange={(e) => handleClinicNameChange(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">URL Identifier Slug *</label>
                    <input
                      type="text"
                      required
                      placeholder="city-hospital"
                      value={newClinicSlug}
                      onChange={(e) => setNewClinicSlug(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-mono outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="contact@cityhospital.com"
                      value={newClinicEmail}
                      onChange={(e) => setNewClinicEmail(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number * <span className="text-slate-400 font-normal">(Ethiopian 09 / 07...)</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0911223344"
                      value={newClinicPhone}
                      onChange={(e) => setNewClinicPhone(sanitizePhoneInput(e.target.value))}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Hospital Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="456 Healthcare Blvd, Chicago, IL"
                    value={newClinicAddress}
                    onChange={(e) => setNewClinicAddress(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide block">
                  2. Initial Hospital Administrator Account
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Admin Full Name * <span className="text-slate-400 font-normal">(Letters only)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Admin Name"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(sanitizeNameInput(e.target.value))}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@cityhealth.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Admin Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="At least 8 characters"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClinicModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClinic}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1.5"
                >
                  {isSubmittingClinic ? (
                    <span>Provisioning Tenant...</span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Provision Hospital & Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
