'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DashboardLayout } from '../../components/DashboardLayout';
import { apiFetch } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import {
  Stethoscope,
  Clock,
  PhoneCall,
  Play,
  CheckCircle,
  SkipForward,
  User,
  Calendar,
  AlertCircle,
  FileEdit,
  Radio,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  Save,
  Volume2,
  Trash2,
  CalendarClock,
  XCircle,
  Scan,
  FileText,
  Activity,
  Send,
  Eye,
  Check,
  Search,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Pill,
  CreditCard,
  Package,
  Plus,
  Building2,
} from 'lucide-react';
import { ClinicalJourneyTimeline } from '../../components/ClinicalJourneyTimeline';

export default function DoctorDashboardPage() {
  const { user, activeMembership, isLoading } = useAuth();
  const router = useRouter();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'queue' | 'xray_dept' | 'prescriptions' | 'appointments' | 'sessions' | 'history'>('queue');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [queueSessions, setQueueSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [selectedTimelineAppt, setSelectedTimelineAppt] = useState<any>(null);

  // Diagnostic Orders state
  const [diagnosticOrders, setDiagnosticOrders] = useState<any[]>([]);
  const [clinicDoctors, setClinicDoctors] = useState<any[]>([]);

  // Prescriptions & Pharmacy State
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);

  // Order X-Ray Modal state (referring doctor)
  const [orderingXRay, setOrderingXRay] = useState(false);
  const [xrayPatientId, setXrayPatientId] = useState('');
  const [xrayPatientName, setXrayPatientName] = useState('');
  const [xrayAppointmentId, setXrayAppointmentId] = useState<string | null>(null);
  const [xrayType, setXrayType] = useState('X_RAY');
  const [xrayTitle, setXrayTitle] = useState('Digital Chest Radiography (PA & Lateral)');
  const [xrayBodyPart, setXrayBodyPart] = useState('Chest PA & Lateral');
  const [xrayUrgency, setXrayUrgency] = useState('NORMAL');
  const [xraySpecialistId, setXraySpecialistId] = useState('');
  const [xrayClinicalNotes, setXrayClinicalNotes] = useState('');
  const [xrayRoomNumber, setXrayRoomNumber] = useState('Room 204 - Radiology & X-Ray Suite');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Specialist Imaging Suite State (documenting scan findings)
  const [recordingOrder, setRecordingOrder] = useState<any>(null);
  const [scanFindings, setScanFindings] = useState('');
  const [scanImpression, setScanImpression] = useState('');
  const [scanRadiologyNotes, setScanRadiologyNotes] = useState('');
  const [scanImageUrl, setScanImageUrl] = useState('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80');
  const [isSubmittingFindings, setIsSubmittingFindings] = useState(false);

  // Specialist Modern Clinical Diagnostic & Treatment Tools State
  const [specialistTool, setSpecialistTool] = useState<'imaging' | 'ecg' | 'analyzer'>('imaging');
  const [imagingFilter, setImagingFilter] = useState<'normal' | 'contrast' | 'invert'>('normal');
  const [imagingZoom, setImagingZoom] = useState<number>(1);

  // Doctor Review & Final Counseling Modal State (returned from X-Ray)
  const [reviewingOrder, setReviewingOrder] = useState<any>(null);
  const [doctorConclusionText, setDoctorConclusionText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Prescribe Medications Modal State (Doctor to Pharmacy)
  const [isPrescribing, setIsPrescribing] = useState(false);
  const [prescribePatientId, setPrescribePatientId] = useState('');
  const [prescribePatientName, setPrescribePatientName] = useState('');
  const [prescribeAppointmentId, setPrescribeAppointmentId] = useState<string | null>(null);
  const [prescribeDiagnosis, setPrescribeDiagnosis] = useState('');
  const [prescribeNotes, setPrescribeNotes] = useState('');
  const [prescribeItems, setPrescribeItems] = useState<any[]>([
    {
      medicationId: '',
      drugName: 'Amoxicillin Trihydrate',
      dosage: '500mg',
      frequency: 'Three times daily after meals',
      duration: '5 days',
      quantity: 15,
      unitPrice: 150.0,
      instructions: 'Take after meals with water',
    },
  ]);
  const [isSubmittingPrescription, setIsSubmittingPrescription] = useState(false);

  // Reschedule appointment state
  const [reschedulingAppt, setReschedulingAppt] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Auth guard
  useEffect(() => {
    if (!isLoading && (!user || (activeMembership?.role !== 'DOCTOR' && activeMembership?.role !== 'ADMIN'))) {
      router.push('/');
    }
  }, [user, activeMembership, isLoading, router]);

  const loadDoctorData = async () => {
    if (!activeMembership?.clinicId) return;

    // Load assigned appointments, diagnostics, doctors, prescriptions, formulary, and sessions
    const [apptRes, sessRes, diagRes, docListRes, rxRes, medRes] = await Promise.all([
      apiFetch('/appointments'),
      apiFetch('/queue/sessions'),
      apiFetch('/diagnostics'),
      apiFetch('/doctors'),
      apiFetch('/pharmacy/prescriptions'),
      apiFetch('/pharmacy/medications'),
    ]);

    if (apptRes.success) {
      setAppointments(apptRes.data.items || []);
    }

    if (diagRes.success) {
      setDiagnosticOrders(diagRes.data.items || []);
    }

    if (rxRes.success) {
      setPrescriptions(rxRes.data.items || []);
    }

    if (medRes.success) {
      setMedications(medRes.data || []);
    }

    if (docListRes.success) {
      setClinicDoctors(docListRes.data || []);
      if (docListRes.data && docListRes.data.length > 0 && !xraySpecialistId) {
        setXraySpecialistId(docListRes.data[0].id);
      }
    }

    if (sessRes.success && sessRes.data.length > 0) {
      setQueueSessions(sessRes.data);
      const current = sessRes.data[0];
      loadSessionDetails(current.id);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    const res = await apiFetch(`/queue/sessions/${sessionId}`);
    if (res.success && res.data) {
      setSelectedSession(res.data);
      const serving = res.data.queueTickets.find((t: any) => t.status === 'SERVING');
      const called = res.data.queueTickets.find((t: any) => t.status === 'CALLED');
      const current = serving || called || null;
      setActiveTicket(current);
      if (current?.appointment?.internalNotes) {
        setNotes(current.appointment.internalNotes);
      }
    }
  };

  useEffect(() => {
    if (activeMembership?.clinicId) {
      loadDoctorData();

      const socket = getSocket();
      socket.on('queue:ticket-created', () => {
        if (selectedSession) loadSessionDetails(selectedSession.id);
      });
      socket.on('queue:ticket-called', () => {
        if (selectedSession) loadSessionDetails(selectedSession.id);
      });
      socket.on('queue:ticket-serving', () => {
        if (selectedSession) loadSessionDetails(selectedSession.id);
      });
      socket.on('queue:ticket-completed', () => {
        if (selectedSession) loadSessionDetails(selectedSession.id);
      });

      return () => {
        socket.off('queue:ticket-created');
        socket.off('queue:ticket-called');
        socket.off('queue:ticket-serving');
        socket.off('queue:ticket-completed');
      };
    }
  }, [activeMembership, selectedSession?.id]);

  // Queue actions
  const handleCallTicket = async (ticketId: string) => {
    setStatusMsg('');
    const res = await apiFetch(`/queue/tickets/${ticketId}/call`, { method: 'POST' });
    if (res.success) {
      setStatusMsg(`Patient called! Token: ${res.data.displayToken}`);
      loadSessionDetails(selectedSession.id);
    } else {
      setStatusMsg(`Error: ${res.error?.message}`);
    }
  };

  const handleStartConsultation = async (ticketId: string) => {
    setStatusMsg('');
    const res = await apiFetch(`/queue/tickets/${ticketId}/serve`, { method: 'POST' });
    if (res.success) {
      setStatusMsg(`Consultation started for ticket ${res.data.displayToken}`);
      loadSessionDetails(selectedSession.id);
    } else {
      setStatusMsg(`Error: ${res.error?.message}`);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeTicket?.appointmentId) {
      setStatusMsg('Draft saved in memory (Walk-in without appointment record).');
      return;
    }
    setSavingNotes(true);
    const res = await apiFetch(`/appointments/${activeTicket.appointmentId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ internalNotes: notes }),
    });
    setSavingNotes(false);
    if (res.success) {
      setStatusMsg('Clinical notes permanently saved to database!');
    } else {
      setStatusMsg(`Error saving notes: ${res.error?.message}`);
    }
  };

  const handleCompleteConsultation = async (ticketId: string) => {
    setStatusMsg('');
    if (activeTicket?.appointmentId && notes) {
      await apiFetch(`/appointments/${activeTicket.appointmentId}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ internalNotes: notes }),
      });
    }

    const res = await apiFetch(`/queue/tickets/${ticketId}/complete`, { method: 'POST' });
    if (res.success) {
      setStatusMsg(`Consultation completed for ticket ${res.data.displayToken}`);
      setActiveTicket(null);
      setNotes('');
      loadSessionDetails(selectedSession.id);
      loadDoctorData();
    } else {
      setStatusMsg(`Error: ${res.error?.message}`);
    }
  };

  const handleSkipTicket = async (ticketId: string) => {
    setStatusMsg('');
    const res = await apiFetch(`/queue/tickets/${ticketId}/skip`, { method: 'POST' });
    if (res.success) {
      setStatusMsg(`Ticket skipped.`);
      setActiveTicket(null);
      loadSessionDetails(selectedSession.id);
    } else {
      setStatusMsg(`Error: ${res.error?.message}`);
    }
  };

  const handleRecallTicket = async (ticketId: string) => {
    setStatusMsg('');
    const res = await apiFetch(`/queue/tickets/${ticketId}/recall`, { method: 'POST' });
    if (res.success) {
      setStatusMsg(`Patient recalled to counter! Token: ${res.data.displayToken}`);
      loadSessionDetails(selectedSession.id);
    } else {
      setStatusMsg(`Error recalling patient: ${res.error?.message}`);
    }
  };

  const handleCancelTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to cancel this waiting ticket?')) return;
    setStatusMsg('');
    const res = await apiFetch(`/queue/tickets/${ticketId}/cancel`, { method: 'POST' });
    if (res.success) {
      setStatusMsg(`Ticket cancelled.`);
      loadSessionDetails(selectedSession.id);
    } else {
      setStatusMsg(`Error cancelling ticket: ${res.error?.message}`);
    }
  };

  // --------------------------------------------------------------------------
  // DIAGNOSTIC WORKFLOW: ORDERING X-RAY (Referring Doctor)
  // --------------------------------------------------------------------------
  const openOrderXRayModal = (patientId: string, patientName: string, appointmentId?: string) => {
    setXrayPatientId(patientId);
    setXrayPatientName(patientName);
    setXrayAppointmentId(appointmentId || null);
    setXrayType('X_RAY');
    setXrayTitle('Digital Chest Radiography (PA & Lateral)');
    setXrayBodyPart('Chest PA & Lateral');
    setXrayUrgency('NORMAL');
    setXrayClinicalNotes('Cough and pleuritic pain. Rule out consolidation, pneumothorax, or effusion.');
    setOrderingXRay(true);
  };

  const handleSubmitOrderXRay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xrayPatientId || !xrayTitle) return;
    setIsSubmittingOrder(true);

    const res = await apiFetch('/diagnostics', {
      method: 'POST',
      body: JSON.stringify({
        patientId: xrayPatientId,
        appointmentId: xrayAppointmentId || undefined,
        specialistId: xraySpecialistId || undefined,
        type: xrayType,
        title: xrayTitle,
        bodyPart: xrayBodyPart,
        clinicalNotes: xrayClinicalNotes,
        roomNumber: xrayRoomNumber,
        diagnosticDept: xrayType === 'LAB_TEST' ? 'Clinical Laboratory' : 'Specialist Radiology',
        urgency: xrayUrgency,
      }),
    });

    setIsSubmittingOrder(false);
    if (res.success) {
      setStatusMsg(`Diagnostic Referral Ordered: "${xrayTitle}"! Patient routed to ${xrayRoomNumber}.`);
      setOrderingXRay(false);
      loadDoctorData();
      if (selectedSession) loadSessionDetails(selectedSession.id);
    } else {
      alert(`Error ordering diagnostic: ${res.error?.message}`);
    }
  };

  // --------------------------------------------------------------------------
  // DIAGNOSTIC WORKFLOW: RADIOLOGY SPECIALIST SUITE
  // --------------------------------------------------------------------------
  const handleStartScan = async (orderId: string) => {
    const res = await apiFetch(`/diagnostics/${orderId}/start`, { method: 'PATCH' });
    if (res.success) {
      setStatusMsg('Imaging scan started (Status: IN_PROGRESS).');
      loadDoctorData();
    } else {
      alert(`Error starting scan: ${res.error?.message}`);
    }
  };

  const openDocumentFindingsModal = (order: any) => {
    setRecordingOrder(order);
    if (order.type === 'ECG') {
      setSpecialistTool('ecg');
      setScanFindings(order.findings || '12-lead Electrocardiogram (ECG): Normal sinus rhythm. Heart rate 72 bpm. PR interval 160ms, QRS duration 88ms, QTc 412ms. Normal axis. No ST-segment elevation or depression, no pathological Q waves.');
      setScanImpression(order.impression || 'Normal 12-lead ECG study. Normal sinus rhythm without acute ischemic patterns or conduction delays.');
    } else if (order.type === 'LAB_TEST') {
      setSpecialistTool('analyzer');
      setScanFindings(order.findings || 'Pathology & Blood Chemistry Panel:\n• WBC: 6.8 x10^3/uL (Normal: 4.5-11.0)\n• RBC: 4.9 x10^6/uL (Normal: 4.3-5.9)\n• Hemoglobin: 14.5 g/dL (Normal: 13.5-17.5)\n• Platelets: 245 x10^3/uL (Normal: 150-450)\n• Fasting Blood Glucose: 96 mg/dL (Normal: 70-100)\n• Creatinine: 0.9 mg/dL (Normal: 0.7-1.3)');
      setScanImpression(order.impression || 'Complete blood count and biochemical metabolic panel within physiological normal parameters.');
    } else {
      setSpecialistTool('imaging');
      setScanFindings(
        order.findings ||
          `Anatomical examination of ${order.bodyPart || 'target region'} shows normal osseous structures. No focal radiopaque foreign body, fracture, or joint dislocation identified. Soft tissue planes preserved.`
      );
      setScanImpression(
        order.impression ||
          `No acute radiographic abnormality of ${order.bodyPart || 'target anatomical region'}. Normal study.`
      );
    }
    setScanRadiologyNotes(order.radiologyNotes || 'Multi-view digital radiograph acquired with standard exposure parameters.');
    setScanImageUrl(
      order.imageUrl || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    );
  };

  const handleSubmitScanFindings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingOrder || !scanFindings || !scanImpression) return;
    setIsSubmittingFindings(true);

    const res = await apiFetch(`/diagnostics/${recordingOrder.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        findings: scanFindings,
        impression: scanImpression,
        radiologyNotes: scanRadiologyNotes || undefined,
        imageUrl: scanImageUrl || undefined,
      }),
    });

    setIsSubmittingFindings(false);
    if (res.success) {
      setStatusMsg('Specialist Diagnostic Report finalized! Patient and findings returned to attending doctor for counseling.');
      setRecordingOrder(null);
      loadDoctorData();
      if (selectedSession) loadSessionDetails(selectedSession.id);
    } else {
      alert(`Error documenting report: ${res.error?.message}`);
    }
  };

  // --------------------------------------------------------------------------
  // DIAGNOSTIC WORKFLOW: DOCTOR FINAL COUNSELING & DISCHARGE (Returned Patient)
  // --------------------------------------------------------------------------
  const openReviewModal = (order: any) => {
    setReviewingOrder(order);
    setDoctorConclusionText(
      order.doctorConclusion ||
        `Patient counseled on specialist / laboratory findings (${order.impression || 'normal physiological findings'}). Prescribing targeted therapeutic medication. Advised on adequate rest and 2-week outpatient follow-up.`
    );
  };

  const handleSubmitDoctorReview = async (e?: React.FormEvent): Promise<any> => {
    if (e && e.preventDefault) e.preventDefault();
    if (!reviewingOrder || !doctorConclusionText) return null;
    setIsSubmittingReview(true);

    const res = await apiFetch(`/diagnostics/${reviewingOrder.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        doctorConclusion: doctorConclusionText,
        completeAppointment: true,
      }),
    });

    setIsSubmittingReview(false);
    if (res.success) {
      setStatusMsg(`Patient counseled on diagnostic results and consultation finalized!`);
      const finishedOrder = reviewingOrder;
      setReviewingOrder(null);
      setDoctorConclusionText('');
      loadDoctorData();
      if (selectedSession) loadSessionDetails(selectedSession.id);
      return finishedOrder;
    } else {
      alert(`Error completing review: ${res.error?.message}`);
      return null;
    }
  };

  // --------------------------------------------------------------------------
  // PHARMACY WORKFLOW: PRESCRIBING DRUGS & SENDING TO PHARMACY
  // --------------------------------------------------------------------------
  const openPrescribeModal = (patientId: string, patientName: string, appointmentId?: string) => {
    setPrescribePatientId(patientId);
    setPrescribePatientName(patientName);
    setPrescribeAppointmentId(appointmentId || null);
    setPrescribeDiagnosis(notes ? `Clinical diagnosis from consultation: ${notes.slice(0, 80)}` : 'Acute Infection / Symptomatic Relief');
    setPrescribeNotes('Patient advised to take medications as instructed with food and adequate hydration.');

    // Pre-populate with first available medication or default Amoxicillin
    if (medications.length > 0) {
      const first = medications[0];
      setPrescribeItems([
        {
          medicationId: first.id,
          drugName: first.name,
          dosage: first.strength,
          frequency: 'Three times daily after meals',
          duration: '5 days',
          quantity: 15,
          unitPrice: Number(first.unitPrice),
          instructions: 'Take after meals with water',
        },
      ]);
    } else {
      setPrescribeItems([
        {
          medicationId: '',
          drugName: 'Amoxicillin Trihydrate',
          dosage: '500mg',
          frequency: 'Three times daily after meals',
          duration: '5 days',
          quantity: 15,
          unitPrice: 150.0,
          instructions: 'Take after meals with water',
        },
      ]);
    }
    setIsPrescribing(true);
  };

  const handleAddPrescriptionItem = () => {
    if (medications.length > 0) {
      const med = medications[prescribeItems.length % medications.length] || medications[0];
      setPrescribeItems([
        ...prescribeItems,
        {
          medicationId: med.id,
          drugName: med.name,
          dosage: med.strength,
          frequency: 'Twice daily after meals',
          duration: '5 days',
          quantity: 10,
          unitPrice: Number(med.unitPrice),
          instructions: 'Take as directed',
        },
      ]);
    } else {
      setPrescribeItems([
        ...prescribeItems,
        {
          medicationId: '',
          drugName: 'Paracetamol Extra',
          dosage: '500mg',
          frequency: 'Every 6-8 hours as needed',
          duration: '3 days',
          quantity: 10,
          unitPrice: 40.0,
          instructions: 'Take as needed for pain',
        },
      ]);
    }
  };

  const handleRemovePrescriptionItem = (index: number) => {
    if (prescribeItems.length <= 1) return;
    setPrescribeItems(prescribeItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...prescribeItems];
    updated[index] = { ...updated[index], [field]: value };

    // If medication selected from formulary, auto-fill unitPrice, name, strength
    if (field === 'medicationId') {
      const selectedMed = medications.find((m) => m.id === value);
      if (selectedMed) {
        updated[index].drugName = selectedMed.name;
        updated[index].dosage = selectedMed.strength;
        updated[index].unitPrice = Number(selectedMed.unitPrice);
      }
    }

    setPrescribeItems(updated);
  };

  const calculatePrescriptionTotal = () => {
    return prescribeItems.reduce((acc, item) => acc + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1), 0);
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescribePatientId || prescribeItems.length === 0) return;
    setIsSubmittingPrescription(true);

    const res = await apiFetch('/pharmacy/prescriptions', {
      method: 'POST',
      body: JSON.stringify({
        patientId: prescribePatientId,
        appointmentId: prescribeAppointmentId || undefined,
        diagnosis: prescribeDiagnosis,
        notes: prescribeNotes,
        roomNumber: 'Room 105 - Central Pharmacy',
        items: prescribeItems.map((item) => ({
          medicationId: item.medicationId || undefined,
          drugName: item.drugName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          instructions: item.instructions || undefined,
        })),
      }),
    });

    setIsSubmittingPrescription(false);
    if (res.success) {
      setStatusMsg(`Prescription ${res.data.prescriptionNumber} created! Patient routed to Room 105 Central Pharmacy (Total: ${calculatePrescriptionTotal().toFixed(2)} ETB).`);
      setIsPrescribing(false);
      loadDoctorData();
      if (selectedSession) loadSessionDetails(selectedSession.id);
    } else {
      alert(`Error creating prescription: ${res.error?.message}`);
    }
  };

  // Appointment management
  const handleCancelDoctorAppointment = async (id: string) => {
    const reason = prompt('Please enter cancellation reason:', 'Physician schedule adjustment');
    if (!reason) return;
    const res = await apiFetch(`/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellationReason: reason }),
    });
    if (res.success) {
      alert('Appointment cancelled.');
      loadDoctorData();
    } else {
      alert(`Error cancelling appointment: ${res.error?.message}`);
    }
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingAppt || !rescheduleDate) return;
    const res = await apiFetch(`/appointments/${reschedulingAppt.id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({
        scheduledStartAt: new Date(rescheduleDate).toISOString(),
        reason: rescheduleReason || 'Doctor rescheduled visit',
      }),
    });
    if (res.success) {
      alert('Appointment successfully rescheduled!');
      setReschedulingAppt(null);
      setRescheduleDate('');
      setRescheduleReason('');
      loadDoctorData();
    } else {
      alert(`Error rescheduling appointment: ${res.error?.message}`);
    }
  };

  if (isLoading || !user) {
    return <div className="p-10 text-center text-slate-500">Loading Doctor Console...</div>;
  }

  const waitingTickets = selectedSession?.queueTickets.filter((t: any) => t.status === 'WAITING') || [];
  const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');

  // Diagnostic Queues:
  const returnedFromXRay = diagnosticOrders.filter((d) => d.status === 'COMPLETED');
  const pendingXRayScans = diagnosticOrders.filter((d) => d.status === 'REQUESTED' || d.status === 'IN_PROGRESS');

  return (
    <DashboardLayout
      roleTitle="Hospital Physician Practice"
      roleBadge="🩺 Attending Physician"
      roleColor="emerald"
      activeItemId={activeTab}
      onSelectNav={(id) => setActiveTab(id as any)}
      headerTitle={
        activeTab === 'queue'
          ? 'Live Patient Consultation & Referral Console'
          : activeTab === 'xray_dept'
          ? 'Specialist X-Ray & Diagnostic Imaging Suite'
          : activeTab === 'prescriptions'
          ? 'Hospital Pharmacy Prescriptions & Orders'
          : activeTab === 'appointments'
          ? 'Assigned Patient Schedule'
          : activeTab === 'sessions'
          ? 'Active Queue Sessions'
          : 'Consultation & Clinical History'
      }
      headerSubtitle={`Hospital: ${activeMembership?.clinicName || 'Central Hospital'} • Physician: ${user.fullName}`}
      headerActions={
        <div className="flex items-center space-x-2">
          {statusMsg && (
            <span className="hidden sm:inline-block px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 animate-fadeIn">
              {statusMsg}
            </span>
          )}
          <button
            onClick={loadDoctorData}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      }
      navGroups={[
        {
          groupLabel: 'Hospital Physician Practice',
          items: [
            {
              id: 'queue',
              label: 'Consultation Queue',
              icon: Stethoscope,
              badge: waitingTickets.length + returnedFromXRay.length,
              badgeColor: returnedFromXRay.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
            },
            {
              id: 'xray_dept',
              label: 'Specialist X-Ray Room',
              icon: Scan,
              badge: pendingXRayScans.length,
              badgeColor: 'bg-purple-100 text-purple-800',
            },
            {
              id: 'prescriptions',
              label: 'Prescriptions Sent',
              icon: Pill,
              badge: prescriptions.length,
              badgeColor: 'bg-teal-100 text-teal-800',
            },
            {
              id: 'appointments',
              label: 'My Schedule',
              icon: Calendar,
              badge: appointments.length,
            },
            {
              id: 'sessions',
              label: 'Queue Sessions',
              icon: Clock,
            },
            {
              id: 'history',
              label: 'Consultation History',
              icon: CheckCircle2,
              badge: completedAppointments.length,
            },
          ],
        },
      ]}
    >
      {/* =========================================================================
          VIEW 1: CONSULTATION QUEUE & RETURNED X-RAY SECTION
          ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* BANNER: Returned from X-Ray Waiting for Final Doctor Counseling */}
          {returnedFromXRay.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50 border border-amber-200/90 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                    <Scan className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>Returned from Specialist X-Ray — Ready for Doctor Counseling</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase">
                        {returnedFromXRay.length} Patient{returnedFromXRay.length > 1 ? 's' : ''} Waiting
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Radiology findings documented by specialist. Conduct final counseling and discharge patient.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {returnedFromXRay.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-sm flex items-center justify-between hover:border-amber-300 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{order.patient?.fullName}</span>
                        <span className="font-mono text-[11px] text-slate-500">{order.patient?.patientNumber}</span>
                        {order.urgency !== 'NORMAL' && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                            {order.urgency}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-amber-900 font-medium flex items-center gap-1.5">
                        <Scan className="w-3.5 h-3.5 text-amber-600" />
                        <span>{order.title} ({order.bodyPart || 'X-Ray'})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 italic max-w-sm truncate">
                        Impression: {order.impression || 'Radiology report documented'}
                      </div>
                    </div>

                    <button
                      onClick={() => openReviewModal(order)}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review & Counsel</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consultation Room & Waiting Line Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1 & 2: Active Patient Consultation */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-emerald-600" />
                    <span>Current In-Room Patient Consultation</span>
                  </h2>
                  {activeTicket && (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        activeTicket.status === 'SERVING'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      STATUS: {activeTicket.status}
                    </span>
                  )}
                </div>

                {activeTicket ? (
                  <div className="space-y-6">
                    {/* Token & Patient Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-3xl font-extrabold text-blue-600 font-mono tracking-tight">
                            {activeTicket.displayToken}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                            {activeTicket.patient?.patientNumber || 'WALK-IN'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">
                          {activeTicket.patient?.fullName || 'Walk-in Patient'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Phone: {activeTicket.patient?.phone} • Priority: {activeTicket.priority}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {activeTicket.status === 'CALLED' && (
                          <button
                            onClick={() => handleStartConsultation(activeTicket.id)}
                            className="flex items-center space-x-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm"
                          >
                            <Play className="h-4 w-4" />
                            <span>Start Consultation</span>
                          </button>
                        )}

                        {activeTicket.status === 'SERVING' && (
                          <>
                            {/* Prominent Referral to Specialist X-Ray Button */}
                            <button
                              onClick={() =>
                                openOrderXRayModal(
                                  activeTicket.patientId,
                                  activeTicket.patient?.fullName || 'Patient',
                                  activeTicket.appointmentId
                                )
                              }
                              className="flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-sm"
                            >
                              <Scan className="h-4 w-4" />
                              <span>⚡ Refer to X-Ray</span>
                            </button>

                            {/* Prominent Prescribe Medications / Send to Pharmacy Button */}
                            <button
                              onClick={() =>
                                openPrescribeModal(
                                  activeTicket.patientId,
                                  activeTicket.patient?.fullName || 'Patient',
                                  activeTicket.appointmentId
                                )
                              }
                              className="flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-sm"
                            >
                              <Pill className="h-4 w-4" />
                              <span>💊 Prescribe Drugs / Pharmacy</span>
                            </button>

                            <button
                              onClick={() => handleCompleteConsultation(activeTicket.id)}
                              className="flex items-center space-x-1.5 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Complete Visit</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleRecallTicket(activeTicket.id)}
                          className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition"
                          title="Re-broadcast announcement to waiting room"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>Recall</span>
                        </button>

                        <button
                          onClick={() => handleSkipTicket(activeTicket.id)}
                          className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition"
                        >
                          <SkipForward className="h-3.5 w-3.5" />
                          <span>Skip</span>
                        </button>
                      </div>
                    </div>

                    {/* Private Clinical Notes */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileEdit className="h-4 w-4 text-emerald-600" />
                          <span>Confidential Doctor Consultation Notes (Persisted to Database)</span>
                        </span>
                        {activeTicket.patientId && (
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() =>
                                openOrderXRayModal(
                                  activeTicket.patientId,
                                  activeTicket.patient?.fullName || 'Patient',
                                  activeTicket.appointmentId
                                )
                              }
                              className="text-[11px] text-purple-700 hover:underline font-semibold flex items-center gap-1"
                            >
                              <Scan className="w-3 h-3" />
                              <span>Order X-Ray</span>
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() =>
                                openPrescribeModal(
                                  activeTicket.patientId,
                                  activeTicket.patient?.fullName || 'Patient',
                                  activeTicket.appointmentId
                                )
                              }
                              className="text-[11px] text-teal-700 hover:underline font-semibold flex items-center gap-1"
                            >
                              <Pill className="w-3 h-3" />
                              <span>Prescribe Drugs</span>
                            </button>
                          </div>
                        )}
                      </label>
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter primary symptoms, vital signs, differential diagnosis, physical findings..."
                        className="w-full text-xs p-3 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 bg-white"
                      />
                      <div className="mt-2 flex justify-between items-center text-[11px] text-slate-500">
                        <span>Attending physician notes linked directly to patient medical chart.</span>
                        <button
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                          className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1 shadow-sm"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingNotes ? 'Saving...' : 'Save Notes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <User className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-slate-700">No Patient In Consultation Room</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Call the next patient from the waiting line on the right to start consultation.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Waiting Queue Line */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col h-fit">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  <span>Waiting Line ({waitingTickets.length})</span>
                </h2>
              </div>

              {waitingTickets.length > 0 ? (
                <div className="space-y-3">
                  {waitingTickets.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/40 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">{t.displayToken}</span>
                          {t.priority !== 'NORMAL' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              {t.priority}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-700 font-medium block">
                          {t.patient?.fullName || 'Walk-in Patient'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {t.patient?.patientNumber || ''}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleCallTicket(t.id)}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition flex items-center space-x-1 shadow-sm"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                          <span>Call</span>
                        </button>
                        <button
                          onClick={() => handleCancelTicket(t.id)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                          title="Cancel ticket"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No patients currently waiting in line.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: SPECIALIST X-RAY ROOM
          ========================================================================= */}
      {activeTab === 'xray_dept' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scan className="w-5 h-5 text-purple-600" />
                  <span>Specialist Diagnostic & X-Ray Imaging Operations Suite</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Process orders referred by primary doctors, conduct imaging, record radiology findings, and return results to doctor.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Total Orders: {diagnosticOrders.length}
                </span>
              </div>
            </div>

            {/* Diagnostic Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] text-slate-400 uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Study / Procedure</th>
                    <th className="py-2.5 px-4 font-semibold">Patient</th>
                    <th className="py-2.5 px-4 font-semibold">Referring Doctor</th>
                    <th className="py-2.5 px-4 font-semibold">Clinical Indication</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Radiology Findings</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Specialist Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {diagnosticOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                        No diagnostic orders in database. Orders created during consultations will appear here.
                      </td>
                    </tr>
                  ) : (
                    diagnosticOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <Scan className="w-3.5 h-3.5 text-purple-600" />
                            <span>{order.title}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Area: {order.bodyPart || 'Unspecified'} • {order.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 text-xs">
                          {order.patient?.fullName}
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {order.patient?.patientNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {order.referringDoctor?.fullName || 'Attending Physician'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                          {order.clinicalNotes || 'Diagnostic evaluation'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              order.status === 'REQUESTED'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : order.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'COMPLETED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {order.status === 'COMPLETED' ? 'RETURNED TO DR' : order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                          {order.impression || order.findings || 'Pending imaging scan'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {order.status === 'REQUESTED' && (
                            <button
                              onClick={() => handleStartScan(order.id)}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              Start Scan
                            </button>
                          )}

                          {order.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => openDocumentFindingsModal(order)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              Record Findings & Return
                            </button>
                          )}

                          {order.status === 'COMPLETED' && (
                            <button
                              onClick={() => openReviewModal(order)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              Doctor Review
                            </button>
                          )}

                          {order.status === 'REVIEWED' && (
                            <button
                              onClick={() => openReviewModal(order)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                            >
                              View Final Chart
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: HOSPITAL PRESCRIPTIONS SENT TO PHARMACY
          ========================================================================= */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600" />
                <span>Hospital Prescriptions & Pharmacy Dispensation Status</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track status of medications prescribed to patients, payment status in Birr, and pharmacy pickups.
              </p>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 w-fit">
              Total Prescriptions: {prescriptions.length}
            </span>
          </div>

          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No prescriptions created yet. Use &quot;Prescribe Drugs&quot; during patient consultations.
              </div>
            ) : (
              prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-teal-800">{rx.prescriptionNumber}</span>
                        <strong className="text-slate-900 text-sm">{rx.patient?.fullName}</strong>
                        <span className="font-mono text-xs text-slate-400">({rx.patient?.patientNumber})</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            rx.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : rx.status === 'PAID'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rx.status === 'PENDING' ? 'AWAITING PHARMACY PAYMENT' : rx.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Diagnosis: <strong className="text-slate-800">{rx.diagnosis}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Medication Total</span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {Number(rx.totalAmount).toFixed(2)} ETB
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                        Prescribed Medications:
                      </span>
                      {(rx.items || []).map((item: any) => (
                        <div key={item.id} className="text-slate-700 flex justify-between bg-white p-1.5 rounded-lg border border-slate-200/80">
                          <span>
                            • {item.drugName} ({item.dosage}) — {item.frequency}
                          </span>
                          <span className="font-mono font-bold text-slate-800">{Number(item.totalPrice).toFixed(0)} ETB</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                        Pharmacy Payment & Dispensation:
                      </span>
                      <div className="text-slate-600">
                        Payment: <strong>{rx.paymentStatus}</strong> {rx.paymentMethod ? `via ${rx.paymentMethod}` : ''}
                      </div>
                      {rx.receiptNumber && (
                        <div className="text-slate-600 font-mono text-[11px]">
                          Receipt: {rx.receiptNumber}
                        </div>
                      )}
                      {rx.dispensationNotes && (
                        <div className="text-emerald-800 font-medium mt-1">
                          Pharmacist: {rx.dispensationNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: APPOINTMENTS SCHEDULE
          ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <span>Assigned Patient Schedule ({appointments.length})</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-400 uppercase border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Appointment #</th>
                  <th className="py-2.5 px-4 font-semibold">Patient</th>
                  <th className="py-2.5 px-4 font-semibold">Service</th>
                  <th className="py-2.5 px-4 font-semibold">Scheduled Time</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Internal Notes</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No appointments assigned for today.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 text-xs">
                        {appt.appointmentNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {appt.patient?.fullName}
                        <span className="text-[11px] text-slate-400 block font-mono">{appt.patient?.patientNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-xs">{appt.service?.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {new Date(appt.scheduledStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {appt.internalNotes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() =>
                            openPrescribeModal(appt.patientId, appt.patient?.fullName, appt.id)
                          }
                          className="text-[11px] px-2 py-1 rounded-lg border border-teal-200 hover:bg-teal-50 text-teal-700 font-semibold transition"
                        >
                          Prescribe
                        </button>
                        <button
                          onClick={() =>
                            openOrderXRayModal(appt.patientId, appt.patient?.fullName, appt.id)
                          }
                          className="text-[11px] px-2 py-1 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-700 font-semibold transition"
                        >
                          Order X-Ray
                        </button>
                        {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                          <>
                            <button
                              onClick={() => {
                                setReschedulingAppt(appt);
                                setRescheduleDate(
                                  appt.scheduledStartAt
                                    ? new Date(appt.scheduledStartAt).toISOString().slice(0, 16)
                                    : ''
                                );
                              }}
                              className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleCancelDoctorAppointment(appt.id)}
                              className="text-[11px] px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: SESSIONS
          ========================================================================= */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {queueSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900 text-sm">Session #{session.id.slice(0, 8)}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  {session.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>Date: {new Date(session.operatingDate || session.date).toLocaleDateString()}</div>
                <div>Tickets: {session.queueTickets?.length || 0}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          VIEW 6: CONSULTATION HISTORY
          ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Completed Patient Visits & Diagnostic Charts ({completedAppointments.length})</span>
          </h2>

          <div className="space-y-3">
            {completedAppointments.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No completed consultations yet today.
              </div>
            ) : (
              completedAppointments.map((appt) => (
                <div key={appt.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{appt.patient?.fullName}</span>
                    <span className="font-mono text-xs text-slate-500">{appt.appointmentNumber}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Service: {appt.service?.name} • Completed at: {new Date(appt.updatedAt).toLocaleTimeString()}
                  </div>
                  {appt.internalNotes && (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap">
                      <strong>Clinical Chart:</strong>
                      <br />
                      {appt.internalNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: PRESCRIBE MEDICATIONS & SEND TO PHARMACY
          ========================================================================= */}
      {isPrescribing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-800">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Prescribe Medications / Send to Pharmacy</h3>
                  <p className="text-xs text-slate-500">Order drugs from hospital formulary with prices in Birr</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrescribing(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPrescription} className="space-y-4 text-xs">
              <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Patient:</span>
                  <span className="font-bold text-slate-900 text-sm">{prescribePatientName}</span>
                </div>
                <div className="text-right">
                  <span className="text-teal-800 font-semibold block uppercase text-[10px]">Estimated Total</span>
                  <span className="font-mono font-black text-teal-900 text-base">
                    {calculatePrescriptionTotal().toFixed(2)} ETB
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  value={prescribeDiagnosis}
                  onChange={(e) => setPrescribeDiagnosis(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500 font-medium"
                  placeholder="e.g. Acute Bronchitis, Knee Joint Synovitis..."
                />
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Prescribed Drugs & Dosages
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPrescriptionItem}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Drug</span>
                  </button>
                </div>

                {prescribeItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-xs">Medication #{idx + 1}</span>
                      {prescribeItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePrescriptionItem(idx)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Select from Hospital Drug Formulary
                        </label>
                        <select
                          value={item.medicationId}
                          onChange={(e) => handleUpdateItem(idx, 'medicationId', e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-2 outline-none focus:border-teal-500 bg-white"
                        >
                          <option value="">Custom Drug (type manually below)</option>
                          {medications.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.strength}, {m.dosageForm}) — {Number(m.unitPrice).toFixed(0)} ETB
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Drug Name</label>
                        <input
                          type="text"
                          required
                          value={item.drugName}
                          onChange={(e) => handleUpdateItem(idx, 'drugName', e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-2 outline-none focus:border-teal-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Dosage</label>
                        <input
                          type="text"
                          required
                          value={item.dosage}
                          onChange={(e) => handleUpdateItem(idx, 'dosage', e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-2 outline-none focus:border-teal-500"
                          placeholder="e.g. 500mg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Frequency</label>
                        <input
                          type="text"
                          required
                          value={item.frequency}
                          onChange={(e) => handleUpdateItem(idx, 'frequency', e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-2 outline-none focus:border-teal-500"
                          placeholder="e.g. 3x daily"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Duration</label>
                        <input
                          type="text"
                          required
                          value={item.duration}
                          onChange={(e) => handleUpdateItem(idx, 'duration', e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-2 outline-none focus:border-teal-500"
                          placeholder="e.g. 5 days"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Qty & Price (Birr)
                        </label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                            className="w-16 border border-slate-200 rounded-xl p-2 outline-none focus:border-teal-500 font-mono text-center"
                          />
                          <span className="text-slate-400">@</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            required
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                            className="w-20 border border-slate-200 rounded-xl p-2 outline-none focus:border-teal-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Patient Instructions
                      </label>
                      <input
                        type="text"
                        value={item.instructions || ''}
                        onChange={(e) => handleUpdateItem(idx, 'instructions', e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2 outline-none focus:border-teal-500 text-slate-700"
                        placeholder="e.g. Take with water after meals. Do not drink alcohol."
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Doctor Remarks / Pharmacist Notes</label>
                <textarea
                  rows={2}
                  value={prescribeNotes}
                  onChange={(e) => setPrescribeNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500"
                  placeholder="Additional instructions for patient or pharmacist..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPrescribing(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPrescription}
                  className="px-5 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-sm flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmittingPrescription ? 'Sending...' : `Send Prescription to Pharmacy (${calculatePrescriptionTotal().toFixed(0)} ETB)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: REFERRAL / ORDER X-RAY (Referring Doctor)
          ========================================================================= */}
      {orderingXRay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmitOrderXRay}
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Refer Patient to Specialist / Laboratory Room</h3>
                  <p className="text-xs text-slate-500">Order diagnostic investigation and assign patient to specialist room</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderingXRay(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-1 space-y-4 text-left">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-semibold">Patient Name:</span>
                  <span className="text-sm font-bold text-slate-900">{xrayPatientName}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-bold">
                  SPECIALIST REFERRAL
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnostic Investigation Title</label>
                <input
                  type="text"
                  required
                  value={xrayTitle}
                  onChange={(e) => setXrayTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500"
                  placeholder="e.g. Digital Chest Radiography (PA & Lateral) or Full Blood Count (CBC)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Investigation Modality</label>
                  <select
                    value={xrayType}
                    onChange={(e) => {
                      setXrayType(e.target.value);
                      if (e.target.value === 'LAB_TEST') {
                        setXrayRoomNumber('Room 108 - Pathology & Clinical Laboratory');
                        setXrayTitle('Comprehensive Blood Chemistry & CBC');
                      } else {
                        setXrayRoomNumber('Room 204 - Radiology & X-Ray Suite');
                        setXrayTitle('Digital Chest Radiography (PA & Lateral)');
                      }
                    }}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500 bg-white font-medium"
                  >
                    <option value="X_RAY">X-Ray (Digital Radiography)</option>
                    <option value="LAB_TEST">Lab Diagnostic (Pathology/Blood)</option>
                    <option value="ULTRASOUND">Ultrasound (Sonography)</option>
                    <option value="CT_SCAN">CT Scan</option>
                    <option value="MRI">MRI Scan</option>
                    <option value="ECG">ECG Tracing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Priority</label>
                  <select
                    value={xrayUrgency}
                    onChange={(e) => setXrayUrgency(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500 bg-white"
                  >
                    <option value="NORMAL">Normal / Routine</option>
                    <option value="URGENT">Urgent (Triage High)</option>
                    <option value="VIP">VIP Fast-Track</option>
                    <option value="EMERGENCY">Emergency Priority</option>
                  </select>
                </div>
              </div>

              {/* Target Specialist / Laboratory Room */}
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  Assign Specialist / Laboratory Room
                </label>
                <select
                  value={xrayRoomNumber}
                  onChange={(e) => setXrayRoomNumber(e.target.value)}
                  className="w-full text-xs border border-purple-300 rounded-xl p-2.5 outline-none focus:border-purple-600 bg-purple-50/50 font-bold text-purple-900"
                >
                  <option value="Room 204 - Radiology & X-Ray Suite">Room 204 - Radiology & X-Ray Suite</option>
                  <option value="Room 108 - Pathology & Clinical Laboratory">Room 108 - Pathology & Clinical Laboratory</option>
                  <option value="Room 206 - Ultrasound & Sonography Suite">Room 206 - Ultrasound & Sonography Suite</option>
                  <option value="Room 208 - Advanced CT/MRI Imaging">Room 208 - Advanced CT/MRI Imaging</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Patient will be directed to this room for diagnostic procedure. Upon completion, specialist will return patient to your consultation room.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Anatomical Region / Sample</label>
                <input
                  type="text"
                  required
                  value={xrayBodyPart}
                  onChange={(e) => setXrayBodyPart(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500"
                  placeholder="e.g. Chest PA & Lateral, Blood Venipuncture, Lumbar Spine"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialist / Department (Optional)</label>
                <select
                  value={xraySpecialistId}
                  onChange={(e) => setXraySpecialistId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500 bg-white"
                >
                  <option value="">Any Available Radiologist / Specialist</option>
                  {clinicDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fullName} ({doc.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Indication & Instructions</label>
                <textarea
                  rows={3}
                  required
                  value={xrayClinicalNotes}
                  onChange={(e) => setXrayClinicalNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500"
                  placeholder="Detail symptoms, trauma history, or differential diagnosis for the radiologist/lab technician..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setOrderingXRay(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-sm flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingOrder ? 'Submitting...' : 'Send Patient to Specialist Room'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: RADIOLOGIST DOCUMENT FINDINGS & RETURN TO DOCTOR
          ========================================================================= */}
      {recordingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Radiology Findings & Impression Report</h3>
                  <p className="text-xs text-slate-500">Record diagnostic results and return patient to referring doctor</p>
                </div>
              </div>
              <button
                onClick={() => setRecordingOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitScanFindings} className="space-y-4">
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-500">Patient:</span>{' '}
                  <span className="font-bold text-slate-900">{recordingOrder.patient?.fullName}</span>{' '}
                  <span className="text-slate-500 font-mono">({recordingOrder.patient?.patientNumber})</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Referring Dr:</span>{' '}
                  <span className="font-bold text-purple-800">{recordingOrder.referringDoctor?.fullName}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Anatomical Findings</label>
                <textarea
                  rows={4}
                  required
                  value={scanFindings}
                  onChange={(e) => setScanFindings(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-purple-500"
                  placeholder="Document observations regarding bone architecture, soft tissues, joint spaces, parenchymal clarity..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Radiologist Diagnostic Impression</label>
                <textarea
                  rows={2}
                  required
                  value={scanImpression}
                  onChange={(e) => setScanImpression(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-purple-500 font-medium"
                  placeholder="Numbered conclusion / definitive diagnostic impression..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Radiograph / Scan Image URL</label>
                <input
                  type="text"
                  value={scanImageUrl}
                  onChange={(e) => setScanImageUrl(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500 font-mono"
                  placeholder="Image URL link"
                />
              </div>

              {/* Modern Specialist Treatment & Diagnostic Tools */}
              <div className="border border-purple-200 rounded-2xl bg-slate-900 p-4 text-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Modern Clinical Diagnostic & Investigation Tools
                    </span>
                  </div>

                  {/* Tool Switcher */}
                  <div className="flex items-center space-x-1 bg-white/10 p-1 rounded-xl text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSpecialistTool('imaging')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        specialistTool === 'imaging' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      DICOM Imaging
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecialistTool('ecg')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        specialistTool === 'ecg' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      ECG Monitor
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecialistTool('analyzer')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        specialistTool === 'analyzer' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Lab Analyzer
                    </button>
                  </div>
                </div>

                {/* TOOL 1: DICOM High-Resolution Imaging */}
                {specialistTool === 'imaging' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <div className="flex items-center space-x-2">
                        <span>Zoom:</span>
                        <div className="flex space-x-1">
                          {[1, 1.5, 2].map((z) => (
                            <button
                              key={z}
                              type="button"
                              onClick={() => setImagingZoom(z)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                imagingZoom === z ? 'bg-purple-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                              }`}
                            >
                              {z}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span>Contrast:</span>
                        <div className="flex space-x-1">
                          {(['normal', 'contrast', 'invert'] as const).map((filter) => (
                            <button
                              key={filter}
                              type="button"
                              onClick={() => setImagingFilter(filter)}
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                imagingFilter === filter ? 'bg-purple-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                              }`}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl bg-black border border-white/10 p-2 text-center relative max-h-56 flex items-center justify-center">
                      <img
                        src={scanImageUrl}
                        alt="Radiology preview"
                        style={{
                          transform: `scale(${imagingZoom})`,
                          filter:
                            imagingFilter === 'contrast'
                              ? 'contrast(180%) brightness(90%)'
                              : imagingFilter === 'invert'
                              ? 'invert(100%)'
                              : 'none',
                        }}
                        className="max-h-52 mx-auto rounded object-contain transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

                {/* TOOL 2: 12-Lead ECG Waveform Monitor */}
                {specialistTool === 'ecg' && (
                  <div className="p-3 bg-black rounded-xl border border-emerald-900 font-mono text-emerald-400 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                        <Activity className="w-4 h-4 animate-pulse text-emerald-400" />
                        Lead II Rhythm Strip • 25mm/s • 10mm/mV
                      </span>
                      <span className="bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 text-[10px] text-emerald-300">
                        HR: 72 bpm (Normal Sinus)
                      </span>
                    </div>

                    {/* SVG ECG Waveform */}
                    <div className="h-20 w-full overflow-hidden flex items-center justify-center bg-emerald-950/30 rounded border border-emerald-900/40">
                      <svg viewBox="0 0 500 80" className="w-full h-full stroke-emerald-400 fill-none" strokeWidth="2">
                        <path d="M 0 40 L 40 40 L 45 42 L 50 36 L 55 40 L 80 40 L 85 45 L 90 10 L 95 65 L 100 40 L 105 40 L 115 32 L 125 40 L 180 40 L 185 42 L 190 36 L 195 40 L 220 40 L 225 45 L 230 10 L 235 65 L 240 40 L 245 40 L 255 32 L 265 40 L 320 40 L 325 42 L 330 36 L 335 40 L 360 40 L 365 45 L 370 10 L 375 65 L 380 40 L 385 40 L 395 32 L 405 40 L 460 40 L 465 42 L 470 36 L 475 40 L 500 40" />
                      </svg>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-emerald-300/80 pt-1 text-center">
                      <div>PR: 160 ms (Normal)</div>
                      <div>QRS: 88 ms (Narrow)</div>
                      <div>QTc: 412 ms (Normal)</div>
                    </div>
                  </div>
                )}

                {/* TOOL 3: Clinical Laboratory Analyzer */}
                {specialistTool === 'analyzer' && (
                  <div className="p-3 bg-black/60 rounded-xl border border-white/10 space-y-2 text-xs">
                    <span className="text-[11px] font-bold text-purple-300 block">Automated Blood Pathology Panel</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white/5 p-2 rounded-lg flex justify-between">
                        <span className="text-slate-400">WBC:</span>
                        <strong className="text-emerald-400 font-mono">6.8 k/uL (Normal)</strong>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg flex justify-between">
                        <span className="text-slate-400">Hgb:</span>
                        <strong className="text-emerald-400 font-mono">14.5 g/dL (Normal)</strong>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg flex justify-between">
                        <span className="text-slate-400">Glucose:</span>
                        <strong className="text-emerald-400 font-mono">96 mg/dL (Normal)</strong>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg flex justify-between">
                        <span className="text-slate-400">Creatinine:</span>
                        <strong className="text-emerald-400 font-mono">0.9 mg/dL (Normal)</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecordingOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFindings}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isSubmittingFindings ? 'Saving...' : 'Authorize & Return Patient to Doctor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: DOCTOR FINAL REVIEW & PATIENT COUNSELING (Returned Patient)
          ========================================================================= */}
      {reviewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Attending Doctor Counseling & Treatment Plan</h3>
                  <p className="text-xs text-slate-500">Review specialist imaging results, counsel patient, and finalize visit</p>
                </div>
              </div>
              <button
                onClick={() => setReviewingOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Radiology Report Card */}
            <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Scan className="w-4 h-4 text-purple-600" />
                  <span>{reviewingOrder.title} ({reviewingOrder.bodyPart})</span>
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900">
                  STATUS: {reviewingOrder.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Patient:</span>
                  <span className="font-bold text-slate-800">{reviewingOrder.patient?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Reporting Specialist:</span>
                  <span className="font-bold text-purple-800">
                    {reviewingOrder.specialistDoctor?.fullName || reviewingOrder.completedBy || 'Radiology Department'}
                  </span>
                </div>
              </div>

              {/* Radiologist Findings & Impression */}
              <div className="bg-white rounded-xl p-3 border border-purple-100 text-xs space-y-2">
                <div>
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">
                    Radiologist Findings:
                  </span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">
                    {reviewingOrder.findings || 'No findings recorded'}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-2">
                  <span className="font-bold text-purple-900 block text-[11px] uppercase tracking-wide">
                    Diagnostic Impression:
                  </span>
                  <p className="text-slate-800 font-semibold mt-0.5">
                    {reviewingOrder.impression || 'Normal study'}
                  </p>
                </div>
              </div>

              {/* Scan Preview */}
              {reviewingOrder.imageUrl && (
                <div className="rounded-xl border border-slate-200 bg-slate-900 p-2 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">Radiograph Scan View:</span>
                  <img
                    src={reviewingOrder.imageUrl}
                    alt="X-Ray Scan"
                    className="max-h-48 mx-auto rounded object-contain"
                  />
                </div>
              )}
            </div>

            {/* Doctor Counseling Form */}
            <form onSubmit={handleSubmitDoctorReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Attending Physician Final Counseling & Discharge Plan</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={doctorConclusionText}
                  onChange={(e) => setDoctorConclusionText(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 bg-white leading-relaxed"
                  placeholder="Record your final counseling to the patient, explain the X-Ray findings, prescribe medication or therapy, and specify follow-up instructions..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition shadow-sm flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmittingReview ? 'Discharging...' : 'Finalize Counseling & Discharge'}</span>
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    const savedOrder = await handleSubmitDoctorReview(e);
                    if (savedOrder) {
                      openPrescribeModal(
                        savedOrder.patientId,
                        savedOrder.patient?.fullName || 'Patient',
                        savedOrder.appointmentId
                      );
                    }
                  }}
                  disabled={isSubmittingReview}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-md hover:scale-105 active:scale-95 flex items-center space-x-1.5"
                >
                  <Pill className="w-4 h-4" />
                  <span>Finalize & Order to Pharmacy (Prescribe Drugs) →</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reschedule Appointment */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveReschedule}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-base">Reschedule Patient Appointment</h3>
              <button
                type="button"
                onClick={() => setReschedulingAppt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-1 space-y-3">
              <div>
                <span className="text-xs text-slate-500 block">Patient:</span>
                <span className="text-sm font-bold text-slate-900">{reschedulingAppt.patient?.fullName}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Rescheduling</label>
                <input
                  type="text"
                  placeholder="e.g. Doctor schedule change"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setReschedulingAppt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
              >
                Confirm Reschedule
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* TIMELINE MODAL: CLINICAL JOURNEY & ROOM TRACKING              */}
      {/* ------------------------------------------------------------- */}
      {selectedTimelineAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
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

            <ClinicalJourneyTimeline
              appointment={selectedTimelineAppt}
              patientName={selectedTimelineAppt.patient?.fullName}
              showCardWrapper={false}
            />

            <div className="flex justify-end pt-3 border-t border-slate-100">
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
    </DashboardLayout>
  );
}
