'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DashboardLayout } from '../../components/DashboardLayout';
import { apiFetch } from '../../lib/api';
import {
  FlaskConical,
  TestTube,
  Microscope,
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Building2,
  ArrowRight,
  Save,
  Check,
  User,
  Phone,
  Printer,
  ChevronRight,
  ShieldCheck,
  Plus,
  Barcode,
  Send,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { ClinicalJourneyTimeline } from '../../components/ClinicalJourneyTimeline';

interface LabResultForm {
  quantitativeValue: string;
  referenceRange: string;
  impression: string;
  labNotes: string;
  isCritical: boolean;
}

export default function LaboratoryPage() {
  const { user, activeMembership, isLoading } = useAuth();
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'specimens' | 'results' | 'archive'>('orders');

  // Core Data
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Result Entry Modal
  const [selectedOrderForResults, setSelectedOrderForResults] = useState<any | null>(null);
  const [resultForm, setResultForm] = useState<LabResultForm>({
    quantitativeValue: '',
    referenceRange: '',
    impression: '',
    labNotes: '',
    isCritical: false,
  });
  const [isSubmittingResults, setIsSubmittingResults] = useState(false);

  // Selected Order for Official Printable Report
  const [selectedReportOrder, setSelectedReportOrder] = useState<any | null>(null);

  // Selected for Timeline View
  const [selectedTimelineAppt, setSelectedTimelineAppt] = useState<any | null>(null);

  // Fast Specimen Mock Accessioning Log
  const [specimensLog, setSpecimensLog] = useState([
    {
      barcode: 'SMP-2026-0841',
      patientName: 'Abebe Bikila',
      testName: 'Complete Blood Count (CBC)',
      tubeType: 'Purple Top (EDTA K2)',
      collectedAt: '15 mins ago',
      status: 'Analyzing in Hematology Analyzer',
      tech: 'Lab Tech Meron',
    },
    {
      barcode: 'SMP-2026-0842',
      patientName: 'Almaz Ayana',
      testName: 'Fasting Blood Glucose & HbA1c',
      tubeType: 'Gray Top (Sodium Fluoride)',
      collectedAt: '35 mins ago',
      status: 'Sample Centrifuged & Ready',
      tech: 'Lab Tech Dawit',
    },
    {
      barcode: 'SMP-2026-0843',
      patientName: 'Solomon Bekele',
      testName: 'Comprehensive Metabolic Panel (CMP)',
      tubeType: 'Gold Top (SST Gel Separator)',
      collectedAt: '50 mins ago',
      status: 'Analyzing in Biochemistry Suite',
      tech: 'Lab Tech Meron',
    },
    {
      barcode: 'SMP-2026-0844',
      patientName: 'Sara Haile',
      testName: 'Urinalysis & Urine Microscopy',
      tubeType: 'Sterile Urine Container',
      collectedAt: '1 hour ago',
      status: 'Microscopic Examination Complete',
      tech: 'Lab Tech Dawit',
    },
  ]);

  // Role Protection
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (activeMembership && !['LABORATORY', 'SPECIALIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(activeMembership.role)) {
      router.push('/login');
    }
  }, [user, activeMembership, isLoading, router]);

  // Fetch Diagnostic & Lab Orders
  const fetchLabData = async () => {
    setIsDataLoading(true);
    setStatusMsg('');
    try {
      const res = await apiFetch<any>('/diagnostics?page=1&limit=50');
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.items || [];
        setLabOrders(list);
      }
    } catch (e: any) {
      setStatusMsg(e.message || 'Error loading clinical laboratory orders.');
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (activeMembership) {
      fetchLabData();
    }
  }, [activeMembership]);

  // Start Lab Procedure (Specimen Received)
  const handleStartLabOrder = async (orderId: string) => {
    try {
      const res = await apiFetch<any>(`/diagnostics/${orderId}/start`, {
        method: 'PATCH',
      });
      if (res.success) {
        setStatusMsg('Specimen received and lab analysis initiated.');
        await fetchLabData();
      } else {
        alert(res.error?.message || 'Failed to start lab procedure.');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating order status.');
    }
  };

  // Complete Findings & Transmit to Doctor
  const handleSubmitResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForResults) return;
    setIsSubmittingResults(true);

    try {
      const findingsSummary = `Quantitative Results: ${resultForm.quantitativeValue} (Ref: ${resultForm.referenceRange})${
        resultForm.isCritical ? ' [CRITICAL VALUE ALERT]' : ''
      }`;

      const res = await apiFetch<any>(`/diagnostics/${selectedOrderForResults.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          findings: findingsSummary,
          impression: resultForm.impression || 'Investigation results verified by hospital pathology laboratory.',
          radiologyNotes: resultForm.labNotes,
        }),
      });

      if (res.success) {
        setStatusMsg(
          `Lab test results authorized and transmitted to Dr. ${
            selectedOrderForResults.referringDoctor?.fullName || 'Physician'
          } in Room 102.`
        );
        setSelectedOrderForResults(null);
        await fetchLabData();
      } else {
        alert(res.error?.message || 'Failed to transmit laboratory results.');
      }
    } catch (e: any) {
      alert(e.message || 'Error submitting laboratory findings.');
    } finally {
      setIsSubmittingResults(false);
    }
  };

  // Filter pending vs completed
  const pendingOrders = labOrders.filter((o) => o.status === 'REQUESTED' || o.status === 'IN_PROGRESS');
  const completedOrders = labOrders.filter((o) => o.status === 'COMPLETED' || o.status === 'REVIEWED');

  // Search filtered orders
  const filteredPending = pendingOrders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const pName = o.patient?.fullName?.toLowerCase() || '';
    const tName = o.title?.toLowerCase() || '';
    return pName.includes(q) || tName.includes(q);
  });

  return (
    <DashboardLayout
      roleTitle="Pathology & Laboratory"
      roleBadge="🔬 Laboratory Console"
      roleColor="purple"
      headerTitle="Hospital Pathology & Central Clinical Laboratory"
      headerSubtitle="Room 108 - Diagnostic Test Requisitions, Sample Accessioning, Analysis & Result Authorization"
      activeItemId={activeTab}
      onSelectNav={(id) => setActiveTab(id as any)}
      headerActions={
        <button
          onClick={fetchLabData}
          disabled={isDataLoading}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Refresh Orders</span>
        </button>
      }
      navGroups={[
        {
          groupLabel: 'Clinical Pathology Operations',
          items: [
            {
              id: 'orders',
              label: 'Lab Requisitions (Room 108)',
              icon: FlaskConical,
              badge: pendingOrders.length,
              badgeColor: 'bg-purple-100 text-purple-800',
            },
            {
              id: 'specimens',
              label: 'Specimen Barcoding & Log',
              icon: TestTube,
              badge: specimensLog.length,
              badgeColor: 'bg-blue-100 text-blue-800',
            },
            {
              id: 'results',
              label: 'Active Results Entry',
              icon: Microscope,
              badge: pendingOrders.filter((o) => o.status === 'IN_PROGRESS').length,
              badgeColor: 'bg-amber-100 text-amber-800',
            },
            {
              id: 'archive',
              label: 'Completed Tests Archive',
              icon: FileCheck2,
              badge: completedOrders.length,
            },
          ],
        },
      ]}
    >
      {/* Status Notice */}
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
          TAB 1: LAB REQUISITIONS & ORDERS QUEUE (ROOM 108)
          ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-700">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Pending Tests</span>
                <span className="text-xl font-black text-slate-900">{pendingOrders.length} Orders</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
                <TestTube className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">In Analysis</span>
                <span className="text-xl font-black text-slate-900">
                  {pendingOrders.filter((o) => o.status === 'IN_PROGRESS').length} Samples
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Completed Today</span>
                <span className="text-xl font-black text-slate-900">{completedOrders.length} Tests</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Lab Station</span>
                <span className="text-xs font-bold text-slate-800">Room 108 Pathology</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient name or test requisition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-purple-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredPending.length}</span> active lab requisition(s)
            </div>
          </div>

          {/* Requisitions List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-600" />
                  <span>Room 108 - Active Clinical Laboratory Queue</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receive patient samples, perform diagnostic testing, record quantitative values, and return results to doctor.
                </p>
              </div>
            </div>

            {filteredPending.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-bold text-slate-700">No Pending Lab Tests</p>
                <p className="text-xs text-slate-400 mt-1">
                  All diagnostic laboratory orders have been processed and transmitted to doctors.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPending.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {order.title?.charAt(0) || 'L'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {order.title || 'Laboratory Investigation'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {order.bodyPart || 'Standard Blood / Urine'}
                          </span>
                          {order.status === 'IN_PROGRESS' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full animate-pulse">
                              In Analysis
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                              Specimen Awaited
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span>Patient: <strong className="text-slate-800">{order.patient?.fullName}</strong></span>
                          <span>•</span>
                          <span>Referring Doctor: Dr. {order.referringDoctor?.fullName || 'Physician'}</span>
                          <span>•</span>
                          <span>Room: {order.roomNumber || 'Room 108 - Pathology'}</span>
                        </div>
                        {order.clinicalNotes && (
                          <div className="text-[11px] text-slate-600 bg-purple-50/40 p-2 rounded-xl border border-purple-100 mt-2">
                            <strong className="text-purple-900">Clinical Indication:</strong> {order.clinicalNotes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-shrink-0">
                      {order.appointment && (
                        <button
                          type="button"
                          onClick={() => setSelectedTimelineAppt(order.appointment)}
                          className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center space-x-1"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Timeline</span>
                        </button>
                      )}

                      {order.status === 'REQUESTED' ? (
                        <button
                          type="button"
                          onClick={() => handleStartLabOrder(order.id)}
                          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center space-x-1.5 active:scale-95"
                        >
                          <TestTube className="w-3.5 h-3.5" />
                          <span>Receive Specimen & Start</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForResults(order);
                            setResultForm({
                              quantitativeValue: '',
                              referenceRange: 'Normal Range: 4.0 - 10.0',
                              impression: '',
                              labNotes: '',
                              isCritical: false,
                            });
                          }}
                          className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs flex items-center space-x-1.5 active:scale-95"
                        >
                          <Microscope className="w-3.5 h-3.5" />
                          <span>Enter Findings & Authorize</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SPECIMEN ACCESSIONING & BARCODES
          ========================================================================= */}
      {activeTab === 'specimens' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Barcode className="w-5 h-5 text-purple-600" />
                <span>Specimen Accessioning & Phlebotomy Log</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Barcoded tube tracking, collection timestamps, and sample integrity monitoring.
              </p>
            </div>
            <button
              onClick={() => {
                const newCode = `SMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                setSpecimensLog([
                  {
                    barcode: newCode,
                    patientName: 'New Phlebotomy Patient',
                    testName: 'General Chemistry Panel',
                    tubeType: 'Gold Top (SST Gel)',
                    collectedAt: 'Just now',
                    status: 'Sample Centrifuged',
                    tech: user?.fullName || 'Lab Tech',
                  },
                  ...specimensLog,
                ]);
                setStatusMsg(`New specimen registered with barcode ${newCode}`);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs flex items-center space-x-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Phlebotomy Collection</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specimensLog.map((s, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-purple-900 text-xs bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      {s.barcode}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                      Accessioned
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{s.collectedAt}</span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Patient:</span>
                    <span className="font-bold text-slate-900">{s.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ordered Test:</span>
                    <span className="font-semibold text-slate-800">{s.testName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tube / Container:</span>
                    <span className="font-mono text-purple-700 font-semibold">{s.tubeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-semibold text-emerald-700">{s.status}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                  <button
                    onClick={() => alert(`Barcode Label Printed for ${s.barcode}`)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Tube Barcode</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: RESULTS ENTRY & FINDINGS
          ========================================================================= */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Microscope className="w-5 h-5 text-purple-600" />
              <span>Pending Results Entry & Quality Verification</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any in-progress laboratory specimen to input analytical findings, check normal reference ranges, and transmit back to the physician.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOrders
              .filter((o) => o.status === 'IN_PROGRESS')
              .map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-sm">{order.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full">
                      Ready for Results
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600">
                    <div>Patient: <strong className="text-slate-800">{order.patient?.fullName}</strong></div>
                    <div>Doctor: Dr. {order.referringDoctor?.fullName}</div>
                    <div>Indication: {order.clinicalNotes || 'Routine Investigation'}</div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOrderForResults(order);
                      setResultForm({
                        quantitativeValue: '',
                        referenceRange: 'Normal: 4.0 - 10.0',
                        impression: '',
                        labNotes: '',
                        isCritical: false,
                      });
                    }}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 active:scale-95"
                  >
                    <Microscope className="w-3.5 h-3.5" />
                    <span>Enter Results & Authorize</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: COMPLETED LAB TESTS ARCHIVE
          ========================================================================= */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-600" />
                <span>Pathology & Laboratory Investigations Archive</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Archived laboratory results, pathologist conclusions, and printable hospital reports.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
              Total: {completedOrders.length} Completed Reports
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Test Title</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Referring Doctor</th>
                    <th className="py-3 px-4">Authorized By</th>
                    <th className="py-3 px-4">Completion Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{ord.title}</div>
                        <div className="font-mono text-[10px] text-slate-400">{ord.bodyPart || 'Clinical Lab'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{ord.patient?.fullName}</td>
                      <td className="py-3.5 px-4 text-slate-600">Dr. {ord.referringDoctor?.fullName}</td>
                      <td className="py-3.5 px-4 font-semibold text-purple-700">{ord.completedBy || 'Central Lab'}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {ord.completedAt ? new Date(ord.completedAt).toLocaleDateString() : 'Today'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedReportOrder(ord)}
                          className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition flex items-center space-x-1 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View / Print Report</span>
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
          MODAL: ENTER LAB FINDINGS & AUTHORIZE (ROOM 108 -> ROOM 102)
          ========================================================================= */}
      {selectedOrderForResults && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header (Sticky at top) */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-purple-50/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Room 108: Clinical Laboratory Result Authorization
                  </h3>
                  <p className="text-xs text-slate-500">
                    Test: <span className="font-bold text-purple-900">{selectedOrderForResults.title}</span> | Patient: {selectedOrderForResults.patient?.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForResults(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition text-xs"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitResults} className="flex-1 flex flex-col min-h-0">
              <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0 text-xs">
                {/* Quantitative Value */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quantitative Analytical Result & Units
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hemoglobin: 14.2 g/dL | Fasting Blood Sugar: 98 mg/dL"
                    value={resultForm.quantitativeValue}
                    onChange={(e) => setResultForm({ ...resultForm, quantitativeValue: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500 font-mono font-bold"
                  />
                </div>

                {/* Normal Reference Range */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Biological Reference Interval / Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 70 - 110 mg/dL (Normal Fasting Glucose)"
                    value={resultForm.referenceRange}
                    onChange={(e) => setResultForm({ ...resultForm, referenceRange: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                {/* Pathologist Clinical Impression */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pathologist / Laboratory Impression & Interpretation
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={resultForm.impression}
                    onChange={(e) => setResultForm({ ...resultForm, impression: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500"
                    placeholder="Result parameters within expected biological reference interval. No abnormalities detected..."
                  />
                </div>

                {/* Lab Notes */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Technical Methodology / Internal Bench Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Automated Photometric Enzymatic Assay, Calibrated Analyzer 2"
                    value={resultForm.labNotes}
                    onChange={(e) => setResultForm({ ...resultForm, labNotes: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500 text-slate-600"
                  />
                </div>

                {/* Critical Value Alert Flag */}
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="font-bold text-amber-900 block">Critical Panic Value Alert</span>
                      <span className="text-[10px] text-amber-700">Flag for immediate physician telephonic notification</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={resultForm.isCritical}
                    onChange={(e) => setResultForm({ ...resultForm, isCritical: e.target.checked })}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                </div>

                {/* Return Workflow Message */}
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-[11px] text-purple-900 flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>
                    Authorizing results automatically routes the findings back to <strong>Dr. {selectedOrderForResults.referringDoctor?.fullName || 'Doctor'} (Room 102)</strong>.
                  </span>
                </div>
              </div>

              {/* Pinned Sticky Footer */}
              <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-end space-x-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForResults(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResults}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-md flex items-center space-x-1.5 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingResults ? 'Authorizing...' : 'Authorize & Transmit to Doctor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: OFFICIAL PRINTABLE LABORATORY REPORT
          ========================================================================= */}
      {selectedReportOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Sticky Header */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-6 text-white text-center relative flex-shrink-0">
              <button
                onClick={() => setSelectedReportOrder(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition text-xs font-bold"
              >
                ✕
              </button>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2 border border-white/20">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-black">Official Hospital Pathology Laboratory Report</h3>
              <p className="text-xs text-purple-200 mt-0.5">{activeMembership?.clinicName || 'Central Hospital'}</p>
            </div>

            {/* Report Content Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs flex-1 overflow-y-auto min-h-0">
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedReportOrder.patient?.fullName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Test Code / Type</span>
                  <span className="font-mono font-bold text-purple-800">{selectedReportOrder.type}</span>
                </div>
              </div>

              <div className="space-y-2 divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Test Requisition:</span>
                  <span className="font-bold text-slate-900">{selectedReportOrder.title}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Referring Physician:</span>
                  <span className="font-semibold text-slate-800">Dr. {selectedReportOrder.referringDoctor?.fullName}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Authorized By:</span>
                  <span className="font-bold text-purple-800">{selectedReportOrder.completedBy || 'Senior Pathologist'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Result Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">VERIFIED & COMPLETED</span>
                </div>
              </div>

              {/* Findings & Values */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                  Pathology Findings & Quantitative Values:
                </span>
                <p className="font-mono text-slate-900 text-xs font-semibold bg-white p-2.5 rounded-xl border border-slate-200">
                  {selectedReportOrder.findings || 'Quantitative analytical values logged.'}
                </p>
                {selectedReportOrder.impression && (
                  <div>
                    <span className="font-bold text-slate-700 text-[10px] uppercase block mt-2">Clinical Impression:</span>
                    <p className="text-slate-600 mt-0.5">{selectedReportOrder.impression}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pinned Sticky Action Footer */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Official Report</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReportOrder(null)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition shadow-md active:scale-95"
              >
                Close Report
              </button>
            </div>
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
                <Building2 className="w-4 h-4 text-purple-600" />
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

