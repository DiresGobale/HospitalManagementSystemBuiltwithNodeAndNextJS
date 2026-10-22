'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DashboardLayout } from '../../components/DashboardLayout';
import { apiFetch } from '../../lib/api';
import {
  Calendar,
  Clock,
  Ticket,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  User,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  CalendarDays,
  FileText,
  Stethoscope,
  Building2,
  ChevronRight,
  Search,
  HeartPulse,
  AlertTriangle,
  Check,
  X,
  ShieldCheck,
  Droplet,
  Bell,
  ArrowUpRight,
  Users,
  CreditCard,
  Copy,
  Receipt,
  Wallet,
  CheckCheck,
  Landmark,
  Scan,
  Eye,
  Pill,
} from 'lucide-react';
import { ClinicalJourneyTimeline } from '../../components/ClinicalJourneyTimeline';

export default function PatientPortalPage() {
  const { user, activeMembership, isLoading } = useAuth();
  const router = useRouter();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'portal' | 'book' | 'tracker' | 'diagnostics' | 'pharmacy' | 'history' | 'profile'>('portal');
  const [selectedDiagnosticReport, setSelectedDiagnosticReport] = useState<any>(null);
  const [selectedPrescriptionReceipt, setSelectedPrescriptionReceipt] = useState<any>(null);

  // Core database records
  const [patientRecord, setPatientRecord] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Live queue state
  const [liveTicket, setLiveTicket] = useState<any>(null);
  const [allQueueTickets, setAllQueueTickets] = useState<any[]>([]);
  const [waitEstimate, setWaitEstimate] = useState<any>(null);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);

  // Booking form state
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingMsg, setBookingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Real Payment Integration State (Card, Telebirr 0995774866 & CBE 1000305532472)
  const [bookingStep, setBookingStep] = useState<'details' | 'payment'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'TELEBIRR' | 'CBE'>('CARD');
  const [paymentTxnRef, setPaymentTxnRef] = useState('');
  const [paymentPayerPhone, setPaymentPayerPhone] = useState('');
  const [paymentPayerAccount, setPaymentPayerAccount] = useState('');
  const [paymentPayerName, setPaymentPayerName] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedReceiptAppt, setSelectedReceiptAppt] = useState<any>(null);

  // Profile form state
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileGender, setProfileGender] = useState('MALE');
  const [profileDob, setProfileDob] = useState('');
  const [profileBloodGroup, setProfileBloodGroup] = useState('O+');
  const [profileAllergies, setProfileAllergies] = useState('');
  const [profileEmergencyContact, setProfileEmergencyContact] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // History filtering & search
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'UPCOMING' | 'IN_QUEUE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [historySearch, setHistorySearch] = useState('');

  // Reschedule Modal state
  const [reschedulingAppt, setReschedulingAppt] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);

  // Cancellation Modal state (Appointments)
  const [cancellingAppt, setCancellingAppt] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('Patient requested cancellation');
  const [isCancelling, setIsCancelling] = useState(false);

  // Cancellation Modal state (Queue Ticket)
  const [cancellingTicket, setCancellingTicket] = useState<any>(null);
  const [cancelTicketReason, setCancelTicketReason] = useState('Patient left waiting area');
  const [isCancellingTicket, setIsCancellingTicket] = useState(false);

  // Action status indicators
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Load patient, appointments, queue tickets and facility data directly from DB
  const loadPatientData = async () => {
    if (!activeMembership?.clinicId) return;
    setIsDataLoading(true);

    try {
      const [meRes, apptRes, srvRes, docRes, brRes] = await Promise.all([
        apiFetch('/patients/me'),
        apiFetch('/appointments'),
        apiFetch('/services'),
        apiFetch('/doctors'),
        apiFetch('/clinics/current/branches'),
      ]);

      // 1. Process Patient Record from /patients/me
      if (meRes.success && meRes.data) {
        const pt = meRes.data;
        setPatientRecord(pt);
        setProfileFullName(pt.fullName || user?.fullName || '');
        setProfilePhone(pt.phone || user?.phone || '');
        setProfileAddress(pt.address || '');
        setProfileGender(pt.gender || 'MALE');
        setProfileDob(pt.dateOfBirth || '');
        setProfileBloodGroup(pt.bloodGroup || 'O+');
        setProfileAllergies(pt.allergies || '');
        setProfileEmergencyContact(pt.emergencyContact || '');

        // Queue tickets from /patients/me
        if (pt.queueTickets && pt.queueTickets.length > 0) {
          setAllQueueTickets(pt.queueTickets);
          const active = pt.queueTickets.find(
            (t: any) => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'SERVING'
          );
          setLiveTicket(active || null);
          if (active) {
            loadWaitEstimate(active.id);
          } else {
            setWaitEstimate(null);
          }
        } else {
          setAllQueueTickets([]);
          setLiveTicket(null);
          setWaitEstimate(null);
        }
      }

      // 2. Process Appointments
      if (apptRes.success) {
        const apptList = apptRes.data.items || [];
        setAppointments(apptList);

        // Fallback for queue ticket from appointments if not in meRes
        const checkedInAppt = apptList.find(
          (a: any) => (a.status === 'CHECKED_IN' || a.status === 'IN_QUEUE') && a.queueTicket
        );
        if (checkedInAppt?.queueTicket && !liveTicket) {
          setLiveTicket(checkedInAppt.queueTicket);
          loadWaitEstimate(checkedInAppt.queueTicket.id);
        }
      }

      // 3. Process Facilities & Services
      if (srvRes.success && srvRes.data) {
        const activeServices = srvRes.data.filter((s: any) => s.isActive);
        setServices(activeServices);
        if (activeServices.length > 0 && !selectedService) {
          setSelectedService(activeServices[0].id);
        }
      }

      if (docRes.success && docRes.data) {
        const activeDoctors = docRes.data.filter((d: any) => d.isActive);
        setDoctors(activeDoctors);
        if (activeDoctors.length > 0 && !selectedDoctor) {
          setSelectedDoctor(activeDoctors[0].id);
        }
      }

      if (brRes.success && brRes.data && brRes.data.length > 0) {
        setBranches(brRes.data);
        if (!selectedBranch) {
          setSelectedBranch(brRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load patient data from database:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Wait estimate query for live token
  const loadWaitEstimate = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/queue/tickets/${ticketId}/wait-estimate`);
      if (res.success) {
        setWaitEstimate(res.data);
      }
    } catch (err) {
      console.error('Failed to load wait estimate:', err);
    }
  };

  const handleRefreshQueue = async () => {
    setIsRefreshingQueue(true);
    await loadPatientData();
    setIsRefreshingQueue(false);
  };

  useEffect(() => {
    if (activeMembership?.clinicId) {
      loadPatientData();
    }
  }, [activeMembership]);

  // Dynamic slot availability query for Booking Form
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDoctor || !selectedDate) {
        setAvailableSlots([]);
        return;
      }
      setIsLoadingSlots(true);
      try {
        const res = await apiFetch(`/doctors/${selectedDoctor}/availability?date=${selectedDate}&duration=30`);
        if (res.success && res.data?.slots) {
          setAvailableSlots(res.data.slots);
          if (res.data.slots.length > 0) {
            setSelectedSlot(res.data.slots[0].start);
          } else {
            setSelectedSlot('');
          }
        } else {
          setAvailableSlots([]);
          setSelectedSlot('');
        }
      } catch (err) {
        setAvailableSlots([]);
        setSelectedSlot('');
      } finally {
        setIsLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDoctor, selectedDate]);

  // Dynamic slot availability query for Rescheduling Modal
  useEffect(() => {
    async function fetchRescheduleSlots() {
      if (!reschedulingAppt?.doctorId || !rescheduleDate) {
        setRescheduleSlots([]);
        return;
      }
      setIsLoadingRescheduleSlots(true);
      try {
        const res = await apiFetch(`/doctors/${reschedulingAppt.doctorId}/availability?date=${rescheduleDate}&duration=30`);
        if (res.success && res.data?.slots) {
          setRescheduleSlots(res.data.slots);
          if (res.data.slots.length > 0) {
            setSelectedRescheduleSlot(res.data.slots[0].start);
          } else {
            setSelectedRescheduleSlot('');
          }
        } else {
          setRescheduleSlots([]);
          setSelectedRescheduleSlot('');
        }
      } catch (err) {
        setRescheduleSlots([]);
        setSelectedRescheduleSlot('');
      } finally {
        setIsLoadingRescheduleSlots(false);
      }
    }

    if (reschedulingAppt) {
      fetchRescheduleSlots();
    }
  }, [reschedulingAppt, rescheduleDate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      setBookingMsg({ type: 'error', text: 'Please select a medical service.' });
      return;
    }
    if (!selectedDoctor) {
      setBookingMsg({ type: 'error', text: 'Please select a specialist/physician.' });
      return;
    }
    if (!selectedSlot) {
      setBookingMsg({ type: 'error', text: 'Please select an available consultation time slot.' });
      return;
    }

    setBookingMsg(null);
    if (!paymentPayerPhone) {
      setPaymentPayerPhone(patientRecord?.phone || user?.phone || '');
    }
    if (!paymentPayerName) {
      setPaymentPayerName(patientRecord?.fullName || user?.fullName || '');
    }
    setBookingStep('payment');
  };

  // Handle Booking Appointment with Real Payment Details
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTxnRef.trim()) {
      setBookingMsg({
        type: 'error',
        text: `Please enter the ${paymentMethod === 'TELEBIRR' ? 'Telebirr Transaction Code' : 'CBE Reference / Transaction ID'} before confirming your booking.`,
      });
      return;
    }

    setIsBooking(true);
    setBookingMsg(null);

    const srv = services.find((s) => s.id === selectedService);
    const amountVal = Number(srv?.price || 500);

    try {
      const res = await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: patientRecord?.id,
          doctorId: selectedDoctor,
          serviceId: selectedService,
          branchId: selectedBranch || undefined,
          scheduledStartAt: selectedSlot,
          reasonForVisit: bookingReason || 'General Medical Consultation',
          payment: {
            method: paymentMethod,
            transactionRef: paymentTxnRef.trim(),
            payerPhone: paymentPayerPhone.trim() || undefined,
            payerAccount: paymentMethod === 'CBE' ? (paymentPayerAccount.trim() || undefined) : undefined,
            payerName: paymentPayerName.trim() || undefined,
            amount: amountVal,
            notes: paymentNotes.trim() || undefined,
          },
        }),
      });

      if (res.success) {
        setBookingMsg({
          type: 'success',
          text: 'Appointment request and payment reference submitted successfully! Placed in front-desk approval queue.',
        });
        setBookingReason('');
        setPaymentTxnRef('');
        setPaymentNotes('');
        setBookingStep('details');
        await loadPatientData();
        setTimeout(() => {
          setActiveTab('history');
          setBookingMsg(null);
        }, 1500);
      } else {
        setBookingMsg({
          type: 'error',
          text: `Booking failed: ${res.error?.message || 'The selected slot may have just been reserved.'}`,
        });
      }
    } catch (err: any) {
      setBookingMsg({ type: 'error', text: err.message || 'An unexpected error occurred while booking.' });
    } finally {
      setIsBooking(false);
    }
  };

  // Handle Self Check-In (Converts CONFIRMED appointment to IN_QUEUE and generates QueueTicket in DB)
  const handleCheckIn = async (appointmentId: string) => {
    setCheckingInId(appointmentId);
    try {
      const res = await apiFetch(`/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({ priority: 'NORMAL' }),
      });

      if (res.success) {
        await loadPatientData();
        setActiveTab('tracker');
      } else {
        alert(`Check-in error: ${res.error?.message || 'Unable to complete self check-in at this time.'}`);
      }
    } catch (err: any) {
      alert(`Error during check-in: ${err.message}`);
    } finally {
      setCheckingInId(null);
    }
  };

  // Handle Rescheduling Appointment
  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingAppt || !selectedRescheduleSlot) {
      alert('Please choose an available slot to reschedule.');
      return;
    }

    setIsRescheduling(true);
    try {
      const res = await apiFetch(`/appointments/${reschedulingAppt.id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          scheduledStartAt: selectedRescheduleSlot,
          reason: rescheduleReason || 'Patient requested reschedule',
        }),
      });

      if (res.success) {
        setReschedulingAppt(null);
        setRescheduleReason('');
        await loadPatientData();
        alert('Appointment successfully rescheduled in database!');
      } else {
        alert(`Reschedule failed: ${res.error?.message || 'The chosen slot conflicts with another schedule.'}`);
      }
    } catch (err: any) {
      alert(`Reschedule failed: ${err.message}`);
    } finally {
      setIsRescheduling(false);
    }
  };

  // Handle Appointment Cancellation
  const handleConfirmCancelAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingAppt) return;

    setIsCancelling(true);
    try {
      const res = await apiFetch(`/appointments/${cancellingAppt.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancellationReason: cancelReason || 'Patient cancelled via portal' }),
      });

      if (res.success) {
        setCancellingAppt(null);
        setCancelReason('Patient requested cancellation');
        await loadPatientData();
        alert('Appointment has been cancelled and time slot released in database.');
      } else {
        alert(`Cancellation error: ${res.error?.message || 'Failed to cancel appointment.'}`);
      }
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Queue Ticket Cancellation
  const handleConfirmCancelTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingTicket) return;

    setIsCancellingTicket(true);
    try {
      const res = await apiFetch(`/queue/tickets/${cancellingTicket.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelTicketReason || 'Patient left queue via portal' }),
      });

      if (res.success) {
        setCancellingTicket(null);
        setCancelTicketReason('Patient left waiting area');
        await loadPatientData();
        alert('Queue ticket cancelled successfully.');
      } else {
        alert(`Error: ${res.error?.message || 'Failed to cancel queue ticket.'}`);
      }
    } catch (err: any) {
      alert(`Ticket cancellation failed: ${err.message}`);
    } finally {
      setIsCancellingTicket(false);
    }
  };

  // Handle Updating Medical Profile in DB
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);

    try {
      const res = await apiFetch('/patients/me', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: profileFullName,
          phone: profilePhone,
          address: profileAddress,
          gender: profileGender,
          dateOfBirth: profileDob || undefined,
          bloodGroup: profileBloodGroup,
          allergies: profileAllergies,
          emergencyContact: profileEmergencyContact,
        }),
      });

      if (res.success) {
        setProfileMsg({ type: 'success', text: 'Medical profile updated and saved to hospital database successfully!' });
        await loadPatientData();
        setTimeout(() => setProfileMsg(null), 4000);
      } else {
        setProfileMsg({ type: 'error', text: `Save error: ${res.error?.message || 'Failed to save changes.'}` });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Filter appointments list
  const filteredAppointments = appointments.filter((appt) => {
    const matchesFilter =
      historyFilter === 'ALL'
        ? true
        : historyFilter === 'UPCOMING'
        ? appt.status === 'CONFIRMED' || appt.status === 'REQUESTED' || appt.status === 'CHECKED_IN' || appt.status === 'IN_QUEUE'
        : historyFilter === 'IN_QUEUE'
        ? appt.status === 'IN_QUEUE' || appt.status === 'CHECKED_IN'
        : historyFilter === 'COMPLETED'
        ? appt.status === 'COMPLETED'
        : historyFilter === 'CANCELLED'
        ? appt.status === 'CANCELLED'
        : true;

    const matchesSearch =
      historySearch.trim() === '' ||
      appt.appointmentNumber?.toLowerCase().includes(historySearch.toLowerCase()) ||
      appt.doctor?.fullName?.toLowerCase().includes(historySearch.toLowerCase()) ||
      appt.service?.name?.toLowerCase().includes(historySearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Next upcoming appointment
  const nextUpcomingAppt = appointments.find(
    (a) => a.status === 'CONFIRMED' || a.status === 'REQUESTED' || a.status === 'IN_QUEUE' || a.status === 'CHECKED_IN'
  );

  const upcomingCount = appointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'REQUESTED' || a.status === 'IN_QUEUE' || a.status === 'CHECKED_IN'
  ).length;

  const prescriptions = patientRecord?.prescriptions || [];
  const pendingPrescriptionsCount = prescriptions.filter((p: any) => p.status === 'PENDING').length;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-medium">Connecting to Hospital Database...</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      roleTitle="Patient Self-Service"
      roleBadge="👤 Patient Portal"
      roleColor="blue"
      activeItemId={activeTab}
      onSelectNav={(id) => setActiveTab(id as any)}
      headerTitle={
        activeTab === 'portal'
          ? 'Patient Healthcare Dashboard'
          : activeTab === 'book'
          ? 'Book a Doctor Appointment'
          : activeTab === 'tracker'
          ? 'Live Waiting Room Queue Tracker'
          : activeTab === 'diagnostics'
          ? 'Specialist Diagnostic & X-Ray Reports'
          : activeTab === 'pharmacy'
          ? 'Hospital Pharmacy & Prescribed Medications'
          : activeTab === 'history'
          ? 'My Medical Appointments & Visits'
          : 'My Medical Profile & Contact Card'
      }
      headerSubtitle={`Hospital: ${activeMembership?.clinicName || 'Hospital'} • Welcome back, ${
        patientRecord?.fullName || user.fullName
      } (${patientRecord?.patientNumber || 'Patient'})`}
      headerActions={
        <div className="flex items-center space-x-2">
          {patientRecord?.patientNumber && (
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-mono font-bold">
              <span>ID:</span>
              <span>{patientRecord.patientNumber}</span>
            </span>
          )}
          <button
            onClick={loadPatientData}
            disabled={isDataLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isDataLoading ? 'Refreshing...' : 'Sync DB'}</span>
          </button>
        </div>
      }
      navGroups={[
        {
          groupLabel: 'Healthcare Services',
          items: [
            { id: 'portal', label: 'Portal Overview', icon: Layers },
            { id: 'book', label: 'Book Appointment', icon: Calendar },
            {
              id: 'tracker',
              label: 'Live Queue Tracker',
              icon: Ticket,
              badge: liveTicket ? liveTicket.displayToken : undefined,
              badgeColor: 'bg-blue-600 text-white font-bold',
            },
            {
              id: 'diagnostics',
              label: 'X-Ray & Diagnostics',
              icon: Scan,
              badge: (patientRecord?.diagnosticOrders || []).length > 0 ? (patientRecord?.diagnosticOrders || []).length : undefined,
              badgeColor: 'bg-purple-100 text-purple-800',
            },
            {
              id: 'pharmacy',
              label: 'My Prescriptions',
              icon: Pill,
              badge: pendingPrescriptionsCount > 0 ? `${pendingPrescriptionsCount} Pending` : prescriptions.length > 0 ? prescriptions.length : undefined,
              badgeColor: pendingPrescriptionsCount > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-emerald-100 text-emerald-800',
            },
            {
              id: 'history',
              label: 'My Appointments',
              icon: Clock,
              badge: upcomingCount > 0 ? upcomingCount : undefined,
              badgeColor: 'bg-emerald-100 text-emerald-800',
            },
            {
              id: 'profile',
              label: 'Medical Profile',
              icon: User,
              badge: patientRecord?.bloodGroup || undefined,
              badgeColor: 'bg-rose-50 text-rose-700 font-bold',
            },
          ],
        },
      ]}
    >
      {/* ------------------------------------------------------------- */}
      {/* TAB 1: PORTAL OVERVIEW                                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'portal' && (
        <div className="space-y-6">
          {/* Active Queue Banner */}
          {liveTicket && (
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <Ticket className="h-4 w-4 text-blue-100" />
                  <span>Your Live Queue Ticket</span>
                </div>
                <div className="flex items-baseline space-x-4">
                  <h2 className="text-5xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                    {liveTicket.displayToken}
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-white/20 text-white backdrop-blur-sm border border-white/20">
                    {liveTicket.status}
                  </span>
                </div>
                <p className="text-xs text-blue-100">
                  {liveTicket.queueSession?.doctor?.fullName
                    ? `With Dr. ${liveTicket.queueSession.doctor.fullName} (${liveTicket.queueSession.doctor.specialty})`
                    : 'Hospital General Outpatient Queue'}{' '}
                  • {liveTicket.queueSession?.branch?.name || 'Main Branch'}
                </p>
              </div>

              {waitEstimate && (
                <div className="grid grid-cols-2 gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[240px]">
                  <div>
                    <span className="text-[11px] text-blue-200 block uppercase font-medium">Ahead of You</span>
                    <span className="text-3xl font-black">{waitEstimate.positionAhead}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-blue-200 block uppercase font-medium">Estimated Wait</span>
                    <span className="text-3xl font-black">~{waitEstimate.estimatedWaitMinutes}m</span>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('tracker')}
                  className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                >
                  <span>Open Queue Screen</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Upcoming Visits</p>
                <h3 className="text-xl font-bold text-slate-900">{upcomingCount}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Visits</p>
                <h3 className="text-xl font-bold text-slate-900">{appointments.length}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Active Token</p>
                <h3 className="text-xl font-bold text-slate-900 font-mono">
                  {liveTicket?.displayToken || 'None'}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Blood Group</p>
                <h3 className="text-xl font-bold text-slate-900">
                  {patientRecord?.bloodGroup || 'Not set'}
                </h3>
              </div>
            </div>
          </div>

          {/* Next Scheduled Appointment Highlight */}
          {nextUpcomingAppt && (
            <div className="bg-white rounded-2xl border border-blue-200/80 shadow-sm p-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                      Next Scheduled Visit
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {nextUpcomingAppt.appointmentNumber}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {nextUpcomingAppt.service?.name} with Dr. {nextUpcomingAppt.doctor?.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                      {new Date(nextUpcomingAppt.scheduledStartAt).toLocaleString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {nextUpcomingAppt.branch?.name || 'Main Branch'}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {nextUpcomingAppt.status === 'REQUESTED' && (
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span>Pending Reception Approval</span>
                      </span>
                      <button
                        onClick={() => setCancellingAppt(nextUpcomingAppt)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition"
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}

                  {nextUpcomingAppt.status === 'CONFIRMED' && (
                    <>
                      <button
                        onClick={() => handleCheckIn(nextUpcomingAppt.id)}
                        disabled={checkingInId === nextUpcomingAppt.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{checkingInId === nextUpcomingAppt.id ? 'Checking In...' : 'Self Check-In Now'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setReschedulingAppt(nextUpcomingAppt);
                          setRescheduleDate(new Date().toISOString().split('T')[0]);
                        }}
                        className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold transition"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setCancellingAppt(nextUpcomingAppt)}
                        className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {(nextUpcomingAppt.status === 'IN_QUEUE' || nextUpcomingAppt.status === 'CHECKED_IN') && (
                    <button
                      onClick={() => setActiveTab('tracker')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>View Live Queue Status</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hospital Timeline Progress & Room Progression */}
          {appointments.length > 0 && (
            <ClinicalJourneyTimeline
              appointment={nextUpcomingAppt || appointments[0]}
              patientName={patientRecord?.fullName || user?.fullName}
            />
          )}

          {/* Diagnostics & Specialist X-Ray Section */}
          {(patientRecord?.diagnosticOrders || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-purple-200/90 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Specialist X-Ray & Diagnostic Reports</h3>
                    <p className="text-xs text-slate-500">
                      Medical imaging studies, radiologist findings, and attending doctor counseling plans
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                >
                  <span>View All ({patientRecord.diagnosticOrders.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {patientRecord.diagnosticOrders.slice(0, 2).map((order: any) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50/40 transition flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs">{order.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'REVIEWED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'COMPLETED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status === 'REVIEWED' ? 'COUNSELED & READY' : order.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Area: {order.bodyPart || 'Diagnostic study'} • Ref by Dr. {order.referringDoctor?.fullName}
                      </div>
                      {order.doctorConclusion && (
                        <div className="text-[11px] text-emerald-800 font-medium truncate max-w-xs">
                          Doctor: {order.doctorConclusion}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedDiagnosticReport(order)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      Report
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hospital Pharmacy & Medications Highlight */}
          {prescriptions.length > 0 && (
            <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Hospital Pharmacy & Prescribed Medications</h3>
                    <p className="text-xs text-slate-500">
                      Doctor-prescribed drugs • Pay in Ethiopian Birr (Telebirr 0995774866 / CBE 1000305532472 / Cash) & collect
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('pharmacy')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <span>View All ({prescriptions.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prescriptions.slice(0, 2).map((rx: any) => (
                  <div
                    key={rx.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/40 transition flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">{rx.prescriptionNumber}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rx.status === 'DISPENSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rx.status === 'PAID'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rx.status === 'DISPENSED'
                            ? 'DISPENSED & COLLECTED'
                            : rx.status === 'PAID'
                            ? 'PAID - READY AT COUNTER'
                            : 'AWAITING PAYMENT IN ETB'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {rx.items?.length || 0} medication{(rx.items?.length || 0) === 1 ? '' : 's'} • Total:{' '}
                        <strong className="text-emerald-700 font-bold">{Number(rx.totalAmount || 0).toFixed(2)} ETB</strong>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate max-w-xs">
                        Dr. {rx.doctor?.fullName || 'Attending Doctor'}
                        {rx.diagnosis ? ` • ${rx.diagnosis}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('pharmacy')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      View Rx
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setActiveTab('book')}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
                <span>Book New Appointment</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Choose doctor, medical service, and available real-time time slot.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('tracker')}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Ticket className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center justify-between">
                <span>Waiting Room Queue Tracker</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Track your active token, position ahead, and consultation room call.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('profile')}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <User className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition flex items-center justify-between">
                <span>Medical Profile & Health Card</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Update blood group, allergies, contact phone, and emergency details.
              </p>
            </div>
          </div>

          {/* Recent Appointments Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Recent Appointments & Visits</span>
              </h3>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
              >
                <span>View All ({appointments.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                You haven't scheduled any appointments yet.{' '}
                <button
                  onClick={() => setActiveTab('book')}
                  className="text-blue-600 font-semibold underline hover:text-blue-700 ml-1"
                >
                  Book your first visit
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.slice(0, 4).map((appt) => (
                  <div key={appt.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {appt.appointmentNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{appt.service?.name}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Dr. {appt.doctor?.fullName} •{' '}
                        {new Date(appt.scheduledStartAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          appt.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : appt.status === 'IN_QUEUE' || appt.status === 'CHECKED_IN'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : appt.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: BOOK APPOINTMENT & PAYMENT GATEWAY                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'book' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          {/* Header & Step Tracker */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>Schedule a Doctor Visit</span>
              </h2>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    bookingStep === 'details'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  1. Visit Details
                </span>
                <span className="text-slate-300">→</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    bookingStep === 'payment'
                      ? 'bg-blue-600 text-white shadow-sm animate-pulse'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  2. Payment (Telebirr / CBE)
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {bookingStep === 'details'
                ? 'Select hospital facility / branch, medical department, attending doctor, and an open consultation slot.'
                : 'Complete the consultation fee transfer via Telebirr or CBE and submit the transaction reference.'}
            </p>
          </div>

          {bookingMsg && (
            <div
              className={`mb-6 p-4 rounded-2xl text-xs font-medium flex items-center space-x-2.5 ${
                bookingMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {bookingMsg.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{bookingMsg.text}</span>
            </div>
          )}

          {/* STEP 1: VISIT DETAILS */}
          {bookingStep === 'details' && (
            <form onSubmit={handleProceedToPayment} className="space-y-5">
              {/* Branch Selection */}
              {branches.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Hospital Branch / Facility</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.address})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Medical Service / Treatment</label>
                <select
                  required
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="">Select Service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} • {s.durationMinutes} mins ({Number(s.price).toFixed(2)} ETB)
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Physician / Specialist</label>
                <select
                  required
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="">Select Doctor...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Appointment Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Available Time Slots */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Available Time Slots</label>
                  {isLoadingSlots && (
                    <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Querying schedule...
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setSelectedSlot(slot.start)}
                          className={`py-2 px-3 text-xs rounded-xl border text-center transition font-mono ${
                            selectedSlot === slot.start
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                              : 'border-slate-200 hover:border-blue-400 bg-white text-slate-700'
                          }`}
                        >
                          {slot.startFormatted || new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      {selectedDoctor
                        ? 'No available consultation slots found for this date. Please try another day.'
                        : 'Please select a doctor to view available appointment slots.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason for Visit / Symptoms</label>
                <input
                  type="text"
                  placeholder="e.g. Routine physical checkup, persistent cough, follow-up"
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedSlot || !selectedService}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2"
              >
                <span>
                  Proceed to Payment (
                  {Number(services.find((s) => s.id === selectedService)?.price || 500).toFixed(2)} ETB)
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: REAL PAYMENT GATEWAY (TELEBIRR & CBE) */}
          {bookingStep === 'payment' && (
            <form onSubmit={handleBookAppointment} className="space-y-6">
              {/* Order / Appointment Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200/80 pb-2">
                  <span>Consultation Summary</span>
                  <span className="text-blue-600">Step 2 of 2</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Service</span>
                    <strong className="text-slate-800">
                      {services.find((s) => s.id === selectedService)?.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Physician</span>
                    <strong className="text-slate-800">
                      Dr. {doctors.find((d) => d.id === selectedDoctor)?.fullName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date & Time</span>
                    <strong className="text-slate-800">
                      {selectedSlot
                        ? new Date(selectedSlot).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : selectedDate}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Fee Payable</span>
                    <strong className="text-emerald-700 text-sm font-black">
                      {Number(services.find((s) => s.id === selectedService)?.price || 500).toFixed(2)} ETB
                    </strong>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Select Initial Consultation Payment Method (Verified at Reception)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card Payment */}
                  <div
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                      paymentMethod === 'CARD'
                        ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Card Payment</h4>
                          <span className="text-[10px] text-blue-700 font-semibold">Debit / Credit / Card</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'CARD'}
                        onChange={() => setPaymentMethod('CARD')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200 text-xs mt-2 space-y-1">
                      <div className="text-[11px] font-semibold text-blue-900">Front-Desk Card Reception</div>
                      <p className="text-[10px] text-slate-500">
                        Present your debit/credit card or enter transaction receipt reference below.
                      </p>
                    </div>
                  </div>

                  {/* Telebirr Card */}
                  <div
                    onClick={() => setPaymentMethod('TELEBIRR')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                      paymentMethod === 'TELEBIRR'
                        ? 'border-amber-400 bg-amber-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-400 text-blue-900 font-black text-xs flex items-center justify-center shadow-sm">
                          TB
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Telebirr</h4>
                          <span className="text-[10px] text-amber-800 font-semibold">0995774866</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'TELEBIRR'}
                        onChange={() => setPaymentMethod('TELEBIRR')}
                        className="text-amber-500 focus:ring-amber-400"
                      />
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 text-xs mt-2">
                      <div className="text-[11px] text-slate-500">Official Telebirr Account:</div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono text-xs font-black text-slate-900 tracking-wider">
                          0995774866
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard('0995774866', 'telebirr');
                          }}
                          className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center space-x-1"
                        >
                          {copiedField === 'telebirr' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'telebirr' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CBE Card */}
                  <div
                    onClick={() => setPaymentMethod('CBE')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                      paymentMethod === 'CBE'
                        ? 'border-purple-500 bg-purple-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-700 text-white font-black text-xs flex items-center justify-center shadow-sm">
                          CBE
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">CBE Bank</h4>
                          <span className="text-[10px] text-purple-700 font-semibold">1000305532472</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'CBE'}
                        onChange={() => setPaymentMethod('CBE')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-purple-200 text-xs mt-2">
                      <div className="text-[11px] text-slate-500">Official CBE Account:</div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono text-[11px] font-black text-slate-900 tracking-wider">
                          1000305532472
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard('1000305532472', 'cbe');
                          }}
                          className="px-2 py-0.5 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold flex items-center space-x-1"
                        >
                          {copiedField === 'cbe' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'cbe' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Two-Stage Hospital Payment Protocol:</span> Initial registration & consultation is card/telebirr/CBE payment verified at reception. Prescribed drugs will be paid in Ethiopian Birr (ETB) directly at <strong>Room 105 - Central Pharmacy</strong>.
                  </div>
                </div>
              </div>

              {/* Transfer Instruction Guidelines */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs space-y-1 text-slate-700">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-blue-600" />
                  {paymentMethod === 'TELEBIRR'
                    ? 'How to pay via Telebirr (0995774866):'
                    : 'How to pay via CBE (1000305532472):'}
                </span>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600 pl-1">
                  {paymentMethod === 'TELEBIRR' ? (
                    <>
                      <li>Open Telebirr App or dial <strong>*127#</strong> on your phone.</li>
                      <li>Select <strong>Send Money / Transfer</strong> and enter phone <strong>0995774866</strong>.</li>
                      <li>
                        Enter exact amount{' '}
                        <strong>
                          {Number(services.find((s) => s.id === selectedService)?.price || 500).toFixed(2)} ETB
                        </strong>{' '}
                        and confirm.
                      </li>
                      <li>Copy the <strong>Transaction Code / ID</strong> from your SMS receipt and paste it below.</li>
                    </>
                  ) : (
                    <>
                      <li>Open CBE Mobile Banking app, CBE Birr (<strong>*847#</strong>), or visit a CBE branch.</li>
                      <li>Transfer to Account <strong>1000305532472</strong> (Metro Health Medical Center).</li>
                      <li>
                        Enter exact amount{' '}
                        <strong>
                          {Number(services.find((s) => s.id === selectedService)?.price || 500).toFixed(2)} ETB
                        </strong>.
                      </li>
                      <li>Copy the <strong>Reference / Transaction Number</strong> from the transfer slip.</li>
                    </>
                  )}
                </ol>
              </div>

              {/* Payment Verification Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    {paymentMethod === 'TELEBIRR' ? 'Telebirr Transaction Code / ID' : 'CBE Transaction Reference / ID'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      paymentMethod === 'TELEBIRR'
                        ? 'e.g. TB99577486612 or 8K91029384'
                        : 'e.g. FT242940283 or CBE-1000305532472'
                    }
                    value={paymentTxnRef}
                    onChange={(e) => setPaymentTxnRef(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Required for front-desk reception to verify and confirm your appointment.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {paymentMethod === 'TELEBIRR' ? 'Sender Phone (Telebirr)' : 'Sender Account / Phone'}
                    </label>
                    <input
                      type="text"
                      placeholder={paymentMethod === 'TELEBIRR' ? '0911223344' : 'Account or Phone'}
                      value={paymentMethod === 'TELEBIRR' ? paymentPayerPhone : (paymentPayerAccount || paymentPayerPhone)}
                      onChange={(e) => {
                        if (paymentMethod === 'TELEBIRR') {
                          setPaymentPayerPhone(e.target.value);
                        } else {
                          setPaymentPayerAccount(e.target.value);
                        }
                      }}
                      className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Depositor / Payer Name</label>
                    <input
                      type="text"
                      placeholder="Full Name on Account"
                      value={paymentPayerName}
                      onChange={(e) => setPaymentPayerName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Payment Note / Bank Slip Remark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Consultation fee for Dr. visit"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingStep('details')}
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  ← Back to Details
                </button>

                <button
                  type="submit"
                  disabled={isBooking || !paymentTxnRef.trim()}
                  className="w-2/3 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isBooking
                      ? 'Submitting Booking & Payment...'
                      : `Confirm Booking (${Number(
                          services.find((s) => s.id === selectedService)?.price || 500
                        ).toFixed(2)} ETB)`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: LIVE QUEUE TRACKER                                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'tracker' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {liveTicket ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    Active Live Token
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">
                    Waiting Room Queue Status
                  </h2>
                  <p className="text-xs text-slate-500">
                    Token is live and connected directly to the hospital waiting room display.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefreshQueue}
                    disabled={isRefreshingQueue}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQueue ? 'animate-spin text-blue-600' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={() => setCancellingTicket(liveTicket)}
                    className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold transition"
                  >
                    Leave Queue
                  </button>
                </div>
              </div>

              {/* Giant Token & Status Display */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white text-center shadow-lg relative overflow-hidden">
                <div className="space-y-1 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Your Queue Token Number
                  </span>
                  <h1 className="text-7xl font-black font-mono tracking-tight text-white drop-shadow">
                    {liveTicket.displayToken}
                  </h1>
                </div>

                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wide">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      liveTicket.status === 'CALLED'
                        ? 'bg-amber-400 animate-ping'
                        : liveTicket.status === 'SERVING'
                        ? 'bg-emerald-400'
                        : 'bg-blue-400 animate-pulse'
                    }`}
                  />
                  <span>
                    Status: {liveTicket.status === 'CALLED' ? 'Please proceed to doctor' : liveTicket.status}
                  </span>
                </div>

                {liveTicket.counter && (
                  <p className="text-sm font-semibold text-emerald-300 mt-4">
                    Assigned: Counter {liveTicket.counter.name}
                  </p>
                )}
              </div>

              {/* Queue Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <span className="text-xs text-blue-700 font-semibold block mb-1">Patients Ahead</span>
                  <span className="text-3xl font-black text-blue-900">
                    {waitEstimate ? waitEstimate.positionAhead : '0'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-xs text-indigo-700 font-semibold block mb-1">Estimated Wait Time</span>
                  <span className="text-3xl font-black text-indigo-900">
                    ~{waitEstimate ? waitEstimate.estimatedWaitMinutes : 0} min
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-semibold block mb-1">Assigned Doctor</span>
                  <span className="text-sm font-bold text-slate-900 block truncate">
                    Dr. {liveTicket.queueSession?.doctor?.fullName || 'Hospital Attending Physician'}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {liveTicket.queueSession?.doctor?.specialty || 'General Practice'}
                  </span>
                </div>
              </div>

              {/* Stepper Progress */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">
                  Live Queue Progress
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="space-y-1">
                    <div className="w-7 h-7 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      ✓
                    </div>
                    <span className="font-semibold text-slate-800 block text-[11px]">Checked In</span>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                        liveTicket.status === 'WAITING' || liveTicket.status === 'CALLED' || liveTicket.status === 'SERVING'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      2
                    </div>
                    <span className="font-semibold text-slate-800 block text-[11px]">In Queue</span>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                        liveTicket.status === 'CALLED' || liveTicket.status === 'SERVING'
                          ? 'bg-amber-500 text-white animate-bounce'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      3
                    </div>
                    <span className="font-semibold text-slate-800 block text-[11px]">Called</span>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                        liveTicket.status === 'SERVING'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      4
                    </div>
                    <span className="font-semibold text-slate-800 block text-[11px]">Consultation</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Ticket className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No Active Queue Token</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You are not currently queued in the waiting room. If you have an appointment scheduled for today, you can check in now to receive a live token number.
                </p>
              </div>

              {nextUpcomingAppt && nextUpcomingAppt.status === 'CONFIRMED' ? (
                <div className="pt-2">
                  <button
                    onClick={() => handleCheckIn(nextUpcomingAppt.id)}
                    disabled={checkingInId === nextUpcomingAppt.id}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {checkingInId === nextUpcomingAppt.id
                        ? 'Generating Token in DB...'
                        : `Check In to Appointment (${nextUpcomingAppt.appointmentNumber})`}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('book')}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    Book New Appointment
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Past Queue Tickets Table */}
          {allQueueTickets.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>My Queue Ticket History</span>
              </h3>
              <div className="divide-y divide-slate-100">
                {allQueueTickets.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-blue-600">{t.displayToken}</span>
                        <span className="text-slate-700 font-medium">
                          {t.queueSession?.doctor?.fullName
                            ? `Dr. ${t.queueSession.doctor.fullName}`
                            : 'General Queue'}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        Checked in: {new Date(t.checkedInAt).toLocaleString()}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : t.status === 'SKIPPED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hospital Timeline Progress & Room Progression */}
          {appointments.length > 0 && (
            <ClinicalJourneyTimeline
              appointment={nextUpcomingAppt || appointments[0]}
              patientName={patientRecord?.fullName || user?.fullName}
            />
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: MY APPOINTMENTS (FULL HISTORY)                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['ALL', 'UPCOMING', 'IN_QUEUE', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setHistoryFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      historyFilter === tab
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'ALL'
                      ? `All (${appointments.length})`
                      : tab === 'UPCOMING'
                      ? `Upcoming (${upcomingCount})`
                      : tab}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search doctor, token..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Appointments Grid */}
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-12 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No appointments found</h4>
                <p className="text-xs text-slate-400">
                  {historySearch
                    ? 'No appointments matched your search query.'
                    : 'You have no appointments recorded under this category.'}
                </p>
                <button
                  onClick={() => setActiveTab('book')}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Schedule a Visit
                </button>
              </div>
            ) : (
              filteredAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-slate-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          {appt.appointmentNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{appt.service?.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Doctor: <strong className="text-slate-800">Dr. {appt.doctor?.fullName}</strong> ({appt.doctor?.specialty}) • Branch: {appt.branch?.name || 'Main Branch'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                          appt.status === 'REQUESTED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : appt.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : appt.status === 'IN_QUEUE' || appt.status === 'CHECKED_IN'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : appt.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {appt.status === 'REQUESTED' ? 'PENDING APPROVAL' : appt.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center gap-1 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                        {new Date(appt.scheduledStartAt).toLocaleString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {appt.reasonForVisit && (
                        <span className="text-slate-500 truncate max-w-xs">
                          Reason: {appt.reasonForVisit}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {appt.status === 'REQUESTED' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            Awaiting Reception Approval
                          </span>
                          <button
                            onClick={() => setCancellingAppt(appt)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {appt.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => handleCheckIn(appt.id)}
                            disabled={checkingInId === appt.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{checkingInId === appt.id ? 'Checking In...' : 'Check In'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setReschedulingAppt(appt);
                              setRescheduleDate(new Date().toISOString().split('T')[0]);
                            }}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-semibold transition"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => setCancellingAppt(appt)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl font-semibold transition"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {(appt.status === 'IN_QUEUE' || appt.status === 'CHECKED_IN') && (
                        <button
                          onClick={() => setActiveTab('tracker')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center space-x-1"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Track Live Token</span>
                        </button>
                      )}

                      {appt.status === 'CANCELLED' && appt.cancellationReason && (
                        <span className="text-[11px] text-rose-500 italic">
                          Reason: {appt.cancellationReason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Verification Strip */}
                  {appt.payment && (
                    <div className="pt-2.5 mt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                            appt.payment.method === 'TELEBIRR'
                              ? 'bg-amber-400 text-blue-950 font-bold'
                              : 'bg-purple-700 text-white font-bold'
                          }`}
                        >
                          {appt.payment.method === 'TELEBIRR' ? 'TELEBIRR' : 'CBE'}
                        </span>
                        <span className="font-bold text-slate-800">
                          {Number(appt.payment.amount).toFixed(2)} ETB
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-slate-600 text-[11px]">
                          Ref: <strong>{appt.payment.transactionRef}</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            appt.payment.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {appt.payment.status === 'VERIFIED' ? '✓ Payment Verified' : '⏳ Payment Pending'}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedReceiptAppt(appt)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center space-x-1 transition"
                        >
                          <Receipt className="w-3 h-3 text-slate-500" />
                          <span>View Receipt</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: MEDICAL PROFILE & HEALTH CARD                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Digital Health ID Badge */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 text-white shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/20 pb-4">
                <div className="flex items-center space-x-2">
                  <HeartPulse className="w-5 h-5 text-rose-300" />
                  <span className="font-bold text-xs uppercase tracking-wider">Patient Health Card</span>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>

              <div>
                <p className="text-[11px] text-blue-200 uppercase font-semibold">Registered Patient ID</p>
                <h3 className="text-2xl font-black font-mono tracking-wider">
                  {patientRecord?.patientNumber || 'PT-PENDING'}
                </h3>
              </div>

              <div>
                <p className="text-[11px] text-blue-200 uppercase font-semibold">Full Patient Name</p>
                <h4 className="text-lg font-bold">{patientRecord?.fullName || user.fullName}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/20 text-xs">
                <div>
                  <span className="text-blue-200 block text-[11px]">Blood Type</span>
                  <span className="font-bold text-white text-sm">{patientRecord?.bloodGroup || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-blue-200 block text-[11px]">Gender</span>
                  <span className="font-bold text-white text-sm">{patientRecord?.gender || 'Not recorded'}</span>
                </div>
              </div>

              <div className="text-[11px] text-blue-200 space-y-0.5">
                <p>Hospital: {activeMembership?.clinicName || 'Hospital'}</p>
                <p>Contact: {patientRecord?.phone || user.phone || 'No phone set'}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Database Synchronization</p>
              <p>All medical and demographic information is securely persisted in PostgreSQL and accessible to authorized hospital physicians.</p>
            </div>
          </div>

          {/* Column 2 & 3: Profile Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Update Medical & Demographic Profile</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Keep your hospital medical records accurate for emergency response and medical consultations.
              </p>
            </div>

            {profileMsg && (
              <div
                className={`mb-6 p-4 rounded-2xl text-xs font-medium flex items-center space-x-2.5 ${
                  profileMsg.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {profileMsg.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Mandatory)</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 555-0199"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={profileDob}
                    onChange={(e) => setProfileDob(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={profileBloodGroup}
                    onChange={(e) => setProfileBloodGroup(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white outline-none focus:border-blue-500 font-medium"
                  >
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact (Name & Phone)</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe (Spouse) - 555-0144"
                  value={profileEmergencyContact}
                  onChange={(e) => setProfileEmergencyContact(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Known Allergies / Sensitivities</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts, Latex, Sulfa drugs"
                  value={profileAllergies}
                  onChange={(e) => setProfileAllergies(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="123 Health Ave, Apt 4B, City, Country"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Saving to Database...' : 'Save Medical Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: SPECIALIST DIAGNOSTIC & X-RAY REPORTS                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scan className="w-5 h-5 text-purple-600" />
                  <span>My Specialist Diagnostic & X-Ray Reports</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View imaging results, radiologist diagnostic findings, and your attending doctor's counseling plan
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 w-fit">
                Total Orders: {(patientRecord?.diagnosticOrders || []).length}
              </span>
            </div>

            {(patientRecord?.diagnosticOrders || []).length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                <Scan className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-700">No Diagnostic Studies Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When your doctor orders an X-Ray or imaging study during a consultation, your reports and counseling plan will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(patientRecord?.diagnosticOrders || []).map((order: any) => (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 hover:shadow-md transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{order.title}</span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              order.status === 'REVIEWED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'COMPLETED'
                                ? 'bg-purple-100 text-purple-800'
                                : order.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {order.status === 'REVIEWED'
                              ? 'DOCTOR COUNSELED & DISCHARGED'
                              : order.status === 'COMPLETED'
                              ? 'SCAN COMPLETED - WITH DOCTOR'
                              : order.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Anatomical Region: <strong className="text-slate-700">{order.bodyPart || 'Diagnostic area'}</strong> • Modality: {order.type}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedDiagnosticReport(order)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5 w-fit"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Radiology Chart</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Physicians Involved:
                        </span>
                        <div>
                          <span className="text-slate-500">Referring Physician: </span>
                          <strong className="text-slate-800">{order.referringDoctor?.fullName || 'Attending Doctor'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Reporting Specialist: </span>
                          <strong className="text-purple-800">{order.specialistDoctor?.fullName || order.completedBy || 'Radiology Department'}</strong>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Diagnostic Status:
                        </span>
                        <p className="text-slate-700">
                          {order.impression ? `Impression: ${order.impression}` : 'Procedure ordered. Pending specialist radiograph.'}
                        </p>
                      </div>
                    </div>

                    {order.doctorConclusion && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                        <span className="font-extrabold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Primary Doctor Counseling & Treatment Instructions:</span>
                        </span>
                        <p className="leading-relaxed font-medium">{order.doctorConclusion}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: HOSPITAL PHARMACY & PRESCRIPTIONS                      */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'pharmacy' && (
        <div className="space-y-6">
          {/* Top Banner / Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-600" />
                  <span>Hospital Pharmacy & Medication Prescriptions</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Medications prescribed by your attending doctor • Itemized prices in Ethiopian Birr (ETB)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Total Prescriptions: {prescriptions.length}
                </span>
                {pendingPrescriptionsCount > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    {pendingPrescriptionsCount} Pending Payment
                  </span>
                )}
              </div>
            </div>

            {/* Payment Guide Notice */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>How to Purchase & Collect Prescribed Drugs</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Prescriptions written during your doctor consultation are electronically transmitted to the hospital pharmacy.
                    Present your <strong>Prescription Number (RX-...)</strong> at the pharmacy counter. You can pay in <strong>Ethiopian Birr (ETB)</strong> via <strong>Telebirr</strong>, <strong>CBE</strong>, or <strong>Counter Cash</strong>.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <div className="px-3 py-2 bg-white rounded-xl border border-emerald-200 shadow-xs flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Telebirr Pharmacy</span>
                      <strong className="text-slate-900 font-mono text-xs">0995774866</strong>
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-white rounded-xl border border-emerald-200 shadow-xs flex items-center space-x-2">
                    <Landmark className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">CBE Pharmacy</span>
                      <strong className="text-slate-900 font-mono text-xs">1000305532472</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prescription Cards */}
            {prescriptions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-700">No Prescriptions Issued Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When your attending doctor prescribes medications during your consultation, your prescription and pricing in Birr will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {prescriptions.map((rx: any) => (
                  <div
                    key={rx.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono font-black text-slate-900 text-sm">{rx.prescriptionNumber}</span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              rx.status === 'DISPENSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rx.status === 'PAID'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {rx.status === 'DISPENSED'
                              ? 'DISPENSED & COLLECTED'
                              : rx.status === 'PAID'
                              ? 'PAID - READY AT COUNTER'
                              : 'AWAITING PAYMENT IN ETB'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Prescribed by Dr. <strong className="text-slate-800">{rx.doctor?.fullName || 'Attending Physician'}</strong> •{' '}
                          {new Date(rx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          {rx.diagnosis ? ` • Diagnosis: ${rx.diagnosis}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Price</span>
                          <span className="text-lg font-black text-emerald-700">
                            {Number(rx.totalAmount || 0).toFixed(2)} ETB
                          </span>
                        </div>

                        {(rx.status === 'PAID' || rx.status === 'DISPENSED') && (
                          <button
                            onClick={() => setSelectedPrescriptionReceipt(rx)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5 shrink-0"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Pharmacy Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Prescribed Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                            <th className="py-2 pr-3">Medication / Drug Name</th>
                            <th className="py-2 px-3">Dosage & Frequency</th>
                            <th className="py-2 px-3">Duration</th>
                            <th className="py-2 px-3 text-center">Qty</th>
                            <th className="py-2 px-3 text-right">Unit Price</th>
                            <th className="py-2 pl-3 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(rx.items || []).map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 pr-3">
                                <div className="font-bold text-slate-900">{item.drugName || item.medicationName || item.medication?.name}</div>
                                {item.medication?.category && (
                                  <span className="text-[10px] text-slate-400">{item.medication.category}</span>
                                )}
                                {item.instructions && (
                                  <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                                    Note: {item.instructions}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {item.dosage} {item.frequency ? `• ${item.frequency}` : ''}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{item.duration || 'As directed'}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{item.quantity}</td>
                              <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                                {Number(item.unitPrice || 0).toFixed(2)} ETB
                              </td>
                              <td className="py-2.5 pl-3 text-right font-bold text-slate-900 font-mono">
                                {Number(item.totalPrice || 0).toFixed(2)} ETB
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer / Status Notes */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      {rx.status === 'PENDING' ? (
                        <div className="flex items-center space-x-2 text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>
                            Please proceed to the Hospital Pharmacy counter to pay <strong>{Number(rx.totalAmount || 0).toFixed(2)} ETB</strong> and collect your prescribed drugs.
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3 text-slate-600">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>
                              Payment Method: <strong>{rx.paymentMethod || 'TELEBIRR / CBE'}</strong>
                            </span>
                          </div>
                          {rx.transactionRef && (
                            <div className="flex items-center space-x-1">
                              <span className="text-slate-400">TXN:</span>
                              <span className="font-mono font-bold text-slate-800">{rx.transactionRef}</span>
                            </div>
                          )}
                          {rx.receiptNumber && (
                            <div className="flex items-center space-x-1">
                              <span className="text-slate-400">Receipt:</span>
                              <span className="font-mono font-bold text-emerald-700">{rx.receiptNumber}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {rx.notes && (
                        <div className="text-[11px] text-slate-500 italic">
                          Pharmacist Note: {rx.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: RESCHEDULE APPOINTMENT                               */}
      {/* ------------------------------------------------------------- */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span>Reschedule Appointment</span>
              </h3>
              <button
                onClick={() => setReschedulingAppt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
              <div>
                <strong>Physician:</strong> Dr. {reschedulingAppt.doctor?.fullName}
              </div>
              <div>
                <strong>Service:</strong> {reschedulingAppt.service?.name}
              </div>
              <div>
                <strong>Current Schedule:</strong> {new Date(reschedulingAppt.scheduledStartAt).toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select New Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Open Slots on New Date</label>
                  {isLoadingRescheduleSlots && (
                    <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Querying...
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50/50">
                  {rescheduleSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                      {rescheduleSlots.map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setSelectedRescheduleSlot(slot.start)}
                          className={`py-1.5 px-2 text-xs rounded-lg border text-center transition font-mono ${
                            selectedRescheduleSlot === slot.start
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                              : 'border-slate-200 hover:border-blue-400 bg-white text-slate-700'
                          }`}
                        >
                          {slot.startFormatted || new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No slots available on this date.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Reschedule</label>
                <input
                  type="text"
                  placeholder="e.g. Work schedule change"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingAppt(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRescheduling || !selectedRescheduleSlot}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-sm"
                >
                  {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: CANCEL APPOINTMENT                                   */}
      {/* ------------------------------------------------------------- */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Cancel Appointment</span>
              </h3>
              <button
                onClick={() => setCancellingAppt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel appointment{' '}
              <strong className="text-slate-900 font-mono">{cancellingAppt.appointmentNumber}</strong> with{' '}
              <strong>Dr. {cancellingAppt.doctor?.fullName}</strong>? This slot will be released back to the hospital schedule.
            </p>

            <form onSubmit={handleConfirmCancelAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Cancellation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule conflict, feeling recovered"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingAppt(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-sm"
                >
                  {isCancelling ? 'Cancelling in DB...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: CANCEL QUEUE TICKET                                  */}
      {/* ------------------------------------------------------------- */}
      {cancellingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-rose-600" />
                <span>Leave Queue Line</span>
              </h3>
              <button
                onClick={() => setCancellingTicket(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel your queue token{' '}
              <strong className="text-slate-900 font-mono text-sm">{cancellingTicket.displayToken}</strong>? You will lose your current spot in line.
            </p>

            <form onSubmit={handleConfirmCancelTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Leaving</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need to leave hospital, personal emergency"
                  value={cancelTicketReason}
                  onChange={(e) => setCancelTicketReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingTicket(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Stay in Queue
                </button>
                <button
                  type="submit"
                  disabled={isCancellingTicket}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-sm"
                >
                  {isCancellingTicket ? 'Leaving...' : 'Confirm Leave Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: OFFICIAL PAYMENT RECEIPT                               */}
      {/* ------------------------------------------------------------- */}
      {selectedReceiptAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white text-center relative">
              <button
                onClick={() => setSelectedReceiptAppt(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition text-xs font-bold"
              >
                ✕
              </button>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2 border border-white/20">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-black">Official Consultation Receipt</h3>
              <p className="text-xs text-blue-100 mt-0.5">Metro Health Medical Center</p>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4">
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Consultation Fee</span>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  {Number(selectedReceiptAppt.payment?.amount || selectedReceiptAppt.service?.price || 500).toFixed(2)} ETB
                </div>
                <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {selectedReceiptAppt.payment?.status === 'VERIFIED'
                      ? 'Payment Verified by Reception'
                      : 'Payment Submitted (Pending)'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedReceiptAppt.payment?.receiptNumber || 'RCP-' + selectedReceiptAppt.appointmentNumber}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="font-bold text-slate-900">
                    {selectedReceiptAppt.payment?.method === 'TELEBIRR'
                      ? 'Telebirr (0995774866)'
                      : 'CBE (1000305532472)'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Transaction Ref / TXN ID:</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {selectedReceiptAppt.payment?.transactionRef || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Patient Name:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedReceiptAppt.payment?.payerName || selectedReceiptAppt.patient?.fullName || user?.fullName}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Medical Service:</span>
                  <span className="font-semibold text-slate-900">{selectedReceiptAppt.service?.name}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Assigned Doctor:</span>
                  <span className="font-semibold text-slate-900">Dr. {selectedReceiptAppt.doctor?.fullName}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Appointment Date:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedReceiptAppt.scheduledStartAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {selectedReceiptAppt.payment?.notes && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Remark: </span>
                  {selectedReceiptAppt.payment.notes}
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedReceiptAppt(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition shadow-md"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PATIENT FULL RADIOLOGY & X-RAY CHART                  */}
      {/* ------------------------------------------------------------- */}
      {selectedDiagnosticReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedDiagnosticReport.title}</h3>
                  <p className="text-xs text-slate-500">Official Diagnostic Imaging & Radiology Report</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDiagnosticReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition text-xs"
              >
                ✕
              </button>
            </div>

            {/* Medical Study Details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Patient Name:</span>
                <span className="font-bold text-slate-900">{patientRecord?.fullName || user?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Patient ID:</span>
                <span className="font-mono font-bold text-slate-900">{patientRecord?.patientNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Referring Doctor:</span>
                <span className="font-bold text-slate-800">{selectedDiagnosticReport.referringDoctor?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Reporting Specialist:</span>
                <span className="font-bold text-purple-800">
                  {selectedDiagnosticReport.specialistDoctor?.fullName || selectedDiagnosticReport.completedBy || 'Radiology Suite'}
                </span>
              </div>
            </div>

            {/* High-Res Radiograph Image Viewer */}
            {selectedDiagnosticReport.imageUrl && (
              <div className="rounded-2xl border border-slate-300 bg-slate-950 p-3 text-center">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-mono">
                  DIGITAL RADIOGRAPH SCAN — {selectedDiagnosticReport.bodyPart || 'TARGET REGION'}
                </span>
                <img
                  src={selectedDiagnosticReport.imageUrl}
                  alt="Radiograph View"
                  className="max-h-56 mx-auto rounded-lg object-contain border border-slate-800"
                />
              </div>
            )}

            {/* Detailed Findings & Impression */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Radiologist Clinical Findings:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {selectedDiagnosticReport.findings || 'Procedure completed. Findings documented.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs space-y-1">
                <span className="font-bold text-purple-900 uppercase tracking-wider text-[11px] block">
                  Diagnostic Impression:
                </span>
                <p className="text-slate-800 font-semibold leading-relaxed">
                  {selectedDiagnosticReport.impression || 'Study normal.'}
                </p>
              </div>

              {selectedDiagnosticReport.doctorConclusion && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Attending Doctor Counseling & Treatment Plan:</span>
                  </span>
                  <p className="leading-relaxed font-medium">
                    {selectedDiagnosticReport.doctorConclusion}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDiagnosticReport(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: OFFICIAL PHARMACY DISPENSATION RECEIPT                 */}
      {/* ------------------------------------------------------------- */}
      {selectedPrescriptionReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white text-center relative">
              <button
                onClick={() => setSelectedPrescriptionReceipt(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition text-xs font-bold"
              >
                ✕
              </button>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2 border border-white/20">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-black">Official Pharmacy Receipt</h3>
              <p className="text-xs text-emerald-100 mt-0.5">HMS Hospital Management System • Pharmacy Department</p>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Medication Fee Paid</span>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  {Number(selectedPrescriptionReceipt.totalAmount || 0).toFixed(2)} ETB
                </div>
                <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {selectedPrescriptionReceipt.status === 'DISPENSED'
                      ? 'Dispensed & Verified by Pharmacist'
                      : 'Payment Confirmed'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedPrescriptionReceipt.receiptNumber || `RCP-PHARM-${selectedPrescriptionReceipt.prescriptionNumber}`}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Prescription No:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {selectedPrescriptionReceipt.prescriptionNumber}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Patient Name:</span>
                  <span className="font-semibold text-slate-900">
                    {patientRecord?.fullName || user?.fullName}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Patient ID:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {patientRecord?.patientNumber}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Prescribing Doctor:</span>
                  <span className="font-semibold text-slate-900">
                    Dr. {selectedPrescriptionReceipt.doctor?.fullName || 'Attending Physician'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="font-bold text-slate-900">
                    {selectedPrescriptionReceipt.paymentMethod === 'TELEBIRR'
                      ? 'Telebirr (0995774866)'
                      : selectedPrescriptionReceipt.paymentMethod === 'CBE'
                      ? 'CBE (1000305532472)'
                      : 'Pharmacy Cash Counter'}
                  </span>
                </div>
                {selectedPrescriptionReceipt.transactionRef && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Transaction Ref / TXN:</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {selectedPrescriptionReceipt.transactionRef}
                    </span>
                  </div>
                )}
                {selectedPrescriptionReceipt.dispensedAt && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Dispensed Date:</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(selectedPrescriptionReceipt.dispensedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Itemized Table */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Itemized Medications
                </span>
                <div className="space-y-2">
                  {(selectedPrescriptionReceipt.items || []).map((it: any) => (
                    <div key={it.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">{it.drugName || it.medicationName || it.medication?.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {it.dosage} • Qty: {it.quantity} {it.duration ? `• ${it.duration}` : ''}
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-800">
                        {Number(it.totalPrice || 0).toFixed(2)} ETB
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescriptionReceipt.notes && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <span className="font-bold">Pharmacist Counseling: </span>
                  {selectedPrescriptionReceipt.notes}
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedPrescriptionReceipt(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition shadow-md"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
