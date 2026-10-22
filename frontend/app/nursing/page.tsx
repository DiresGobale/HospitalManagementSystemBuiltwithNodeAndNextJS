'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DashboardLayout } from '../../components/DashboardLayout';
import { apiFetch } from '../../lib/api';
import {
  HeartPulse,
  Activity,
  ClipboardList,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Thermometer,
  Stethoscope,
  Pill,
  Syringe,
  BedDouble,
  Eye,
  Building2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Save,
  Check,
  User,
  Phone,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { ClinicalJourneyTimeline } from '../../components/ClinicalJourneyTimeline';

interface TriageVitals {
  systolicBP: string;
  diastolicBP: string;
  heartRate: string;
  temperature: string;
  spO2: string;
  respiratoryRate: string;
  bloodGlucose: string;
  weight: string;
  height: string;
  triageLevel: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  nursingNotes: string;
}

export default function NursingPage() {
  const { user, activeMembership, isLoading } = useAuth();
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'triage' | 'rounds' | 'meds' | 'patients'>('triage');

  // Core Data
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for Triage Intake Modal
  const [selectedApptForTriage, setSelectedApptForTriage] = useState<any | null>(null);
  const [triageForm, setTriageForm] = useState<TriageVitals>({
    systolicBP: '120',
    diastolicBP: '80',
    heartRate: '75',
    temperature: '36.8',
    spO2: '98',
    respiratoryRate: '16',
    bloodGlucose: '95',
    weight: '68',
    height: '172',
    triageLevel: 'ROUTINE',
    nursingNotes: '',
  });
  const [isSavingTriage, setIsSavingTriage] = useState(false);

  // Selected for Timeline View
  const [selectedTimelineAppt, setSelectedTimelineAppt] = useState<any | null>(null);

  // Inpatient Observation Wards Mock State
  const [wardBeds, setWardBeds] = useState([
    {
      bedNumber: 'Ward 2A - Bed 01',
      patientName: 'Abebe Bikila',
      age: '42 / M',
      diagnosis: 'Post-Operative Recovery',
      infusion: 'Normal Saline 0.9% @ 80 ml/hr',
      vitalsStatus: 'Stable (BP 122/78, Temp 37.0°C)',
      lastRound: '25 mins ago',
      assignedNurse: 'Nurse Tigist M.',
    },
    {
      bedNumber: 'Ward 2A - Bed 02',
      patientName: 'Almaz Ayana',
      age: '31 / F',
      diagnosis: 'Acute Bronchitis & Dehydration',
      infusion: 'Ringer Lactate 500ml @ 100 ml/hr',
      vitalsStatus: 'SpO2 96%, HR 82 bpm',
      lastRound: '40 mins ago',
      assignedNurse: 'Nurse Dawit K.',
    },
    {
      bedNumber: 'Ward 2A - Bed 03',
      patientName: 'Solomon Bekele',
      age: '55 / M',
      diagnosis: 'Diabetic Ketoacidosis Observation',
      infusion: 'Insulin Infusion Protocol @ 4 units/hr',
      vitalsStatus: 'Glucose: 165 mg/dL, Temp 36.6°C',
      lastRound: '10 mins ago',
      assignedNurse: 'Nurse Tigist M.',
    },
    {
      bedNumber: 'Ward 2B - Bed 04',
      patientName: 'Sara Haile',
      age: '24 / F',
      diagnosis: 'Observation - Acute Appendicitis rule-out',
      infusion: 'Dextrose 5% in Normal Saline',
      vitalsStatus: 'Mild abdominal tenderness, Vitals Normal',
      lastRound: '1 hour ago',
      assignedNurse: 'Nurse Rahel T.',
    },
  ]);

  // Bedside Medication Administration checklist
  const [bedsideMeds, setBedsideMeds] = useState([
    {
      id: 'med-1',
      patientName: 'Abebe Bikila (Bed 01)',
      medication: 'Ceftriaxone 1g IV',
      scheduledTime: '08:00 AM (Morning Dose)',
      route: 'Intravenous (IV)',
      administered: false,
    },
    {
      id: 'med-2',
      patientName: 'Almaz Ayana (Bed 02)',
      medication: 'Paracetamol 1000mg IV Infusion',
      scheduledTime: '09:00 AM (Pain/Fever)',
      route: 'IV Infusion',
      administered: true,
      administeredAt: '09:05 AM',
    },
    {
      id: 'med-3',
      patientName: 'Solomon Bekele (Bed 03)',
      medication: 'Subcutaneous Regular Insulin 6 Units',
      scheduledTime: '10:00 AM (Pre-meal)',
      route: 'Subcutaneous',
      administered: false,
    },
    {
      id: 'med-4',
      patientName: 'Sara Haile (Bed 04)',
      medication: 'Ciprofloxacin 500mg Oral',
      scheduledTime: '11:00 AM',
      route: 'Oral (PO)',
      administered: false,
    },
  ]);

  // Role Protection
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (activeMembership && !['NURSING', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(activeMembership.role)) {
      router.push('/login');
    }
  }, [user, activeMembership, isLoading, router]);

  // Load appointments & patients
  const fetchNursingData = async () => {
    setIsDataLoading(true);
    setStatusMsg('');
    try {
      // 1. Appointments
      const apptRes = await apiFetch<any>('/appointments?page=1&limit=50');
      if (apptRes.success && apptRes.data) {
        const list = Array.isArray(apptRes.data) ? apptRes.data : apptRes.data.items || [];
        setAppointments(list);
      }

      // 2. Patients
      const ptRes = await apiFetch<any>('/patients?page=1&limit=50');
      if (ptRes.success && ptRes.data) {
        const ptList = Array.isArray(ptRes.data) ? ptRes.data : ptRes.data.items || [];
        setPatients(ptList);
      }
    } catch (e: any) {
      setStatusMsg(e.message || 'Error loading clinical nursing data.');
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (activeMembership) {
      fetchNursingData();
    }
  }, [activeMembership]);

  // BMI Calculation
  const calculateBMI = (wt: string, ht: string) => {
    const w = parseFloat(wt);
    const h = parseFloat(ht) / 100;
    if (!w || !h || h <= 0) return { bmi: '—', category: '—' };
    const val = w / (h * h);
    let cat = 'Normal weight';
    if (val < 18.5) cat = 'Underweight';
    else if (val >= 25 && val < 30) cat = 'Overweight';
    else if (val >= 30) cat = 'Obese';
    return { bmi: val.toFixed(1), category: cat };
  };

  // Handle Triage Intake Submit
  const handleSaveTriageVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptForTriage) return;
    setIsSavingTriage(true);

    try {
      const { bmi, category } = calculateBMI(triageForm.weight, triageForm.height);
      const formattedNote = `\n[NURSING TRIAGE INTAKE - ROOM 103]
• Blood Pressure: ${triageForm.systolicBP}/${triageForm.diastolicBP} mmHg
• Pulse / Heart Rate: ${triageForm.heartRate} bpm
• Body Temperature: ${triageForm.temperature}°C
• SpO2: ${triageForm.spO2}% | Resp Rate: ${triageForm.respiratoryRate} bpm
• Blood Glucose: ${triageForm.bloodGlucose} mg/dL
• Weight: ${triageForm.weight} kg | Height: ${triageForm.height} cm | BMI: ${bmi} (${category})
• Triage Level: ${triageForm.triageLevel}
• Triage Assessment: ${triageForm.nursingNotes || 'Patient triaged and vital signs verified.'}
• Routed to: Room 102 - Doctor Consultation Suite
• Triage Nurse: ${user?.fullName || 'Hospital Triage Nurse'}`;

      const existingNotes = selectedApptForTriage.internalNotes || '';
      const combinedNotes = `${existingNotes}${formattedNote}`;

      // Save notes to appointment
      const res = await apiFetch(`/appointments/${selectedApptForTriage.id}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ internalNotes: combinedNotes }),
      });

      if (res.success) {
        setStatusMsg(`Triage vitals recorded for ${selectedApptForTriage.patient?.fullName || 'Patient'}. Directed to Consultation Room 102.`);
        setSelectedApptForTriage(null);
        await fetchNursingData();
      } else {
        alert(res.error?.message || 'Failed to save triage vitals.');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving triage vitals.');
    } finally {
      setIsSavingTriage(false);
    }
  };

  // Toggle Bedside Med Administration
  const handleAdministerMed = (medId: string) => {
    setBedsideMeds((prev) =>
      prev.map((m) =>
        m.id === medId
          ? {
              ...m,
              administered: true,
              administeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : m
      )
    );
  };

  // Filter Appointments for Triage (Exclude completed or cancelled)
  const triageQueue = appointments.filter((a) => {
    const isUncompleted = a.status !== 'COMPLETED' && a.status !== 'CANCELLED';
    if (!searchQuery) return isUncompleted;
    const q = searchQuery.toLowerCase();
    const pName = a.patient?.fullName?.toLowerCase() || '';
    const num = a.appointmentNumber?.toLowerCase() || '';
    return isUncompleted && (pName.includes(q) || num.includes(q));
  });

  // Calculate current BMI for form
  const currentBMI = calculateBMI(triageForm.weight, triageForm.height);

  return (
    <DashboardLayout
      roleTitle="Clinical Nursing & Triage"
      roleBadge="🧑‍⚕️ Nursing Console"
      roleColor="indigo"
      headerTitle="Hospital Nursing & Triage Management System"
      headerSubtitle="Room 103 - Triage Station, Vital Signs Intake, Inpatient Wards & Bedside Care"
      activeItemId={activeTab}
      onSelectNav={(id) => setActiveTab(id as any)}
      headerActions={
        <button
          onClick={fetchNursingData}
          disabled={isDataLoading}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      }
      navGroups={[
        {
          groupLabel: 'Clinical Nursing Station',
          items: [
            {
              id: 'triage',
              label: 'Triage & Vitals (Room 103)',
              icon: HeartPulse,
              badge: triageQueue.length,
              badgeColor: 'bg-indigo-100 text-indigo-800',
            },
            {
              id: 'rounds',
              label: 'Inpatient & Ward Observation',
              icon: BedDouble,
              badge: wardBeds.length,
              badgeColor: 'bg-blue-100 text-blue-800',
            },
            {
              id: 'meds',
              label: 'Bedside Medication (MAR)',
              icon: Syringe,
              badge: bedsideMeds.filter((m) => !m.administered).length,
              badgeColor: 'bg-amber-100 text-amber-800',
            },
            {
              id: 'patients',
              label: 'Patient Directory & History',
              icon: ClipboardList,
              badge: patients.length,
            },
          ],
        },
      ]}
    >
      {/* Top Notification Banner */}
      {statusMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg('')} className="text-emerald-700 font-bold hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: TRIAGE & VITAL SIGNS QUEUE (ROOM 103)
          ========================================================================= */}
      {activeTab === 'triage' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Awaiting Triage</span>
                <span className="text-xl font-black text-slate-900">{triageQueue.length} Patients</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Triage Station</span>
                <span className="text-sm font-bold text-slate-800">Room 103 Active</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Next Consultation</span>
                <span className="text-sm font-bold text-slate-800">Room 102 Suite</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Hospital Facility</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {activeMembership?.clinicName || 'Central Hospital'}
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient name or appointment number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{triageQueue.length}</span> patient(s) in Room 103 triage queue
            </div>
          </div>

          {/* Patient Cards / Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-indigo-600" />
                  <span>Room 103 - Patient Intake & Vitals Recording Queue</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record blood pressure, pulse, temperature, oxygen and weight before directing patient to doctor suite.
                </p>
              </div>
            </div>

            {triageQueue.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-bold text-slate-700">All Patients Triaged</p>
                <p className="text-xs text-slate-400 mt-1">No incoming patients currently waiting at Room 103 triage desk.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {triageQueue.map((appt) => {
                  const hasVitalsRecorded = appt.internalNotes?.includes('[NURSING TRIAGE INTAKE');
                  return (
                    <div
                      key={appt.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {appt.patient?.fullName?.charAt(0) || 'P'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {appt.patient?.fullName || 'Patient'}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {appt.appointmentNumber}
                            </span>
                            {hasVitalsRecorded ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Vitals Recorded</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                                Pending Vitals
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                            <span>Phone: {appt.patient?.phone || '—'}</span>
                            <span>•</span>
                            <span>Service: {appt.service?.name || 'General Outpatient'}</span>
                            <span>•</span>
                            <span>Assigned Doctor: Dr. {appt.doctor?.fullName || 'Consultant on Duty'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedTimelineAppt(appt)}
                          className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center space-x-1"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Journey</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApptForTriage(appt);
                            setTriageForm({
                              systolicBP: '120',
                              diastolicBP: '80',
                              heartRate: '75',
                              temperature: '36.8',
                              spO2: '98',
                              respiratoryRate: '16',
                              bloodGlucose: '95',
                              weight: '68',
                              height: '172',
                              triageLevel: 'ROUTINE',
                              nursingNotes: '',
                            });
                          }}
                          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs flex items-center space-x-1.5 active:scale-95"
                        >
                          <HeartPulse className="w-3.5 h-3.5" />
                          <span>{hasVitalsRecorded ? 'Update Vitals' : 'Record Vitals & Transfer'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: INPATIENT & WARD OBSERVATION
          ========================================================================= */}
      {activeTab === 'rounds' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-indigo-600" />
                <span>Hospital Inpatient Wards & Observation Beds</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor inpatient vitals, IV fluid infusion rates, wound dressing schedules, and nursing care rounds.
              </p>
            </div>
            <button
              onClick={() => {
                setStatusMsg('New nursing observation round recorded for Ward 2A.');
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Log Ward Care Round</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wardBeds.map((bed, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{bed.bedNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                      Occupied
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Round: {bed.lastRound}</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Patient:</span>
                    <span className="font-bold text-slate-900">{bed.patientName} ({bed.age})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Diagnosis:</span>
                    <span className="font-semibold text-slate-800">{bed.diagnosis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IV Fluid Protocol:</span>
                    <span className="font-mono text-indigo-700 font-bold">{bed.infusion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Vitals:</span>
                    <span className="font-semibold text-emerald-700">{bed.vitalsStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Nurse:</span>
                    <span className="font-semibold text-slate-800">{bed.assignedNurse}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                  <button
                    onClick={() => setStatusMsg(`Vital signs logged for ${bed.patientName} (${bed.bedNumber})`)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Quick Vitals Check
                  </button>
                  <button
                    onClick={() => setStatusMsg(`IV infusion updated for ${bed.patientName}`)}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
                  >
                    Update Infusion Rate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BEDSIDE MEDICATION ADMINISTRATION (MAR)
          ========================================================================= */}
      {activeTab === 'meds' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Syringe className="w-5 h-5 text-indigo-600" />
              <span>Bedside Medication Administration Record (eMAR)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify the 5 Rights of Drug Administration (Right Patient, Right Drug, Right Dose, Right Route, Right Time).
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {bedsideMeds.map((med) => (
                <div
                  key={med.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{med.patientName}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {med.route}
                      </span>
                      {med.administered ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Given at {med.administeredAt}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                          Due for Administration
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{med.medication}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Scheduled: {med.scheduledTime}</div>
                  </div>

                  <div className="flex-shrink-0 w-full sm:w-auto flex justify-end">
                    {med.administered ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Signed by {user?.fullName || 'Nurse'}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdministerMed(med.id)}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 active:scale-95"
                      >
                        <Syringe className="w-3.5 h-3.5" />
                        <span>Confirm Dose Administered</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PATIENT HEALTH DIRECTORY
          ========================================================================= */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <span>Hospital Patient Directory & Medical History</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review registered patient demographics, vital signs records, and emergency contact details.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
              Total: {patients.length} Registered Patients
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Patient ID / Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Gender / Age</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Emergency Contact</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((pt) => (
                    <tr key={pt.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{pt.fullName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{pt.patientNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{pt.phone || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{pt.gender || '—'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{pt.bloodGroup || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{pt.emergencyContact || '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            alert(`Patient: ${pt.fullName}\nAllergies: ${pt.allergies || 'None recorded'}\nEmergency: ${pt.emergencyContact || 'None'}`);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RECORD VITAL SIGNS & DIRECT TO DOCTOR (ROOM 103 -> ROOM 102)
          ========================================================================= */}
      {selectedApptForTriage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header (Sticky at top) */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-indigo-50/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Room 103 Triage: Vital Signs Intake
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient: <span className="font-bold text-slate-800">{selectedApptForTriage.patient?.fullName}</span> ({selectedApptForTriage.appointmentNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApptForTriage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition text-xs"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveTriageVitals} className="flex-1 flex flex-col min-h-0">
              <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0 text-xs">
                {/* Triage Urgency Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Triage Urgency Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTriageForm({ ...triageForm, triageLevel: 'ROUTINE' })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        triageForm.triageLevel === 'ROUTINE'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block font-bold">Routine (Green)</span>
                      <span className="text-[10px] text-slate-400">Stable, standard care</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTriageForm({ ...triageForm, triageLevel: 'URGENT' })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        triageForm.triageLevel === 'URGENT'
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block font-bold">Urgent (Yellow)</span>
                      <span className="text-[10px] text-slate-400">Needs prompt visit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTriageForm({ ...triageForm, triageLevel: 'EMERGENCY' })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        triageForm.triageLevel === 'EMERGENCY'
                          ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block font-bold">Emergency (Red)</span>
                      <span className="text-[10px] text-slate-400">Immediate physician</span>
                    </button>
                  </div>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
                    <input
                      type="number"
                      required
                      placeholder="120"
                      value={triageForm.systolicBP}
                      onChange={(e) => setTriageForm({ ...triageForm, systolicBP: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
                    <input
                      type="number"
                      required
                      placeholder="80"
                      value={triageForm.diastolicBP}
                      onChange={(e) => setTriageForm({ ...triageForm, diastolicBP: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      required
                      placeholder="75"
                      value={triageForm.heartRate}
                      onChange={(e) => setTriageForm({ ...triageForm, heartRate: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="36.8"
                      value={triageForm.temperature}
                      onChange={(e) => setTriageForm({ ...triageForm, temperature: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SpO2 Oxygen (%)</label>
                    <input
                      type="number"
                      required
                      placeholder="98"
                      value={triageForm.spO2}
                      onChange={(e) => setTriageForm({ ...triageForm, spO2: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Blood Glucose (mg/dL)</label>
                    <input
                      type="number"
                      placeholder="95"
                      value={triageForm.bloodGlucose}
                      onChange={(e) => setTriageForm({ ...triageForm, bloodGlucose: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Weight, Height & Auto BMI */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={triageForm.weight}
                      onChange={(e) => setTriageForm({ ...triageForm, weight: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500 font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={triageForm.height}
                      onChange={(e) => setTriageForm({ ...triageForm, height: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500 font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Calculated BMI</label>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                      <span className="font-mono font-bold text-indigo-700 block text-xs">{currentBMI.bmi}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{currentBMI.category}</span>
                    </div>
                  </div>
                </div>

                {/* Nursing Assessment & Chief Complaint */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nursing Assessment & Chief Symptoms
                  </label>
                  <textarea
                    rows={2}
                    value={triageForm.nursingNotes}
                    onChange={(e) => setTriageForm({ ...triageForm, nursingNotes: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                    placeholder="Patient states onset of symptoms 2 days ago. Conscious, oriented x3..."
                  />
                </div>

                {/* Workflow Sequence Notice */}
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>
                    Saving vitals marks Room 103 triage complete and directs patient to <strong>Room 102 - Doctor Consultation Suite</strong>.
                  </span>
                </div>
              </div>

              {/* Pinned Sticky Footer */}
              <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-end space-x-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedApptForTriage(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTriage}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md flex items-center space-x-1.5 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingTriage ? 'Saving Vitals...' : 'Save Vitals & Transfer to Room 102'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CLINICAL JOURNEY TIMELINE
          ========================================================================= */}
      {selectedTimelineAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Patient Hospital Timeline Progress: {selectedTimelineAppt.appointmentNumber}</span>
              </h3>
              <button
                onClick={() => setSelectedTimelineAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-3">
              <ClinicalJourneyTimeline
                appointment={selectedTimelineAppt}
                patientName={selectedTimelineAppt.patient?.fullName}
                showCardWrapper={false}
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 flex-shrink-0">
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

