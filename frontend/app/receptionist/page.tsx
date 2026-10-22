'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DashboardLayout } from '../../components/DashboardLayout';
import { apiFetch } from '../../lib/api';
import {
  ClipboardList,
  Search,
  UserPlus,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Phone,
  Clock,
  Printer,
  Calendar,
  Layers,
  RefreshCw,
  Tv,
  Edit,
  Trash2,
  Plus,
  PhoneCall,
  Volume2,
  SkipForward,
  UserCheck,
  UserX,
  Check,
  X,
  Building2,
  Stethoscope,
  Users,
  CalendarDays,
  FileText,
  AlertTriangle,
  ChevronRight,
  Filter,
  Receipt,
  Copy,
  CreditCard,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { ClinicalJourneyTimeline } from '../../components/ClinicalJourneyTimeline';

export default function ReceptionistDashboardPage() {
  const { user, activeMembership, isLoading } = useAuth();
  const router = useRouter();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'approvals' | 'arrivals' | 'walkin' | 'queue' | 'patients' | 'doctors'>('approvals');

  // Core data states
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Filter & Search states for Appointments
  const [apptFilterDate, setApptFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [apptFilterStatus, setApptFilterStatus] = useState<string>('ALL');
  const [apptSearchQuery, setApptSearchQuery] = useState('');

  // Pending Approval Action State (Assign doctor/nurse, room number, notes)
  const [approvingAppt, setApprovingAppt] = useState<any>(null);
  const [assignedDoctorId, setAssignedDoctorId] = useState('');
  const [assignedPractitionerRole, setAssignedPractitionerRole] = useState<'Doctor' | 'Nurse'>('Doctor');
  const [assignedRoomNumber, setAssignedRoomNumber] = useState('Room 102 - Doctor Consultation Suite');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [selectedTimelineAppt, setSelectedTimelineAppt] = useState<any>(null);

  // Reject / Cancel Appointment State
  const [decliningAppt, setDecliningAppt] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState('Doctor unavailable at requested time');
  const [isDeclining, setIsDeclining] = useState(false);

  // Re-assign Doctor Modal
  const [reassignAppt, setReassignAppt] = useState<any>(null);
  const [newDoctorId, setNewDoctorId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Walk-in Registration & Ticket Generation State
  const [walkinSearch, setWalkinSearch] = useState('');
  const [walkinSearchResults, setWalkinSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isWalkinNewPatient, setIsWalkinNewPatient] = useState(false);

  // New Patient Form
  const [newPtName, setNewPtName] = useState('');
  const [newPtPhone, setNewPtPhone] = useState('');
  const [newPtEmail, setNewPtEmail] = useState('');
  const [newPtDob, setNewPtDob] = useState('');
  const [newPtGender, setNewPtGender] = useState('MALE');
  const [newPtAddress, setNewPtAddress] = useState('');
  const [newPtMsg, setNewPtMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Walk-in Ticket Options
  const [walkinServiceId, setWalkinServiceId] = useState('');
  const [walkinDoctorId, setWalkinDoctorId] = useState('');
  const [walkinPriority, setWalkinPriority] = useState('NORMAL');
  const [issuedTicket, setIssuedTicket] = useState<any>(null);
  const [isIssuingTicket, setIsIssuingTicket] = useState(false);

  // Patient Management State
  const [ptDirectoryQuery, setPtDirectoryQuery] = useState('');
  const [ptDirectoryList, setPtDirectoryList] = useState<any[]>([]);
  const [isSearchingPt, setIsSearchingPt] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  // Add Patient & Direct Card Booking State
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isSubmittingNewPatient, setIsSubmittingNewPatient] = useState(false);
  const [addPtFullName, setAddPtFullName] = useState('');
  const [addPtPhone, setAddPtPhone] = useState('');
  const [addPtEmail, setAddPtEmail] = useState('');
  const [addPtGender, setAddPtGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [addPtDateOfBirth, setAddPtDateOfBirth] = useState('');
  const [addPtAddress, setAddPtAddress] = useState('');
  const [addPtBloodGroup, setAddPtBloodGroup] = useState('');
  const [addPtEmergencyContact, setAddPtEmergencyContact] = useState('');
  const [addPtReason, setAddPtReason] = useState('General Consultation & Clinical Checkup');

  // Assignment & Card Payment State
  const [addPtPractitionerRole, setAddPtPractitionerRole] = useState<'Doctor' | 'Nurse'>('Doctor');
  const [addPtDoctorId, setAddPtDoctorId] = useState('');
  const [addPtRoomNumber, setAddPtRoomNumber] = useState('Room 102 - Doctor Consultation Suite');
  const [addPtServiceId, setAddPtServiceId] = useState('');
  const [addPtCardSlipRef, setAddPtCardSlipRef] = useState('');
  const [addPtCardAmount, setAddPtCardAmount] = useState<number>(200);
  const [addPtCardNotes, setAddPtCardNotes] = useState('Hospital Front-Desk Card Counter Payment');

  // Action status indicators
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoading && (!user || (activeMembership?.role !== 'RECEPTIONIST' && activeMembership?.role !== 'ADMIN' && activeMembership?.role !== 'MANAGER'))) {
      router.push('/login');
    }
  }, [user, activeMembership, isLoading, router]);

  // Load All Front-Desk Data from DB
  const loadReceptionData = async () => {
    if (!activeMembership?.clinicId) return;
    setIsDataLoading(true);

    try {
      const [apptRes, docRes, srvRes, brRes, sessRes, ptRes] = await Promise.all([
        apiFetch('/appointments'),
        apiFetch('/doctors'),
        apiFetch('/services'),
        apiFetch('/clinics/current/branches'),
        apiFetch('/queue/sessions'),
        apiFetch('/patients'),
      ]);

      if (apptRes.success) {
        setAllAppointments(apptRes.data.items || []);
      }

      if (docRes.success) {
        const activeDocs = (docRes.data || []).filter((d: any) => d.isActive);
        setDoctors(activeDocs);
        if (activeDocs.length > 0 && !assignedDoctorId) {
          setAssignedDoctorId(activeDocs[0].id);
        }
      }

      if (srvRes.success) {
        const activeSrvs = (srvRes.data || []).filter((s: any) => s.isActive);
        setServices(activeSrvs);
        if (activeSrvs.length > 0 && !walkinServiceId) {
          setWalkinServiceId(activeSrvs[0].id);
        }
      }

      if (brRes.success) {
        setBranches(brRes.data || []);
      }

      if (sessRes.success) {
        setActiveSessions(sessRes.data || []);
        if (sessRes.data.length > 0 && !selectedSessionId) {
          setSelectedSessionId(sessRes.data[0].id);
        }
      }

      if (ptRes && ptRes.success) {
        setPtDirectoryList(ptRes.data.items || ptRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load reception console data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (activeMembership?.clinicId) {
      loadReceptionData();
    }
  }, [activeMembership]);

  // Derived counts
  const pendingApprovals = allAppointments.filter((a) => a.status === 'REQUESTED');
  const todayAppointments = allAppointments.filter((a) => {
    if (!a.scheduledStartAt) return false;
    const apptDate = new Date(a.scheduledStartAt).toISOString().split('T')[0];
    return apptDate === apptFilterDate;
  });

  const activeSession = activeSessions.find((s) => s.id === selectedSessionId) || activeSessions[0] || null;

  // -------------------------------------------------------------
  // APPROVAL ACTIONS
  // -------------------------------------------------------------
  const handleOpenApproveModal = (appt: any) => {
    setApprovingAppt(appt);
    setAssignedDoctorId(appt.doctorId || (doctors[0]?.id || ''));
    setAssignedPractitionerRole('Doctor');
    setAssignedRoomNumber(appt.roomNumber || 'Room 102 - Doctor Consultation Suite');
    setApprovalNotes(appt.internalNotes || '');
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingAppt) return;

    setIsApproving(true);
    setActionFeedback(null);

    try {
      const res = await apiFetch(`/appointments/${approvingAppt.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          doctorId: assignedDoctorId || approvingAppt.doctorId,
          roomNumber: assignedRoomNumber,
          assignedRole: assignedPractitionerRole,
          notes: approvalNotes || 'Approved by reception with room allocation',
          verifyPayment: true,
        }),
      });

      if (res.success) {
        setActionFeedback({
          type: 'success',
          text: `Appointment ${approvingAppt.appointmentNumber} approved! Initial payment verified & assigned to ${assignedPractitionerRole} in ${assignedRoomNumber}.`,
        });
        setApprovingAppt(null);
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(`Approval error: ${res.error?.message || 'Failed to approve appointment.'}`);
      }
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decliningAppt) return;

    setIsDeclining(true);
    try {
      const res = await apiFetch(`/appointments/${decliningAppt.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancellationReason: declineReason || 'Declined by reception' }),
      });

      if (res.success) {
        setActionFeedback({ type: 'success', text: `Booking request ${decliningAppt.appointmentNumber} was declined.` });
        setDecliningAppt(null);
        setDeclineReason('Doctor unavailable at requested time');
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(`Error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Decline failed: ${err.message}`);
    } finally {
      setIsDeclining(false);
    }
  };

  // Re-assign Doctor
  const handleConfirmReassignDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignAppt || !newDoctorId) return;

    setIsReassigning(true);
    try {
      const res = await apiFetch(`/appointments/${reassignAppt.id}/assign-doctor`, {
        method: 'PATCH',
        body: JSON.stringify({ doctorId: newDoctorId }),
      });

      if (res.success) {
        setActionFeedback({ type: 'success', text: `Assigned new doctor to ${reassignAppt.appointmentNumber}.` });
        setReassignAppt(null);
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(`Reassignment error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Reassign failed: ${err.message}`);
    } finally {
      setIsReassigning(false);
    }
  };

  // -------------------------------------------------------------
  // ARRIVAL & CHECK-IN ACTIONS
  // -------------------------------------------------------------
  const handleCheckInPatient = async (appointmentId: string) => {
    setCheckingInId(appointmentId);
    try {
      const res = await apiFetch(`/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({ priority: 'NORMAL' }),
      });

      if (res.success) {
        setActionFeedback({
          type: 'success',
          text: `Patient checked in successfully! Live token: ${res.data?.queueTicket?.displayToken || 'T-XXX'} issued.`,
        });
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(`Check-in error: ${res.error?.message || 'Failed to check in patient.'}`);
      }
    } catch (err: any) {
      alert(`Check-in failed: ${err.message}`);
    } finally {
      setCheckingInId(null);
    }
  };

  const handleMarkNoShow = async (appointmentId: string) => {
    if (!confirm('Mark patient as NO-SHOW in hospital database?')) return;
    try {
      const res = await apiFetch(`/appointments/${appointmentId}/no-show`, { method: 'POST' });
      if (res.success) {
        setActionFeedback({ type: 'success', text: 'Appointment marked as NO-SHOW.' });
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(`Error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // WALK-IN & PATIENT REGISTRATION
  // -------------------------------------------------------------
  const handleSearchWalkinPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinSearch.trim()) return;

    try {
      const res = await apiFetch(`/patients/search?query=${encodeURIComponent(walkinSearch)}`);
      if (res.success) {
        setWalkinSearchResults(res.data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPtMsg(null);

    try {
      const res = await apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newPtName,
          phone: newPtPhone,
          email: newPtEmail || null,
          dateOfBirth: newPtDob || null,
          gender: newPtGender,
          address: newPtAddress || null,
        }),
      });

      if (res.success) {
        setSelectedPatient(res.data);
        setIsWalkinNewPatient(false);
        setNewPtMsg({ type: 'success', text: `Patient registered with ID ${res.data.patientNumber}!` });
        setNewPtName('');
        setNewPtPhone('');
        setNewPtEmail('');
        setNewPtDob('');
        setNewPtAddress('');
        await loadReceptionData();
      } else {
        setNewPtMsg({ type: 'error', text: res.error?.message || 'Failed to register patient.' });
      }
    } catch (err: any) {
      setNewPtMsg({ type: 'error', text: err.message });
    }
  };

  const handleIssueWalkinToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) {
      alert('Please select or create an active queue session for today.');
      return;
    }

    setIsIssuingTicket(true);
    try {
      const res = await apiFetch(`/queue/sessions/${activeSession.id}/tickets`, {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient?.id || undefined,
          priority: walkinPriority,
        }),
      });

      if (res.success) {
        setIssuedTicket(res.data);
        setActionFeedback({
          type: 'success',
          text: `Queue token ${res.data.displayToken} generated and saved to DB!`,
        });
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(`Error issuing token: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsIssuingTicket(false);
    }
  };

  // -------------------------------------------------------------
  // QUEUE CALLING ACTIONS
  // -------------------------------------------------------------
  const handleCallTicket = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/queue/tickets/${ticketId}/call`, { method: 'POST' });
      if (res.success) {
        setActionFeedback({ type: 'success', text: `Called token ${res.data.displayToken} to counter!` });
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert(`Error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRecallTicket = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/queue/tickets/${ticketId}/recall`, { method: 'POST' });
      if (res.success) {
        setActionFeedback({ type: 'success', text: `Recalled token ${res.data.displayToken}!` });
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert(`Error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleStartService = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/queue/tickets/${ticketId}/start`, { method: 'POST' });
      if (res.success) {
        setActionFeedback({ type: 'success', text: `Consultation started for ${res.data.displayToken}.` });
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert(`Error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCompleteService = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/queue/tickets/${ticketId}/complete`, { method: 'POST' });
      if (res.success) {
        setActionFeedback({ type: 'success', text: `Token ${res.data.displayToken} completed.` });
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert(`Error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSkipTicket = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/queue/tickets/${ticketId}/skip`, { method: 'POST' });
      if (res.success) {
        setActionFeedback({ type: 'success', text: `Ticket ${res.data.displayToken} skipped.` });
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert(`Error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRequeueTicket = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/queue/tickets/${ticketId}/requeue`, { method: 'POST' });
      if (res.success) {
        setActionFeedback({ type: 'success', text: `Ticket returned to waiting queue.` });
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert(`Error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancelTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to cancel this queue ticket?')) return;
    try {
      const res = await apiFetch(`/queue/tickets/${ticketId}/cancel`, { method: 'POST' });
      if (res.success) {
        setActionFeedback({ type: 'success', text: 'Queue ticket cancelled.' });
        await loadReceptionData();
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert(`Error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // PATIENT DIRECTORY
  // -------------------------------------------------------------
  const handleSearchPatientDirectory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ptDirectoryQuery.trim()) return;

    setIsSearchingPt(true);
    try {
      const res = await apiFetch(`/patients/search?query=${encodeURIComponent(ptDirectoryQuery)}`);
      if (res.success) {
        setPtDirectoryList(res.data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingPt(false);
    }
  };

  const handleSaveEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    setIsSavingPatient(true);
    try {
      const res = await apiFetch(`/patients/${editingPatient.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editingPatient.fullName,
          phone: editingPatient.phone,
          email: editingPatient.email || null,
          address: editingPatient.address || null,
          gender: editingPatient.gender || null,
          dateOfBirth: editingPatient.dateOfBirth || null,
        }),
      });

      if (res.success) {
        alert('Patient record updated in database successfully!');
        setEditingPatient(null);
        await loadReceptionData();
      } else {
        alert(`Save error: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSavingPatient(false);
    }
  };

  // -------------------------------------------------------------
  // ADD PATIENT WITH DOCTOR/NURSE ROOM ASSIGNMENT & CARD PAYMENT
  // -------------------------------------------------------------
  const handleOpenAddPatient = () => {
    setAddPtFullName('');
    setAddPtPhone('');
    setAddPtEmail('');
    setAddPtGender('MALE');
    setAddPtDateOfBirth('');
    setAddPtAddress('');
    setAddPtBloodGroup('');
    setAddPtEmergencyContact('');
    setAddPtReason('General Consultation & Clinical Checkup');
    setAddPtPractitionerRole('Doctor');
    setAddPtDoctorId(doctors[0]?.id || '');
    setAddPtRoomNumber('Room 102 - Doctor Consultation Suite');
    setAddPtServiceId(services[0]?.id || '');
    const defaultPrice = Number(services[0]?.price || 200);
    setAddPtCardAmount(defaultPrice > 0 ? defaultPrice : 200);
    setAddPtCardSlipRef(`CARD-REC-${Date.now().toString().slice(-6)}`);
    setAddPtCardNotes('Hospital Front-Desk Card Counter Payment');
    setIsAddingPatient(true);
  };

  const handleCreatePatientAndBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPtFullName.trim() || !addPtPhone.trim()) {
      setActionFeedback({ type: 'error', text: 'Patient Full Name and Phone Number are required.' });
      return;
    }

    setIsSubmittingNewPatient(true);
    setActionFeedback(null);

    try {
      // 1. Create Patient Record in Hospital DB
      const ptPayload: any = {
        fullName: addPtFullName.trim(),
        phone: addPtPhone.trim(),
        gender: addPtGender,
      };
      if (addPtEmail.trim()) ptPayload.email = addPtEmail.trim();
      if (addPtDateOfBirth) ptPayload.dateOfBirth = addPtDateOfBirth;
      if (addPtAddress.trim()) ptPayload.address = addPtAddress.trim();
      if (addPtBloodGroup.trim()) ptPayload.bloodGroup = addPtBloodGroup.trim();
      if (addPtEmergencyContact.trim()) ptPayload.emergencyContact = addPtEmergencyContact.trim();

      const ptRes = await apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify(ptPayload),
      });

      if (!ptRes.success || !ptRes.data?.id) {
        throw new Error(ptRes.error?.message || 'Failed to register patient in database.');
      }

      const createdPatient = ptRes.data;

      // 2. Select assigned doctor & branch
      const targetDoctorId = addPtDoctorId || doctors[0]?.id;
      const targetBranchId = branches[0]?.id || doctors.find((d) => d.id === targetDoctorId)?.branchId;
      const targetServiceId = addPtServiceId || services[0]?.id;

      // 3. Create Appointment with Card Payment & Room Allocation
      const apptRes = await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: createdPatient.id,
          doctorId: targetDoctorId,
          serviceId: targetServiceId,
          branchId: targetBranchId,
          scheduledStartAt: new Date().toISOString(),
          roomNumber: addPtRoomNumber,
          assignedRole: addPtPractitionerRole,
          reasonForVisit: addPtReason || 'Direct Front-Desk Walk-In Registration',
          status: 'CONFIRMED',
          payment: {
            method: 'CARD',
            transactionRef: addPtCardSlipRef || `CARD-REC-${Date.now().toString().slice(-6)}`,
            amount: Number(addPtCardAmount) || 200,
            payerName: addPtFullName.trim(),
            payerPhone: addPtPhone.trim(),
            notes: addPtCardNotes || 'Hospital Front-Desk Card Counter Verification',
          },
        }),
      });

      if (!apptRes.success) {
        throw new Error(apptRes.error?.message || 'Patient registered, but failed to allocate room & booking.');
      }

      setActionFeedback({
        type: 'success',
        text: `Patient ${createdPatient.fullName} (${createdPatient.patientNumber}) registered! Card Payment verified (${Number(addPtCardAmount).toFixed(2)} ETB) & assigned to ${addPtPractitionerRole} in ${addPtRoomNumber}.`,
      });

      setIsAddingPatient(false);
      // Reload reception data to show new patient and appointment
      await loadReceptionData();
    } catch (err: any) {
      console.error('Add patient & booking error:', err);
      setActionFeedback({
        type: 'error',
        text: err?.message || 'Failed to complete patient registration & card booking.',
      });
    } finally {
      setIsSubmittingNewPatient(false);
    }
  };

  // Filtered Appointments for the Arrivals Tab
  const filteredArrivals = todayAppointments.filter((a) => {
    const matchesStatus = apptFilterStatus === 'ALL' ? true : a.status === apptFilterStatus;
    const matchesSearch =
      apptSearchQuery.trim() === '' ||
      a.appointmentNumber?.toLowerCase().includes(apptSearchQuery.toLowerCase()) ||
      a.patient?.fullName?.toLowerCase().includes(apptSearchQuery.toLowerCase()) ||
      a.doctor?.fullName?.toLowerCase().includes(apptSearchQuery.toLowerCase()) ||
      a.patient?.phone?.includes(apptSearchQuery);
    return matchesStatus && matchesSearch;
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-medium">Connecting to Front-Desk Operations...</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      roleTitle="Reception Console"
      roleBadge="📋 Front-Desk Operations"
      roleColor="amber"
      activeItemId={activeTab}
      onSelectNav={(id) => setActiveTab(id as any)}
      headerTitle={
        activeTab === 'approvals'
          ? 'Online Booking Requests & Approvals'
          : activeTab === 'arrivals'
          ? "Today's Patient Schedule & Check-Ins"
          : activeTab === 'walkin'
          ? 'Walk-In Registration & Token Issuance'
          : activeTab === 'queue'
          ? 'Live Counter Calling & Queue Service'
          : activeTab === 'patients'
          ? 'Patient Management & Clinical Intake'
          : 'Physicians On Duty & Availability'
      }
      headerSubtitle={`Hospital: ${activeMembership?.clinicName || 'Hospital'} • Welcome back, ${user.fullName}`}
      headerActions={
        <div className="flex items-center space-x-2">
          {activeTab === 'patients' && (
            <button
              onClick={handleOpenAddPatient}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Patient</span>
            </button>
          )}

          {activeMembership?.clinicSlug && (
            <Link
              href={`/display/${activeMembership.clinicSlug}`}
              target="_blank"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 rounded-xl text-xs font-semibold hover:scale-105 transition"
            >
              <Tv className="w-3.5 h-3.5 text-amber-700" />
              <span>Launch Waiting TV</span>
            </Link>
          )}

          <button
            onClick={loadReceptionData}
            disabled={isDataLoading}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-semibold shadow-sm hover:scale-105 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin text-amber-600' : ''}`} />
            <span>{isDataLoading ? 'Syncing...' : 'Sync DB'}</span>
          </button>
        </div>
      }
      navGroups={[
        {
          groupLabel: 'Front-Desk Operations',
          items: [
            {
              id: 'approvals',
              label: 'Pending Approvals',
              icon: AlertCircle,
              badge: pendingApprovals.length > 0 ? pendingApprovals.length : undefined,
              badgeColor: 'bg-amber-500 text-white font-bold',
            },
            {
              id: 'arrivals',
              label: 'Arrivals & Check-In',
              icon: Calendar,
              badge: todayAppointments.filter((a) => a.status === 'CONFIRMED').length || undefined,
              badgeColor: 'bg-emerald-100 text-emerald-800',
            },
            {
              id: 'walkin',
              label: 'Issue Walk-In Token',
              icon: Ticket,
            },
            {
              id: 'queue',
              label: 'Counter Calling',
              icon: Volume2,
              badge: activeSession?.queueTickets?.filter((t: any) => t.status === 'WAITING').length || undefined,
              badgeColor: 'bg-blue-600 text-white',
            },
            {
              id: 'patients',
              label: 'Patient Management',
              icon: Users,
              badge: ptDirectoryList.length > 0 ? ptDirectoryList.length : undefined,
              badgeColor: 'bg-amber-100 text-amber-800 font-bold',
            },
            {
              id: 'doctors',
              label: 'Doctors On Duty',
              icon: Stethoscope,
              badge: doctors.length,
            },
          ],
        },
      ]}
    >
      {/* Global Toast Notification */}
      {actionFeedback && (
        <div
          className={`mb-6 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
            actionFeedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionFeedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PENDING ONLINE BOOKING APPROVALS                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-amber-100 text-xs font-bold uppercase tracking-wider mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>Online Booking Queue</span>
              </div>
              <h2 className="text-2xl font-black text-white">
                Pending Patient Registrations & Bookings ({pendingApprovals.length})
              </h2>
              <p className="text-xs text-amber-100 mt-1 max-w-xl">
                When patients register online and schedule an appointment, it enters here as Pending. Review patient details, assign/confirm the doctor, and approve the visit into the hospital schedule.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center min-w-[140px]">
              <span className="text-[11px] text-amber-100 uppercase font-semibold block">Awaiting Action</span>
              <span className="text-4xl font-black text-white">{pendingApprovals.length}</span>
            </div>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">All Patient Bookings Approved</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no pending online appointment requests waiting for review. New patient bookings submitted remotely will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-3xl border border-amber-200 shadow-sm p-6 hover:shadow-md transition space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                          {appt.appointmentNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 animate-pulse">
                          ⏳ Pending Approval
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Requested: {new Date(appt.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <h3 className="text-base font-bold text-slate-900">
                          {appt.patient?.fullName || 'Online Patient'}
                        </h3>
                        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-semibold">
                          ID: {appt.patient?.patientNumber}
                        </span>
                        {appt.patient?.phone && (
                          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" /> {appt.patient.phone}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-4 pt-1">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                          Requested Service: {appt.service?.name} (${Number(appt.service?.price || 0).toFixed(2)})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                          Requested Date: {new Date(appt.scheduledStartAt).toLocaleString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          Requested Doctor: <strong className="text-slate-900">Dr. {appt.doctor?.fullName}</strong> ({appt.doctor?.specialty})
                        </span>
                      </div>

                      {appt.reasonForVisit && (
                        <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 max-w-2xl">
                          <strong className="text-slate-700">Patient Note / Reason:</strong> {appt.reasonForVisit}
                        </p>
                      )}

                      {/* Payment Verification Info */}
                      {appt.payment ? (
                        <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-wrap items-center justify-between gap-3 text-xs max-w-2xl">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-sm ${
                                appt.payment.method === 'TELEBIRR'
                                  ? 'bg-amber-400 text-blue-950 font-bold'
                                  : 'bg-purple-700 text-white font-bold'
                              }`}
                            >
                              {appt.payment.method === 'TELEBIRR' ? 'TELEBIRR' : 'CBE'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900">
                                  {Number(appt.payment.amount).toFixed(2)} ETB
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    appt.payment.status === 'VERIFIED'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-200 text-amber-900 border border-amber-300'
                                  }`}
                                >
                                  {appt.payment.status === 'VERIFIED' ? '✓ Verified' : '⏳ Pending Payment Verification'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 mt-0.5">
                                <span>
                                  TXN Ref: <strong className="font-mono text-slate-900">{appt.payment.transactionRef}</strong>
                                </span>
                                {appt.payment.payerPhone && (
                                  <span className="ml-2">• Phone: <strong>{appt.payment.payerPhone}</strong></span>
                                )}
                                {appt.payment.payerAccount && (
                                  <span className="ml-2">• Acc: <strong>{appt.payment.payerAccount}</strong></span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 text-right">
                            <span className="block text-[10px] uppercase font-semibold text-slate-400">Hospital Account Receiver</span>
                            <span className="font-bold text-slate-800">
                              {appt.payment.method === 'TELEBIRR' ? 'Telebirr 0995774866' : 'CBE 1000305532472'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic mt-1">
                          Payment: Cash on arrival at reception
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap lg:flex-col items-end gap-2.5 shrink-0">
                      <button
                        onClick={() => handleOpenApproveModal(appt)}
                        className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Review & Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          setReassignAppt(appt);
                          setNewDoctorId(appt.doctorId || '');
                        }}
                        className="py-2 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Re-assign Doctor</span>
                      </button>

                      <button
                        onClick={() => setDecliningAppt(appt)}
                        className="py-2 px-4 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline Booking</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ARRIVALS & DAILY APPOINTMENTS                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'arrivals' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Select Schedule Date</label>
                  <input
                    type="date"
                    value={apptFilterDate}
                    onChange={(e) => setApptFilterDate(e.target.value)}
                    className="text-xs border border-slate-200 rounded-xl p-2 outline-none focus:border-amber-500 font-bold text-slate-800 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Status</label>
                  <select
                    value={apptFilterStatus}
                    onChange={(e) => setApptFilterStatus(e.target.value)}
                    className="text-xs border border-slate-200 rounded-xl p-2 outline-none focus:border-amber-500 font-semibold bg-white"
                  >
                    <option value="ALL">All Statuses ({todayAppointments.length})</option>
                    <option value="REQUESTED">Pending Approvals</option>
                    <option value="CONFIRMED">Confirmed / Expected Arrivals</option>
                    <option value="IN_QUEUE">Checked In / In Queue</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="NO_SHOW">No-Show</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="relative min-w-[220px]">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Search Patient / Doctor</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Name, phone, token..."
                    value={apptSearchQuery}
                    onChange={(e) => setApptSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="space-y-3">
            {filteredArrivals.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No appointments scheduled for this date</h4>
                <p className="text-xs text-slate-400">
                  {apptSearchQuery
                    ? 'No appointments matched your search filter.'
                    : `No bookings found for ${apptFilterDate}. You can change the date above.`}
                </p>
              </div>
            ) : (
              filteredArrivals.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-slate-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {appt.appointmentNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{appt.patient?.fullName}</h4>
                        <span className="text-xs font-mono text-slate-400">({appt.patient?.patientNumber})</span>
                        {appt.patient?.phone && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {appt.patient.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Doctor: <strong className="text-slate-800">Dr. {appt.doctor?.fullName}</strong> ({appt.doctor?.specialty}) • Service: <strong className="text-slate-800">{appt.service?.name}</strong> • Branch: {appt.branch?.name || 'Main Branch'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                          appt.status === 'REQUESTED'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : appt.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : appt.status === 'IN_QUEUE' || appt.status === 'CHECKED_IN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                            : appt.status === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {appt.status === 'REQUESTED' ? 'PENDING APPROVAL' : appt.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {new Date(appt.scheduledStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {appt.queueTicket && (
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          Live Token: {appt.queueTicket.displayToken} ({appt.queueTicket.status})
                        </span>
                      )}

                      {appt.reasonForVisit && (
                        <span className="text-slate-500 truncate max-w-xs">
                          Reason: {appt.reasonForVisit}
                        </span>
                      )}

                      {appt.payment && (
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 ${
                            appt.payment.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <Receipt className="w-3 h-3" />
                          <span>
                            {appt.payment.method === 'TELEBIRR' ? 'Telebirr' : 'CBE'}: {Number(appt.payment.amount).toFixed(0)} ETB ({appt.payment.status})
                          </span>
                        </span>
                      )}

                      {appt.diagnosticOrders && appt.diagnosticOrders.length > 0 && (
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 ${
                            appt.diagnosticOrders[0].status === 'REVIEWED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : appt.diagnosticOrders[0].status === 'COMPLETED'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}
                        >
                          <span>🩻</span>
                          <span>
                            {appt.diagnosticOrders[0].type}: {appt.diagnosticOrders[0].status === 'COMPLETED' ? 'RETURNED TO DR' : appt.diagnosticOrders[0].status}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {appt.status === 'REQUESTED' && (
                        <>
                          <button
                            onClick={() => handleOpenApproveModal(appt)}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setDecliningAppt(appt)}
                            className="py-1.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {appt.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => handleCheckInPatient(appt.id)}
                            disabled={checkingInId === appt.id}
                            className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{checkingInId === appt.id ? 'Issuing Token...' : 'Check In Patient'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setReassignAppt(appt);
                              setNewDoctorId(appt.doctorId || '');
                            }}
                            className="py-1.5 px-2.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold transition"
                          >
                            Change Doctor
                          </button>

                          <button
                            onClick={() => handleMarkNoShow(appt.id)}
                            className="py-1.5 px-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-semibold transition"
                          >
                            No-Show
                          </button>

                          <button
                            onClick={() => setDecliningAppt(appt)}
                            className="py-1.5 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {(appt.status === 'IN_QUEUE' || appt.status === 'CHECKED_IN') && (
                        <button
                          onClick={() => setActiveTab('queue')}
                          className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>View Live Queue</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: ISSUE WALK-IN QUEUE TOKEN                              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'walkin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Patient Search / Quick Registration */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-600" />
                  <span>Step 1: Patient Lookup</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsWalkinNewPatient(!isWalkinNewPatient)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-800 transition"
                >
                  {isWalkinNewPatient ? '← Search Existing' : '+ Register New'}
                </button>
              </div>

              {!isWalkinNewPatient ? (
                <>
                  <form onSubmit={handleSearchWalkinPatient} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Name, phone, or PT number..."
                      value={walkinSearch}
                      onChange={(e) => setWalkinSearch(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition shadow-sm"
                    >
                      Search
                    </button>
                  </form>

                  {selectedPatient && (
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                      <div>
                        <strong>Selected:</strong> {selectedPatient.fullName}
                        <div className="font-mono text-[11px] text-amber-700">
                          ID: {selectedPatient.patientNumber} • {selectedPatient.phone}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedPatient(null)}
                        className="text-amber-700 hover:text-amber-900 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {walkinSearchResults.length > 0 && !selectedPatient && (
                    <div className="space-y-2 max-h-56 overflow-y-auto border-t border-slate-100 pt-3">
                      {walkinSearchResults.map((pt) => (
                        <div
                          key={pt.id}
                          onClick={() => setSelectedPatient(pt)}
                          className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/40 cursor-pointer transition text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{pt.fullName}</div>
                            <div className="text-slate-500 text-[11px] font-mono">
                              {pt.patientNumber} • {pt.phone}
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-amber-600">Select →</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleRegisterNewPatient} className="space-y-3">
                  {newPtMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold ${
                        newPtMsg.type === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {newPtMsg.text}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Samuel Alemu"
                      value={newPtName}
                      onChange={(e) => setNewPtName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+251 911 000000"
                      value={newPtPhone}
                      onChange={(e) => setNewPtPhone(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Gender</label>
                      <select
                        value={newPtGender}
                        onChange={(e) => setNewPtGender(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500 bg-white"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={newPtDob}
                        onChange={(e) => setNewPtDob(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Address</label>
                    <input
                      type="text"
                      placeholder="City, sub-city, house no."
                      value={newPtAddress}
                      onChange={(e) => setNewPtAddress(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm"
                  >
                    Save & Select Patient
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column 2 & 3: Issue Token & Printable Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-600" />
                <span>Step 2: Issue Live Queue Token</span>
              </h3>

              <form onSubmit={handleIssueWalkinToken} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Queue Session</label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-amber-500 bg-white font-medium"
                    >
                      {activeSessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.branch?.name} — {s.doctor?.fullName ? `Dr. ${s.doctor.fullName}` : 'General Queue'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority Triage</label>
                    <select
                      value={walkinPriority}
                      onChange={(e) => setWalkinPriority(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-amber-500 bg-white font-medium"
                    >
                      <option value="NORMAL">Normal Priority</option>
                      <option value="URGENT">Urgent Care (Fast Track)</option>
                      <option value="VIP">VIP</option>
                      <option value="EMERGENCY">Emergency Critical</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
                  <span>Patient assigned to token: </span>
                  <strong className="text-slate-900">
                    {selectedPatient ? `${selectedPatient.fullName} (${selectedPatient.patientNumber})` : 'Walk-In Guest (Anonymous)'}
                  </strong>
                </div>

                <button
                  type="submit"
                  disabled={isIssuingTicket}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition shadow-md flex items-center justify-center space-x-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>{isIssuingTicket ? 'Generating Token in Database...' : 'Issue Live Queue Token'}</span>
                </button>
              </form>

              {/* Printable Token Slip Preview */}
              {issuedTicket && (
                <div className="mt-6 p-6 rounded-3xl bg-amber-50/70 border-2 border-dashed border-amber-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest block">
                        Hospital Queue Token
                      </span>
                      <h2 className="text-4xl font-black font-mono text-amber-900 mt-1">
                        {issuedTicket.displayToken}
                      </h2>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Slip</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-amber-900 pt-2 border-t border-amber-200/80">
                    <div>
                      <span className="text-amber-700 text-[11px] block">Patient</span>
                      <span className="font-bold">{selectedPatient?.fullName || 'Walk-In Guest'}</span>
                    </div>
                    <div>
                      <span className="text-amber-700 text-[11px] block">Priority</span>
                      <span className="font-bold uppercase">{issuedTicket.priority}</span>
                    </div>
                    <div>
                      <span className="text-amber-700 text-[11px] block">Time Issued</span>
                      <span className="font-bold">{new Date(issuedTicket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: LIVE COUNTER CALLING & QUEUE SERVICE                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Queue Calling Counter</h3>
              <p className="text-xs text-slate-500">
                Call, recall, skip, and manage patient tickets in real-time. Connected to Waiting Room TV display.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl p-2 outline-none focus:border-amber-500 bg-slate-50/50 font-bold"
              >
                {activeSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.branch?.name} — {s.doctor?.fullName ? `Dr. ${s.doctor.fullName}` : 'General Queue'}
                  </option>
                ))}
              </select>

              {activeMembership?.clinicSlug && (
                <Link
                  href={`/display/${activeMembership.clinicSlug}`}
                  target="_blank"
                  className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Waiting Room TV</span>
                </Link>
              )}
            </div>
          </div>

          {!activeSession ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center text-xs text-slate-400">
              No active queue session found for today.
            </div>
          ) : !activeSession.queueTickets || activeSession.queueTickets.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center text-xs text-slate-400">
              No tickets currently waiting or being served in this session. Check in patients from the Arrivals tab or issue a walk-in token.
            </div>
          ) : (
            <div className="space-y-3">
              {activeSession.queueTickets.map((t: any) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-black font-mono text-slate-900 bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-sm">
                      {t.displayToken}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            t.status === 'SERVING'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'CALLED'
                              ? 'bg-amber-100 text-amber-800 animate-pulse font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase">
                          Priority: {t.priority}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Patient: <strong>{t.patient?.fullName || 'Walk-In'}</strong> • Checked in at{' '}
                        {new Date(t.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {t.status === 'WAITING' && (
                      <button
                        onClick={() => handleCallTicket(t.id)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call to Counter</span>
                      </button>
                    )}

                    {t.status === 'CALLED' && (
                      <>
                        <button
                          onClick={() => handleStartService(t.id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Start Consultation</span>
                        </button>

                        <button
                          onClick={() => handleRecallTicket(t.id)}
                          className="px-3 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Recall</span>
                        </button>

                        <button
                          onClick={() => handleSkipTicket(t.id)}
                          className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
                        >
                          Skip
                        </button>
                      </>
                    )}

                    {t.status === 'SERVING' && (
                      <button
                        onClick={() => handleCompleteService(t.id)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Complete Service</span>
                      </button>
                    )}

                    {t.status === 'SKIPPED' && (
                      <button
                        onClick={() => handleRequeueTicket(t.id)}
                        className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold transition"
                      >
                        Requeue
                      </button>
                    )}

                    {t.status === 'WAITING' && (
                      <button
                        onClick={() => handleCancelTicket(t.id)}
                        className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: PATIENT MANAGEMENT & CLINICAL INTAKE                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          {/* Top Banner with Add Patient Action */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-zoom">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span>Patient Management Center</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Hospital Patient Directory & Intake</h2>
              <p className="text-xs text-slate-500 max-w-xl">
                Register new patients with card payment & consultation room assignment, edit medical records, and book clinical visits.
              </p>
            </div>

            <button
              onClick={handleOpenAddPatient}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all self-start sm:self-auto shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Patient & Assign Room</span>
            </button>
          </div>

          {/* Search & Quick Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form onSubmit={handleSearchPatientDirectory} className="flex gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient name, phone number, or ID (e.g. PT-00001)..."
                  value={ptDirectoryQuery}
                  onChange={(e) => setPtDirectoryQuery(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-amber-500 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingPt}
                className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-sm hover:scale-105 active:scale-95 shrink-0"
              >
                {isSearchingPt ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500">
                Total Patients: <strong className="text-slate-800 font-bold">{ptDirectoryList.length}</strong>
              </span>
              <button
                type="button"
                onClick={loadReceptionData}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Show All
              </button>
            </div>
          </div>

          {/* Patients Directory Cards List */}
          {ptDirectoryList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ptDirectoryList.map((pt) => (
                <div
                  key={pt.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3.5 hover-zoom hover:border-amber-200 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-900 text-sm">{pt.fullName}</h4>
                      <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block">
                        {pt.patientNumber}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {pt.gender || 'Patient'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <strong className="font-mono">{pt.phone}</strong>
                    </div>
                    {pt.email && (
                      <p className="truncate text-slate-500">Email: {pt.email}</p>
                    )}
                    {pt.address && (
                      <p className="truncate text-slate-500">Address: {pt.address}</p>
                    )}
                    {pt.emergencyContact && (
                      <p className="truncate text-slate-500">Emergency: {pt.emergencyContact}</p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Registered: {new Date(pt.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setEditingPatient(pt)}
                      className="px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1 hover:scale-105"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit Info</span>
                    </button>

                    <button
                      onClick={() => {
                        handleOpenAddPatient();
                        setAddPtFullName(pt.fullName);
                        setAddPtPhone(pt.phone);
                        if (pt.email) setAddPtEmail(pt.email);
                        if (pt.gender) setAddPtGender(pt.gender);
                        if (pt.address) setAddPtAddress(pt.address);
                      }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 hover:scale-105"
                    >
                      <CalendarDays className="w-3 h-3" />
                      <span>+ Book Visit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">No Patient Records Found</h4>
                <p className="text-xs text-slate-500">
                  {ptDirectoryQuery
                    ? `No patient records matching "${ptDirectoryQuery}". Try another keyword or register this patient.`
                    : 'The patient registry is currently empty. Click the button below to register a patient.'}
                </p>
              </div>
              <button
                onClick={handleOpenAddPatient}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:scale-105 active:scale-95 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Register New Patient & Card Booking</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: DOCTORS ON DUTY & SCHEDULES                           */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Dr. {doc.fullName}</h4>
                      <p className="text-xs text-blue-600 font-semibold">{doc.specialty}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <p>Branch: <strong className="text-slate-800">{doc.branch?.name || 'Main Branch'}</strong></p>
                  <p>Consultation Duration: <strong className="text-slate-800">{doc.appointmentDurationMinutes} mins</strong></p>
                  <p>Phone: {doc.phone || 'N/A'}</p>
                  <p>License: {doc.licenseNumber || 'Verified'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: APPROVE ONLINE BOOKING                              */}
      {/* ------------------------------------------------------------- */}
      {approvingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleConfirmApproval}
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Approve & Confirm Patient Booking</span>
              </h3>
              <button
                type="button"
                onClick={() => setApprovingAppt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Content (Scrolls smoothly up and down) */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 py-3 space-y-4 text-left">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div>
                  <strong>Appointment No:</strong> <span className="font-mono font-bold">{approvingAppt.appointmentNumber}</span>
                </div>
                <div>
                  <strong>Patient:</strong> {approvingAppt.patient?.fullName} ({approvingAppt.patient?.patientNumber})
                </div>
                <div>
                  <strong>Requested Service:</strong> {approvingAppt.service?.name} ({Number(approvingAppt.service?.price || 0).toFixed(2)} ETB)
                </div>
                <div>
                  <strong>Scheduled Date & Time:</strong> {new Date(approvingAppt.scheduledStartAt).toLocaleString()}
                </div>
                {approvingAppt.reasonForVisit && (
                  <div>
                    <strong>Reason:</strong> {approvingAppt.reasonForVisit}
                  </div>
                )}
              </div>

              {/* Payment Verification Card */}
              {approvingAppt.payment ? (
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <Receipt className="w-4 h-4 text-emerald-700" />
                      Telebirr / CBE / Card Payment Verification:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900">
                      {approvingAppt.payment.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Payment Method</span>
                      <strong className="font-bold text-slate-800">
                        {approvingAppt.payment.method === 'TELEBIRR'
                          ? 'Telebirr (0995774866)'
                          : approvingAppt.payment.method === 'CARD'
                          ? 'Hospital Card Counter'
                          : 'CBE (1000305532472)'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Consultation Fee</span>
                      <strong className="font-bold text-emerald-800">
                        {Number(approvingAppt.payment.amount).toFixed(2)} ETB
                      </strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[10px]">Transaction Reference / Code</span>
                      <strong className="font-mono text-sm bg-white px-2 py-0.5 rounded border border-emerald-200 text-slate-900 inline-block mt-0.5">
                        {approvingAppt.payment.transactionRef}
                      </strong>
                    </div>
                    {approvingAppt.payment.payerPhone && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Payer Mobile</span>
                        <strong>{approvingAppt.payment.payerPhone}</strong>
                      </div>
                    )}
                    {approvingAppt.payment.payerAccount && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Payer Account</span>
                        <strong>{approvingAppt.payment.payerAccount}</strong>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-800 bg-white/80 p-2 rounded-xl border border-emerald-200/80 mt-1">
                    ✓ Approving this appointment will automatically verify the payment in the hospital database.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 italic">
                  No online payment recorded. Patient will pay at front desk.
                </div>
              )}

              {/* Role Selection: Doctor or Nurse */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Practitioner Role
                  </label>
                  <select
                    value={assignedPractitionerRole}
                    onChange={(e) => setAssignedPractitionerRole(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-blue-500 font-semibold text-slate-800"
                  >
                    <option value="Doctor">🩺 Doctor (Physician)</option>
                    <option value="Nurse">🧑‍⚕️ Nurse (Triage & Clinical Care)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Practitioner
                  </label>
                  <select
                    required
                    value={assignedDoctorId}
                    onChange={(e) => setAssignedDoctorId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-blue-500 font-medium"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {assignedPractitionerRole === 'Nurse' ? 'Nurse' : 'Dr.'} {d.fullName} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consultation Room Assignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Consultation Room Number <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignedRoomNumber}
                  onChange={(e) => setAssignedRoomNumber(e.target.value)}
                  className="w-full text-xs border border-blue-300 rounded-xl p-3 bg-blue-50/50 outline-none focus:border-blue-600 font-bold text-blue-900"
                >
                  <option value="Room 102 - Doctor Consultation Suite">Room 102 - Doctor Consultation Suite</option>
                  <option value="Room 103 - Nurse Triage & Vitals">Room 103 - Nurse Triage & Vitals</option>
                  <option value="Room 104 - General Clinical Examination">Room 104 - General Clinical Examination</option>
                  <option value="Room 106 - Pediatric Consultation Room">Room 106 - Pediatric Consultation Room</option>
                  <option value="Room 107 - Obstetrics & Gynecology Room">Room 107 - Obstetrics & Gynecology Room</option>
                  <option value="Room 101 - Emergency & Urgent Triage">Room 101 - Emergency & Urgent Triage</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  This room number will immediately guide the patient and appear on live tracking screens.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reception Notes / Patient Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Card verified, patient directed to Room 102, fasting checked"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Sticky Footer (Always 100% visible, never cut off) */}
            <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 pt-3 border-t border-slate-100 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setSelectedTimelineAppt(approvingAppt)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>Preview Hospital Timeline Progress</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setApprovingAppt(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApproving}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition shadow-md hover:shadow-lg flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isApproving ? 'Approving & Allocating...' : 'Verify Payment & Assign Room'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: REASSIGN DOCTOR                                      */}
      {/* ------------------------------------------------------------- */}
      {reassignAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleConfirmReassignDoctor}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>Re-assign Doctor</span>
              </h3>
              <button
                type="button"
                onClick={() => setReassignAppt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-3 space-y-4">
              <p className="text-xs text-slate-600">
                Re-assign appointment <strong className="font-mono text-slate-900">{reassignAppt.appointmentNumber}</strong> for patient <strong>{reassignAppt.patient?.fullName}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Physician</label>
                <select
                  required
                  value={newDoctorId}
                  onChange={(e) => setNewDoctorId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-amber-500 font-medium"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.fullName} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setReassignAppt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReassigning}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-sm"
              >
                {isReassigning ? 'Reassigning in DB...' : 'Save Doctor Assignment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: DECLINE / CANCEL APPOINTMENT                         */}
      {/* ------------------------------------------------------------- */}
      {decliningAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleConfirmDecline}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Decline / Cancel Booking Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setDecliningAppt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-3 space-y-4">
              <p className="text-xs text-slate-600">
                Decline booking <strong className="font-mono text-slate-900">{decliningAppt.appointmentNumber}</strong> for patient <strong>{decliningAppt.patient?.fullName}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection / Cancellation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doctor unavailable, slot conflict"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setDecliningAppt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Keep Request
              </button>
              <button
                type="submit"
                disabled={isDeclining}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-sm"
              >
                {isDeclining ? 'Cancelling in DB...' : 'Confirm Decline'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: EDIT PATIENT RECORD                                  */}
      {/* ------------------------------------------------------------- */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEditPatient}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Edit Patient Record ({editingPatient.patientNumber})</h3>
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingPatient.fullName || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, fullName: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editingPatient.phone || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingPatient.email || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editingPatient.address || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPatient}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition shadow-sm"
              >
                {isSavingPatient ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* TIMELINE MODAL: CLINICAL JOURNEY & ROOM TRACKING              */}
      {/* ------------------------------------------------------------- */}
      {selectedTimelineAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Patient Hospital Timeline Progress: {selectedTimelineAppt.appointmentNumber}</span>
              </h3>
              <button
                onClick={() => setSelectedTimelineAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-3">
              <ClinicalJourneyTimeline
                appointment={selectedTimelineAppt}
                patientName={selectedTimelineAppt.patient?.fullName}
                showCardWrapper={false}
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setSelectedTimelineAppt(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close Hospital Timeline Progress
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* MODAL 6: ADD PATIENT, ASSIGN PRACTITIONER/ROOM & CARD PAYMENT */}
      {/* ------------------------------------------------------------- */}
      {isAddingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleCreatePatientAndBooking}
            className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Sticky Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Register Patient & Book Consultation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Patient full demographic intake, doctor/nurse room allocation, and counter Card payment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingPatient(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 py-3 space-y-5 text-left">
              {/* 1. Patient Full Demographic Information */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Patient Demographic Profile</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abebe Bekele"
                      value={addPtFullName}
                      onChange={(e) => setAddPtFullName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0911223344"
                      value={addPtPhone}
                      onChange={(e) => setAddPtPhone(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-mono font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="patient@gmail.com"
                      value={addPtEmail}
                      onChange={(e) => setAddPtEmail(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={addPtGender}
                      onChange={(e) => setAddPtGender(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 bg-white font-medium"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={addPtDateOfBirth}
                      onChange={(e) => setAddPtDateOfBirth(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group (Optional)</label>
                    <select
                      value={addPtBloodGroup}
                      onChange={(e) => setAddPtBloodGroup(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 bg-white"
                    >
                      <option value="">Unknown / Not Tested</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Addis Ababa, Bole Sub-city, Woreda 03"
                      value={addPtAddress}
                      onChange={(e) => setAddPtAddress(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Sister / Parent (0922334455)"
                      value={addPtEmergencyContact}
                      onChange={(e) => setAddPtEmergencyContact(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Visit / Symptoms</label>
                    <input
                      type="text"
                      placeholder="e.g. Fever, persistent cough, routine physical consultation"
                      value={addPtReason}
                      onChange={(e) => setAddPtReason(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Practitioner & Consultation Room Allocation */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Assign Doctor / Nursing & Consultation Room</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Practitioner Role</label>
                    <select
                      value={addPtPractitionerRole}
                      onChange={(e) => setAddPtPractitionerRole(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 bg-white font-semibold text-slate-800"
                    >
                      <option value="Doctor">🩺 Doctor (Physician)</option>
                      <option value="Nurse">🧑‍⚕️ Nurse (Triage & Clinical Care)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Practitioner <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={addPtDoctorId}
                      onChange={(e) => setAddPtDoctorId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 bg-white font-medium"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {addPtPractitionerRole === 'Nurse' ? 'Nurse' : 'Dr.'} {d.fullName} ({d.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-blue-900 mb-1">
                      Assign Consultation Room Number <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={addPtRoomNumber}
                      onChange={(e) => setAddPtRoomNumber(e.target.value)}
                      className="w-full text-xs border border-blue-300 rounded-xl p-2.5 outline-none focus:border-blue-600 bg-white font-bold text-blue-900"
                    >
                      <option value="Room 102 - Doctor Consultation Suite">Room 102 - Doctor Consultation Suite</option>
                      <option value="Room 103 - Nurse Triage & Vitals">Room 103 - Nurse Triage & Vitals</option>
                      <option value="Room 104 - General Clinical Examination">Room 104 - General Clinical Examination</option>
                      <option value="Room 106 - Pediatric Consultation Room">Room 106 - Pediatric Consultation Room</option>
                      <option value="Room 107 - Obstetrics & Gynecology Room">Room 107 - Obstetrics & Gynecology Room</option>
                      <option value="Room 101 - Emergency & Urgent Triage">Room 101 - Emergency & Urgent Triage</option>
                    </select>
                    <p className="text-[11px] text-blue-700/80 mt-1">
                      Patient will be directed to this room immediately upon front-desk confirmation.
                    </p>
                  </div>

                  {services.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Service</label>
                      <select
                        value={addPtServiceId}
                        onChange={(e) => {
                          setAddPtServiceId(e.target.value);
                          const s = services.find((srv) => srv.id === e.target.value);
                          if (s?.price) setAddPtCardAmount(Number(s.price));
                        }}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 bg-white"
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({Number(s.price || 0).toFixed(2)} ETB)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Card Payment Form */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                    <span>3. Front-Desk Card Payment Verification</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900 font-mono">
                    CARD PAYMENT
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Card Slip / POS Reference Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CARD-REC-10827"
                      value={addPtCardSlipRef}
                      onChange={(e) => setAddPtCardSlipRef(e.target.value)}
                      className="w-full text-xs border border-emerald-300 rounded-xl p-2.5 outline-none focus:border-emerald-600 font-mono font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Consultation Card Fee (ETB) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.01}
                      value={addPtCardAmount}
                      onChange={(e) => setAddPtCardAmount(Number(e.target.value))}
                      className="w-full text-xs border border-emerald-300 rounded-xl p-2.5 outline-none focus:border-emerald-600 font-bold text-emerald-900 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Slip Notes</label>
                    <input
                      type="text"
                      value={addPtCardNotes}
                      onChange={(e) => setAddPtCardNotes(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 bg-white"
                      placeholder="e.g. Front-desk card terminal transaction approved"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200/90 text-[11px] text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Submitting this form immediately marks the initial consultation fee as <strong>VERIFIED</strong> via Card, generates the patient ID, and queues the appointment in the assigned practitioner&apos;s room.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="flex justify-end items-center space-x-2 pt-3 border-t border-slate-100 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setIsAddingPatient(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingNewPatient}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition shadow-md hover:scale-105 active:scale-95 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSubmittingNewPatient
                    ? 'Registering & Allocating Room...'
                    : 'Register Patient & Confirm Card Booking'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
