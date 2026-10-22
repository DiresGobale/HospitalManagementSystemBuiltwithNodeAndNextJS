'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DashboardLayout } from '../../components/DashboardLayout';
import { apiFetch } from '../../lib/api';
import {
  Pill,
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  Wallet,
  Receipt,
  AlertCircle,
  RefreshCw,
  Plus,
  Copy,
  Check,
  CheckCheck,
  ShieldCheck,
  FileText,
  DollarSign,
  Printer,
  ChevronRight,
  User,
  Stethoscope,
  Building2,
  Sparkles,
  PackageCheck,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  Calendar,
} from 'lucide-react';
import { ClinicalJourneyTimeline } from '../../components/ClinicalJourneyTimeline';

export default function PharmacyPage() {
  const { user, activeMembership, isLoading } = useAuth();
  const router = useRouter();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'queue' | 'inventory' | 'history'>('queue');

  // Core data states
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [selectedTimelineAppt, setSelectedTimelineAppt] = useState<any>(null);

  // Queue filter & search
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'DISPENSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment & Dispensation Modal State (Patient paying Birr at pharmacy)
  const [checkoutPrescription, setCheckoutPrescription] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'TELEBIRR' | 'CBE' | 'CASH' | 'CARD'>('TELEBIRR');
  const [paymentTxnRef, setPaymentTxnRef] = useState('');
  const [paymentPayerPhone, setPaymentPayerPhone] = useState('0995774866');
  const [paymentPayerAccount, setPaymentPayerAccount] = useState('1000305532472');
  const [paymentPayerName, setPaymentPayerName] = useState('');
  const [paymentDispensationNotes, setPaymentDispensationNotes] = useState('Patient counseled on medication timing, food interactions, and dosage schedule.');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Official Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Add Medication Modal State
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedGeneric, setNewMedGeneric] = useState('');
  const [newMedCategory, setNewMedCategory] = useState('Antibiotics');
  const [newMedStrength, setNewMedStrength] = useState('500mg');
  const [newMedDosageForm, setNewMedDosageForm] = useState('Tablet');
  const [newMedPrice, setNewMedPrice] = useState(100);
  const [newMedStock, setNewMedStock] = useState(200);
  const [newMedBatch, setNewMedBatch] = useState('BATCH-ETH-2026-01');
  const [newMedManufactureDate, setNewMedManufactureDate] = useState('2026-01-15');
  const [newMedExpiryDate, setNewMedExpiryDate] = useState('2026-11-20');
  const [newMedHospitalInputDate, setNewMedHospitalInputDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmittingMed, setIsSubmittingMed] = useState(false);

  // Edit Medication Modal State
  const [editingMed, setEditingMed] = useState<any | null>(null);
  const [isSubmittingEditMed, setIsSubmittingEditMed] = useState(false);

  // Helper to compute expiration countdown and &lt; 60 days warning
  const getExpiryDetails = (expiryDate?: string | Date | null) => {
    if (!expiryDate) {
      return {
        daysLeft: null,
        isWarning: false,
        isExpired: false,
        label: 'No Expiry Set',
        badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }
    const exp = new Date(expiryDate);
    const now = new Date();
    exp.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - now.getTime();
    const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return {
        daysLeft,
        isWarning: true,
        isExpired: true,
        label: `⚠️ EXPIRED (${Math.abs(daysLeft)}d ago)`,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-black ring-1 ring-rose-400',
      };
    }
    if (daysLeft <= 60) {
      return {
        daysLeft,
        isWarning: true,
        isExpired: false,
        label: `⚠️ EXPIRING SOON: ${daysLeft} days!`,
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-black shadow-sm ring-2 ring-amber-400/60 animate-pulse',
      };
    }
    return {
      daysLeft,
      isWarning: false,
      isExpired: false,
      label: `${daysLeft} days remaining`,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    };
  };

  const expiringSoonCount = medications.filter((m) => {
    const details = getExpiryDetails(m.expiryDate);
    return details.daysLeft !== null && details.daysLeft <= 60 && details.daysLeft >= 0;
  }).length;

  // Auth guard: Pharmacist, Admin, Manager, Doctor can view pharmacy operations
  useEffect(() => {
    if (
      !isLoading &&
      (!user ||
        (activeMembership?.role !== 'PHARMACIST' &&
          activeMembership?.role !== 'ADMIN' &&
          activeMembership?.role !== 'MANAGER' &&
          activeMembership?.role !== 'DOCTOR'))
    ) {
      router.push('/');
    }
  }, [user, activeMembership, isLoading, router]);

  const loadPharmacyData = async () => {
    if (!activeMembership?.clinicId) return;
    setIsDataLoading(true);

    try {
      const [rxRes, medRes] = await Promise.all([
        apiFetch('/pharmacy/prescriptions'),
        apiFetch('/pharmacy/medications'),
      ]);

      if (rxRes.success) {
        setPrescriptions(rxRes.data.items || []);
      }

      if (medRes.success) {
        setMedications(medRes.data || []);
      }
    } catch (err) {
      console.error('Error loading pharmacy data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (activeMembership?.clinicId) {
      loadPharmacyData();
    }
  }, [activeMembership]);

  // Copy helper
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Open Checkout / Payment Modal
  const openCheckoutModal = (rx: any) => {
    setCheckoutPrescription(rx);
    setPaymentPayerName(rx.patient?.fullName || '');
    setPaymentTxnRef(
      paymentMethod === 'TELEBIRR'
        ? `TB-0995774866-${Math.floor(1000 + Math.random() * 9000)}`
        : paymentMethod === 'CBE'
        ? `CBE-1000305532472-${Math.floor(1000 + Math.random() * 9000)}`
        : `CASH-${Math.floor(1000 + Math.random() * 9000)}`
    );
    setPaymentDispensationNotes(
      'Full medication regimen instructions delivered to patient. Verified no known allergies.'
    );
  };

  // Process Payment in Birr & Dispense
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPrescription) return;
    setIsProcessingPayment(true);

    const res = await apiFetch(`/pharmacy/prescriptions/${checkoutPrescription.id}/pay`, {
      method: 'POST',
      body: JSON.stringify({
        paymentMethod,
        amount: Number(checkoutPrescription.totalAmount),
        transactionRef: paymentTxnRef,
        payerPhone: paymentPayerPhone,
        payerAccount: paymentPayerAccount,
        payerName: paymentPayerName,
        dispenseImmediately: true,
        dispensationNotes: paymentDispensationNotes,
      }),
    });

    setIsProcessingPayment(false);
    if (res.success) {
      setStatusMsg(
        `Payment of ${checkoutPrescription.totalAmount} ETB verified! Drugs dispensed for ${checkoutPrescription.patient?.fullName}.`
      );
      setSelectedReceipt(res.data);
      setCheckoutPrescription(null);
      await loadPharmacyData();
    } else {
      alert(`Error processing pharmacy payment: ${res.error?.message}`);
    }
  };

  // Add Medication to Hospital Formulary
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName) return;
    setIsSubmittingMed(true);

    const res = await apiFetch('/pharmacy/medications', {
      method: 'POST',
      body: JSON.stringify({
        name: newMedName,
        genericName: newMedGeneric || undefined,
        category: newMedCategory,
        strength: newMedStrength,
        dosageForm: newMedDosageForm,
        unitPrice: Number(newMedPrice),
        stockQuantity: Number(newMedStock),
        batchNumber: newMedBatch || undefined,
        manufactureDate: newMedManufactureDate || undefined,
        expiryDate: newMedExpiryDate || undefined,
        hospitalInputDate: newMedHospitalInputDate || undefined,
        requiresPrescription: true,
      }),
    });

    setIsSubmittingMed(false);
    if (res.success) {
      setIsAddingMed(false);
      setNewMedName('');
      setNewMedGeneric('');
      setStatusMsg(`Medication "${newMedName}" added to hospital inventory!`);
      await loadPharmacyData();
    } else {
      alert(`Error adding medication: ${res.error?.message}`);
    }
  };

  // Update Medication in Hospital Formulary
  const handleUpdateMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;
    setIsSubmittingEditMed(true);
    try {
      const res = await apiFetch(`/pharmacy/medications/${editingMed.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editingMed.name,
          genericName: editingMed.genericName,
          category: editingMed.category,
          strength: editingMed.strength,
          dosageForm: editingMed.dosageForm,
          unitPrice: Number(editingMed.unitPrice),
          stockQuantity: Number(editingMed.stockQuantity),
          batchNumber: editingMed.batchNumber,
          manufactureDate: editingMed.manufactureDate || null,
          expiryDate: editingMed.expiryDate || null,
          hospitalInputDate: editingMed.hospitalInputDate || null,
        }),
      });
      if (res.success) {
        setStatusMsg(`Drug "${editingMed.name}" updated successfully in database!`);
        setEditingMed(null);
        await loadPharmacyData();
      } else {
        alert(`Error updating medication: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating medication.');
    } finally {
      setIsSubmittingEditMed(false);
    }
  };

  // Delete Medication from Hospital Formulary
  const handleDeleteMedication = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the hospital pharmacy formulary?`)) {
      return;
    }
    try {
      const res = await apiFetch(`/pharmacy/medications/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setStatusMsg(`Medication "${name}" removed from hospital formulary.`);
        await loadPharmacyData();
      } else {
        alert(`Error deleting medication: ${res.error?.message}`);
      }
    } catch (err: any) {
      alert(err?.message || 'Error deleting medication.');
    }
  };

  if (isLoading || !user) {
    return <div className="p-10 text-center text-slate-500">Loading Hospital Pharmacy Console...</div>;
  }

  // Filtered Prescriptions
  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesFilter =
      queueFilter === 'ALL'
        ? true
        : rx.status === queueFilter;

    const matchesSearch =
      searchQuery.trim() === '' ||
      rx.prescriptionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patient?.patientNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = prescriptions.filter((r) => r.status === 'PENDING').length;
  const paidCount = prescriptions.filter((r) => r.status === 'PAID').length;
  const dispensedCount = prescriptions.filter((r) => r.status === 'DISPENSED').length;

  return (
    <DashboardLayout
      roleTitle="Pharmacy & Drug Dispensation"
      roleBadge="💊 Hospital Pharmacist"
      roleColor="teal"
      activeItemId={activeTab}
      onSelectNav={(id) => setActiveTab(id as any)}
      headerTitle={
        activeTab === 'queue'
          ? 'Hospital Pharmacy Prescription & Medication Dispensation Queue'
          : activeTab === 'inventory'
          ? 'Hospital Drug Formulary & Medication Inventory'
          : 'Dispensation Records & Pharmacy Revenue'
      }
      headerSubtitle={`Hospital: ${activeMembership?.clinicName} • Pharmacist: ${user.fullName}`}
      headerActions={
        <div className="flex items-center space-x-2">
          {statusMsg && (
            <span className="hidden sm:inline-block px-3 py-1 rounded-lg text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
              {statusMsg}
            </span>
          )}
          <button
            onClick={loadPharmacyData}
            disabled={isDataLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin text-teal-600' : ''}`} />
            <span>{isDataLoading ? 'Syncing...' : 'Sync Pharmacy'}</span>
          </button>
        </div>
      }
      navGroups={[
        {
          groupLabel: 'Pharmacy Operations',
          items: [
            {
              id: 'queue',
              label: 'Prescription Queue',
              icon: Pill,
              badge: pendingCount > 0 ? pendingCount : undefined,
              badgeColor: 'bg-amber-100 text-amber-800 font-bold',
            },
            {
              id: 'inventory',
              label: 'Drug Formulary',
              icon: Package,
              badge: medications.length,
            },
            {
              id: 'history',
              label: 'Dispensed History',
              icon: PackageCheck,
              badge: dispensedCount,
              badgeColor: 'bg-emerald-100 text-emerald-800',
            },
          ],
        },
      ]}
    >
      {/* Real-time Pharmacy Alert for Incoming Physician Prescriptions */}
      {pendingCount > 0 && (
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 text-white shadow-lg border border-teal-300 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 shadow-inner">
              <Pill className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white text-teal-900 text-[10px] font-black uppercase tracking-wider shadow-xs">
                  🔔 Incoming Drug Order
                </span>
                <span className="text-xs font-bold text-teal-100">
                  {pendingCount} Prescription{pendingCount > 1 ? 's' : ''} Ordered by Physicians
                </span>
              </div>
              <p className="text-xs font-semibold text-white mt-1">
                Latest Patient: <strong>{prescriptions.find((p) => p.status === 'PENDING')?.patient?.fullName}</strong> — Awaiting Drug Payment Confirmation in Birr & Dispensation.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setActiveTab('queue');
                const firstPending = prescriptions.find((p) => p.status === 'PENDING');
                if (firstPending) openCheckoutModal(firstPending);
              }}
              className="px-4 py-2.5 bg-white hover:bg-teal-50 text-teal-900 rounded-xl text-xs font-black transition shadow-md hover:scale-105 active:scale-95"
            >
              Confirm Drug Payment & Dispense →
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: PRESCRIPTION QUEUE & CHECKOUT
          ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-100 uppercase tracking-wider">Awaiting Payment in Birr</p>
                <h3 className="text-2xl font-black">{pendingCount} Prescriptions</h3>
                <p className="text-[11px] text-amber-100 mt-0.5">Patients at pharmacy checkout</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Paid / Ready to Dispense</p>
                <h3 className="text-2xl font-black">{paidCount} Orders</h3>
                <p className="text-[11px] text-blue-100 mt-0.5">Settled via Telebirr or CBE</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Dispensed Today</p>
                <h3 className="text-2xl font-black">{dispensedCount} Completed</h3>
                <p className="text-[11px] text-emerald-100 mt-0.5">Medications handed to patients</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <PackageCheck className="w-5 h-5 text-white" />
              </div>
            </div>

            <div
              onClick={() => setActiveTab('inventory')}
              className={`rounded-2xl p-4 text-white shadow-sm flex items-center justify-between cursor-pointer transition hover:scale-[1.02] ${
                expiringSoonCount > 0
                  ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 ring-2 ring-rose-400'
                  : 'bg-gradient-to-r from-slate-700 to-slate-800'
              }`}
            >
              <div>
                <p className="text-xs font-semibold text-rose-100 uppercase tracking-wider">Expiry Warning (&lt; 60d)</p>
                <h3 className="text-2xl font-black">{expiringSoonCount} Drug{expiringSoonCount !== 1 ? 's' : ''}</h3>
                <p className="text-[11px] text-rose-100 mt-0.5">
                  {expiringSoonCount > 0 ? '⚠️ Immediate rotation needed' : 'All formulary stocks healthy'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {(['ALL', 'PENDING', 'PAID', 'DISPENSED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setQueueFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    queueFilter === filter
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {filter === 'ALL'
                    ? 'All Orders'
                    : filter === 'PENDING'
                    ? `Pending Payment (${pendingCount})`
                    : filter === 'PAID'
                    ? `Paid (${paidCount})`
                    : `Dispensed (${dispensedCount})`}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search RX #, patient name, diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Prescriptions List */}
          <div className="space-y-4">
            {filteredPrescriptions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
                No prescription orders found matching current filter.
              </div>
            ) : (
              filteredPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-teal-300 transition space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                          {rx.prescriptionNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{rx.patient?.fullName}</h4>
                        <span className="text-xs font-mono text-slate-400">({rx.patient?.patientNumber})</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            rx.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : rx.status === 'PAID'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rx.status === 'PENDING' ? 'AWAITING PAYMENT' : rx.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Prescribed by: <strong className="text-slate-700">Dr. {rx.doctor?.fullName}</strong> • Diagnosis:{' '}
                        <span className="text-slate-800 font-medium">{rx.diagnosis}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right sm:mr-3">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Amount Due</span>
                        <span className="text-base font-black text-slate-900 font-mono">
                          {Number(rx.totalAmount).toFixed(2)} ETB
                        </span>
                      </div>

                      {rx.status === 'PENDING' && (
                        <button
                          onClick={() => openCheckoutModal(rx)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Collect Birr & Dispense</span>
                        </button>
                      )}

                      {rx.status === 'PAID' && (
                        <button
                          onClick={() => openCheckoutModal(rx)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Dispense Drugs</span>
                        </button>
                      )}

                      {rx.status === 'DISPENSED' && (
                        <button
                          onClick={() => setSelectedReceipt(rx)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5 text-teal-600" />
                          <span>View Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prescribed Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase">
                        <tr>
                          <th className="py-2 px-3">Medication / Drug Name</th>
                          <th className="py-2 px-3">Dosage & Strength</th>
                          <th className="py-2 px-3">Frequency</th>
                          <th className="py-2 px-3">Duration</th>
                          <th className="py-2 px-3">Qty</th>
                          <th className="py-2 px-3 text-right">Unit Price</th>
                          <th className="py-2 px-3 text-right">Total (Birr)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(rx.items || []).map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-teal-600" />
                              <span>{item.drugName}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{item.dosage}</td>
                            <td className="py-2 px-3 text-slate-600">{item.frequency}</td>
                            <td className="py-2 px-3 text-slate-600">{item.duration}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">{item.quantity}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {Number(item.unitPrice).toFixed(2)} ETB
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {Number(item.totalPrice).toFixed(2)} ETB
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Instructions & Clinical Notes */}
                  {rx.notes && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      <strong>Doctor Note:</strong> {rx.notes}
                    </div>
                  )}

                  {rx.dispensationNotes && rx.status === 'DISPENSED' && (
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                      <div>
                        <strong>Pharmacist Dispensation: </strong>
                        <span>{rx.dispensationNotes}</span>
                      </div>
                      <span className="text-[11px] text-emerald-800 font-semibold">
                        Dispensed by {rx.dispensedBy} at {new Date(rx.dispensedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: HOSPITAL DRUG FORMULARY & INVENTORY (WITH EXPIRATION & INPUT DATES)
          ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                <span>Hospital Pharmacy Medication Formulary & Stock Inventory</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official hospital drug catalogue tracking Manufacture Date, Hospital Input Date, Expiry Date, and automatic expiration warnings (&lt; 60 days).
              </p>
            </div>

            <button
              onClick={() => setIsAddingMed(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5 w-fit"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Medication</span>
            </button>
          </div>

          {/* Quick Notice if any drug is below 60 days */}
          {expiringSoonCount > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-bounce" />
              <div>
                <span className="font-bold">⚠️ Hospital Quality & Safety Notice:</span> There are{' '}
                <span className="font-black text-rose-700 underline">{expiringSoonCount} medication(s)</span> in the
                hospital inventory with fewer than 60 days remaining before expiration. Please inspect batches below.
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-400 uppercase border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Brand / Drug & Batch</th>
                  <th className="py-2.5 px-4 font-semibold">Category & Form</th>
                  <th className="py-2.5 px-4 font-semibold">Manufacture Date</th>
                  <th className="py-2.5 px-4 font-semibold">Hospital Input Date</th>
                  <th className="py-2.5 px-4 font-semibold">Expiry Date</th>
                  <th className="py-2.5 px-4 font-semibold">Days Countdown & Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Price & Stock</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {medications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No medications in hospital formulary.
                    </td>
                  </tr>
                ) : (
                  medications.map((med) => {
                    const exp = getExpiryDetails(med.expiryDate);
                    const mfgStr = med.manufactureDate
                      ? new Date(med.manufactureDate).toISOString().slice(0, 10)
                      : '—';
                    const inputStr = med.hospitalInputDate
                      ? new Date(med.hospitalInputDate).toISOString().slice(0, 10)
                      : med.createdAt
                      ? new Date(med.createdAt).toISOString().slice(0, 10)
                      : '—';
                    const expStr = med.expiryDate
                      ? new Date(med.expiryDate).toISOString().slice(0, 10)
                      : '—';

                    return (
                      <tr
                        key={med.id}
                        className={`hover:bg-slate-50/70 transition ${
                          exp.isWarning ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Pill className={`w-3.5 h-3.5 ${exp.isWarning ? 'text-amber-600' : 'text-teal-600'}`} />
                            <span>{med.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Batch: {med.batchNumber || 'BATCH-STD-01'}
                            {med.genericName ? ` • ${med.genericName}` : ''}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {med.category}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {med.strength} ({med.dosageForm})
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{mfgStr}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-3 h-3 text-teal-500" />
                            <span>{inputStr}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <div className="flex items-center space-x-1">
                            <Clock className={`w-3 h-3 ${exp.isWarning ? 'text-rose-500' : 'text-slate-400'}`} />
                            <span>{expStr}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${exp.badgeClass}`}
                            >
                              {exp.isWarning && <AlertTriangle className="w-3 h-3 text-amber-700" />}
                              <span>{exp.label}</span>
                            </span>
                            {exp.daysLeft !== null && exp.daysLeft <= 60 && exp.daysLeft >= 0 && (
                              <div className="text-[9px] text-amber-700 font-extrabold uppercase tracking-tight">
                                ⚠️ Alert: &lt; 60 Days Threshold!
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono">
                          <div className="font-bold text-slate-900">
                            {Number(med.unitPrice).toFixed(2)} ETB
                          </div>
                          <div className="text-[11px] text-slate-500">{med.stockQuantity} in stock</div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingMed({
                                  ...med,
                                  manufactureDate: med.manufactureDate
                                    ? new Date(med.manufactureDate).toISOString().slice(0, 10)
                                    : '',
                                  expiryDate: med.expiryDate
                                    ? new Date(med.expiryDate).toISOString().slice(0, 10)
                                    : '',
                                  hospitalInputDate: med.hospitalInputDate
                                    ? new Date(med.hospitalInputDate).toISOString().slice(0, 10)
                                    : '',
                                })
                              }
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Medication"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMedication(med.id, med.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Medication"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: DISPENSATION HISTORY & REVENUE
          ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <span>Completed Medication Dispensation & Pharmacy Revenue Log</span>
          </h3>

          <div className="space-y-3">
            {prescriptions.filter((r) => r.status === 'DISPENSED').length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No dispensed prescriptions yet.
              </div>
            ) : (
              prescriptions
                .filter((r) => r.status === 'DISPENSED')
                .map((rx) => (
                  <div
                    key={rx.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-teal-800">{rx.prescriptionNumber}</span>
                        <strong className="text-slate-900">{rx.patient?.fullName}</strong>
                        <span className="text-[11px] font-mono text-slate-400">({rx.patient?.patientNumber})</span>
                      </div>
                      <div className="text-slate-500 mt-1">
                        Settled via {rx.paymentMethod} (Ref: {rx.paymentRef || 'Verified'}) • Dispensed at{' '}
                        {new Date(rx.dispensedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {Number(rx.totalAmount).toFixed(2)} ETB
                      </span>
                      <button
                        onClick={() => setSelectedReceipt(rx)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-semibold text-slate-700"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: PHARMACY PAYMENT IN BIRR & DRUG DISPENSATION CHECKOUT
          ========================================================================= */}
      {checkoutPrescription && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-800">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pharmacy Payment & Medication Checkout</h3>
                  <p className="text-xs text-slate-500">Collect Birr, verify payment, and dispense prescribed drugs</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutPrescription(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="flex-1 flex flex-col min-h-0">
              <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
              {/* Payment Channel Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Select Payment Method (Birr)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('TELEBIRR');
                      setPaymentTxnRef(`TB-0995774866-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className={`p-3 rounded-2xl border text-center transition ${
                      paymentMethod === 'TELEBIRR'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block font-bold">Telebirr</span>
                    <span className="text-[10px] text-slate-500 block">0995774866</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CBE');
                      setPaymentTxnRef(`CBE-1000305532472-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className={`p-3 rounded-2xl border text-center transition ${
                      paymentMethod === 'CBE'
                        ? 'border-purple-600 bg-purple-50/80 text-purple-900 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block font-bold">CBE Account</span>
                    <span className="text-[10px] text-slate-500 block">1000305532472</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CASH');
                      setPaymentTxnRef(`CASH-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className={`p-3 rounded-2xl border text-center transition ${
                      paymentMethod === 'CASH'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block font-bold">Cash Birr</span>
                    <span className="text-[10px] text-slate-500 block">Pharmacy Desk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CARD');
                      setPaymentTxnRef(`CARD-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className={`p-3 rounded-2xl border text-center transition ${
                      paymentMethod === 'CARD'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block font-bold">Card POS</span>
                    <span className="text-[10px] text-slate-500 block">Terminal</span>
                  </button>
                </div>
              </div>

              {/* Real Payment Instructions Box */}
              {paymentMethod === 'TELEBIRR' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-900">Telebirr Merchant / Receiver:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('0995774866', 'telebirr')}
                      className="text-[11px] text-blue-700 font-bold flex items-center gap-1"
                    >
                      {copiedField === 'telebirr' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>0995774866</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Patient transfers <strong>{checkoutPrescription.totalAmount} ETB</strong> to Telebirr{' '}
                    <strong>0995774866</strong>. Enter the transaction reference below.
                  </p>
                </div>
              )}

              {paymentMethod === 'CBE' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-900">Commercial Bank of Ethiopia:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('1000305532472', 'cbe')}
                      className="text-[11px] text-purple-700 font-bold flex items-center gap-1"
                    >
                      {copiedField === 'cbe' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>1000305532472</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-purple-800">
                    Patient transfers <strong>{checkoutPrescription.totalAmount} ETB</strong> to CBE Account{' '}
                    <strong>1000305532472</strong>.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / TXN ID</label>
                  <input
                    type="text"
                    required
                    value={paymentTxnRef}
                    onChange={(e) => setPaymentTxnRef(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500 font-mono"
                    placeholder="e.g. TB-0995774866-1049"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payer Name</label>
                  <input
                    type="text"
                    required
                    value={paymentPayerName}
                    onChange={(e) => setPaymentPayerName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pharmacist Dispensation Counseling Notes
                </label>
                <textarea
                  rows={2}
                  required
                  value={paymentDispensationNotes}
                  onChange={(e) => setPaymentDispensationNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500"
                  placeholder="Record medication usage instructions delivered to patient..."
                />
              </div>
            </div>

            {/* Pinned Sticky Action Footer */}
            <div className="flex justify-end space-x-2.5 p-4 border-t border-slate-200/80 bg-slate-50 flex-shrink-0">
              <button
                type="button"
                onClick={() => setCheckoutPrescription(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessingPayment}
                className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-md flex items-center space-x-1.5 active:scale-95"
              >
                <PackageCheck className="w-4 h-4" />
                <span>
                  {isProcessingPayment
                    ? 'Processing...'
                    : `Confirm ${checkoutPrescription.totalAmount} ETB & Dispense`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* =========================================================================
          MODAL 2: OFFICIAL PHARMACY DISPENSATION RECEIPT
          ========================================================================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header (Sticky at top) */}
            <div className="bg-gradient-to-r from-teal-700 to-emerald-800 p-5 sm:p-6 text-white text-center relative flex-shrink-0">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition text-xs font-bold"
              >
                ✕
              </button>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2 border border-white/20">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-black">Official Hospital Pharmacy Receipt</h3>
              <p className="text-xs text-teal-100 mt-0.5">{activeMembership?.clinicName || 'Hospital Pharmacy'}</p>
            </div>

            {/* Receipt Body (Scrollable middle container) */}
            <div className="p-5 sm:p-6 space-y-4 text-xs flex-1 overflow-y-auto min-h-0">
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Paid for Medications</span>
                <div className="text-3xl font-black text-slate-900 mt-1 font-mono">
                  {Number(selectedReceipt.totalAmount).toFixed(2)} ETB
                </div>
                <div className="mt-2 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Payment Verified & Drugs Dispensed</span>
                </div>
              </div>

              <div className="space-y-2 divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedReceipt.receiptNumber || 'RCP-' + selectedReceipt.prescriptionNumber}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Prescription Number:</span>
                  <span className="font-mono font-bold text-teal-800">{selectedReceipt.prescriptionNumber}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Patient Name:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.patient?.fullName}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Prescribing Doctor:</span>
                  <span className="font-semibold text-slate-800">Dr. {selectedReceipt.doctor?.fullName}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="font-bold text-slate-900">
                    {selectedReceipt.paymentMethod === 'TELEBIRR'
                      ? 'Telebirr (0995774866)'
                      : selectedReceipt.paymentMethod === 'CBE'
                      ? 'CBE (1000305532472)'
                      : 'Cash Counter'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {selectedReceipt.paymentRef || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Dispensed By:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedReceipt.dispensedBy || user?.fullName || 'Hospital Pharmacist'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Dispensed Medications:
                </span>
                {(selectedReceipt.items || []).map((item: any) => (
                  <div key={item.id} className="flex justify-between text-slate-700">
                    <span>
                      {item.drugName} ({item.dosage}) x{item.quantity}
                    </span>
                    <span className="font-mono font-semibold">{Number(item.totalPrice).toFixed(2)} ETB</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pinned Action Footer (Always Visible at bottom) */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition shadow-md active:scale-95"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ADD NEW MEDICATION TO FORMULARY
          ========================================================================= */}
      {isAddingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                <span>Add Medication to Hospital Catalogue</span>
              </h3>
              <button
                onClick={() => setIsAddingMed(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="flex-1 flex flex-col min-h-0">
              <div className="p-5 sm:p-6 space-y-3 text-xs flex-1 overflow-y-auto min-h-0">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medication Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ciprofloxacin Hydrochloride"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Generic / Active Component</label>
                  <input
                    type="text"
                    placeholder="e.g. Ciprofloxacin"
                    value={newMedGeneric}
                    onChange={(e) => setNewMedGeneric(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Therapeutic Category</label>
                    <select
                      value={newMedCategory}
                      onChange={(e) => setNewMedCategory(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Analgesics & Pain">Analgesics & Pain</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Gastrointestinal">Gastrointestinal</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Endocrinology">Endocrinology</option>
                      <option value="Vitamins & Minerals">Vitamins & Minerals</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dosage Form</label>
                    <select
                      value={newMedDosageForm}
                      onChange={(e) => setNewMedDosageForm(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup / Liquid">Syrup / Liquid</option>
                      <option value="Injection">Injection</option>
                      <option value="Inhaler">Inhaler</option>
                      <option value="Ointment / Gel">Ointment / Gel</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Strength</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 500mg"
                      value={newMedStrength}
                      onChange={(e) => setNewMedStrength(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Unit Price (Birr)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={newMedPrice}
                      onChange={(e) => setNewMedPrice(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Stock Qty</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newMedStock}
                      onChange={(e) => setNewMedStock(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>

                {/* Batch & Hospital Dates Tracking */}
                <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-2.5">
                  <div className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>Hospital Inventory & Expiration Lifecycle</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Batch / Lot Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BATCH-ETH-2026-X1"
                      value={newMedBatch}
                      onChange={(e) => setNewMedBatch(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2 bg-white outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Manufacture Date</label>
                      <input
                        type="date"
                        required
                        value={newMedManufactureDate}
                        onChange={(e) => setNewMedManufactureDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2 bg-white outline-none focus:border-teal-500 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Hospital Input Date</label>
                      <input
                        type="date"
                        required
                        value={newMedHospitalInputDate}
                        onChange={(e) => setNewMedHospitalInputDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2 bg-white outline-none focus:border-teal-500 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-rose-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        required
                        value={newMedExpiryDate}
                        onChange={(e) => setNewMedExpiryDate(e.target.value)}
                        className="w-full border border-rose-300 rounded-xl p-2 bg-rose-50/30 outline-none focus:border-rose-500 font-mono text-[11px] font-bold text-rose-900"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 italic">
                    Note: System will automatically display a persistent warning alert whenever days to expiry drop below 60 days.
                  </div>
                </div>
              </div>

              {/* Pinned Sticky Footer */}
              <div className="flex justify-end space-x-2.5 p-4 border-t border-slate-200/80 bg-slate-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddingMed(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMed}
                  className="px-5 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-sm active:scale-95"
                >
                  {isSubmittingMed ? 'Adding...' : 'Add to Formulary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: EDIT MEDICATION IN FORMULARY (FULL CRUD OPERATION)
          ========================================================================= */}
      {editingMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>Edit Medication Details</span>
              </h3>
              <button
                onClick={() => setEditingMed(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateMedication} className="flex-1 flex flex-col min-h-0">
              <div className="p-5 sm:p-6 space-y-3 text-xs flex-1 overflow-y-auto min-h-0">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medication Brand Name</label>
                  <input
                    type="text"
                    required
                    value={editingMed.name}
                    onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Generic / Active Component</label>
                  <input
                    type="text"
                    value={editingMed.genericName || ''}
                    onChange={(e) => setEditingMed({ ...editingMed, genericName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Therapeutic Category</label>
                    <input
                      type="text"
                      required
                      value={editingMed.category}
                      onChange={(e) => setEditingMed({ ...editingMed, category: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dosage Form</label>
                    <input
                      type="text"
                      required
                      value={editingMed.dosageForm}
                      onChange={(e) => setEditingMed({ ...editingMed, dosageForm: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Strength</label>
                    <input
                      type="text"
                      required
                      value={editingMed.strength}
                      onChange={(e) => setEditingMed({ ...editingMed, strength: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Unit Price (Birr)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={editingMed.unitPrice}
                      onChange={(e) => setEditingMed({ ...editingMed, unitPrice: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Stock Qty</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editingMed.stockQuantity}
                      onChange={(e) => setEditingMed({ ...editingMed, stockQuantity: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Batch & Hospital Dates Tracking */}
                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2.5">
                  <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hospital Batch & Expiry Timeline</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Batch / Lot Number</label>
                    <input
                      type="text"
                      value={editingMed.batchNumber || ''}
                      onChange={(e) => setEditingMed({ ...editingMed, batchNumber: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2 bg-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Manufacture Date</label>
                      <input
                        type="date"
                        value={editingMed.manufactureDate || ''}
                        onChange={(e) => setEditingMed({ ...editingMed, manufactureDate: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2 bg-white outline-none focus:border-blue-500 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Hospital Input Date</label>
                      <input
                        type="date"
                        value={editingMed.hospitalInputDate || ''}
                        onChange={(e) => setEditingMed({ ...editingMed, hospitalInputDate: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2 bg-white outline-none focus:border-blue-500 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-rose-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={editingMed.expiryDate || ''}
                        onChange={(e) => setEditingMed({ ...editingMed, expiryDate: e.target.value })}
                        className="w-full border border-rose-300 rounded-xl p-2 bg-rose-50/40 outline-none focus:border-rose-500 font-mono text-[11px] font-bold text-rose-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pinned Sticky Footer */}
              <div className="flex justify-end space-x-2.5 p-4 border-t border-slate-200/80 bg-slate-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEditMed}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm active:scale-95"
                >
                  {isSubmittingEditMed ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
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
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>Patient Hospital Timeline Progress: {selectedTimelineAppt.appointmentNumber || 'Dispensation Flow'}</span>
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
                prescription={checkoutPrescription}
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

