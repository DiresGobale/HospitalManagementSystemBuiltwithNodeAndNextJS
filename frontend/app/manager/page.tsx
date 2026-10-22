'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DashboardLayout } from '../../components/DashboardLayout';
import { apiFetch } from '../../lib/api';
import {
  Users,
  Calendar,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Radio,
  Layers,
  TrendingUp,
  RefreshCw,
  Search,
  Stethoscope,
  UserPlus,
  Play,
  Pause,
  XCircle,
  CheckSquare,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';

export default function ManagerDashboardPage() {
  const { user, activeMembership, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'sessions' | 'patients' | 'doctors' | 'reports'>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [queueSessions, setQueueSessions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Patient Registration form state
  const [newPtName, setNewPtName] = useState('');
  const [newPtPhone, setNewPtPhone] = useState('');
  const [newPtEmail, setNewPtEmail] = useState('');
  const [ptMsg, setPtMsg] = useState('');
  const [isSavingPt, setIsSavingPt] = useState(false);

  // New Queue Session form state
  const [sessionBranchId, setSessionBranchId] = useState('');
  const [sessionDoctorId, setSessionDoctorId] = useState('');
  const [sessionMsg, setSessionMsg] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Manager CRUD modals state
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ fullName: '', email: '', phone: '', specialty: 'General Practitioner', licenseNumber: '' });
  const [isBookingAppt, setIsBookingAppt] = useState(false);
  const [newAppt, setNewAppt] = useState({ patientId: '', doctorId: '', serviceId: '', branchId: '', scheduledStartAt: '', reason: '' });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else {
        router.replace('/admin');
      }
    }
  }, [user, isLoading, router]);

  const loadManagerData = async () => {
    if (!activeMembership?.clinicId) return;

    const [ovRes, apptRes, sessRes, docRes, ptRes, brRes, srvRes] = await Promise.all([
      apiFetch('/reports/overview'),
      apiFetch('/appointments'),
      apiFetch('/queue/sessions'),
      apiFetch('/doctors'),
      apiFetch('/patients'),
      apiFetch('/clinics/current/branches'),
      apiFetch('/services'),
    ]);

    if (ovRes.success) setOverview(ovRes.data);
    if (apptRes.success) setAppointments(apptRes.data.items || []);
    if (sessRes.success) setQueueSessions(sessRes.data || []);
    if (docRes.success) setDoctors(docRes.data || []);
    if (ptRes.success) setPatients(ptRes.data.items || []);
    if (srvRes.success) setServices(srvRes.data || []);
    if (brRes.success && brRes.data.length > 0) {
      setBranches(brRes.data);
      if (!sessionBranchId) setSessionBranchId(brRes.data[0].id);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm('Are you sure you want to archive/delete this patient?')) return;
    const res = await apiFetch(`/patients/${id}`, { method: 'DELETE' });
    if (res.success) {
      alert('Patient archived successfully.');
      loadManagerData();
    } else {
      alert(`Error archiving patient: ${res.error?.message}`);
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    const res = await apiFetch(`/patients/${editingPatient.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fullName: editingPatient.fullName,
        phone: editingPatient.phone,
        email: editingPatient.email,
      }),
    });
    if (res.success) {
      alert('Patient updated successfully.');
      setEditingPatient(null);
      loadManagerData();
    } else {
      alert(`Error updating patient: ${res.error?.message}`);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to completely remove this appointment record?')) return;
    const res = await apiFetch(`/appointments/${id}`, { method: 'DELETE' });
    if (res.success) {
      alert('Appointment deleted successfully.');
      loadManagerData();
    } else {
      alert(`Error deleting appointment: ${res.error?.message}`);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppt.patientId || !newAppt.doctorId || !newAppt.scheduledStartAt) {
      alert('Please fill all required appointment fields.');
      return;
    }
    const res = await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patientId: newAppt.patientId,
        doctorId: newAppt.doctorId,
        serviceId: newAppt.serviceId || undefined,
        branchId: newAppt.branchId || branches[0]?.id,
        scheduledStartAt: new Date(newAppt.scheduledStartAt).toISOString(),
        reason: newAppt.reason || 'General Consultation',
      }),
    });
    if (res.success) {
      alert('Appointment scheduled successfully!');
      setIsBookingAppt(false);
      setNewAppt({ patientId: '', doctorId: '', serviceId: '', branchId: '', scheduledStartAt: '', reason: '' });
      loadManagerData();
    } else {
      alert(`Error scheduling appointment: ${res.error?.message}`);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to close this queue session?')) return;
    const res = await apiFetch(`/queue/sessions/${sessionId}/close`, { method: 'POST' });
    if (res.success) {
      alert('Session closed successfully.');
      loadManagerData();
    } else {
      alert(`Error closing session: ${res.error?.message}`);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/doctors', {
      method: 'POST',
      body: JSON.stringify({
        fullName: newDoctor.fullName,
        email: newDoctor.email,
        phone: newDoctor.phone,
        specialty: newDoctor.specialty,
        licenseNumber: newDoctor.licenseNumber || 'MD-' + Math.floor(10000 + Math.random() * 90000),
        branchId: branches[0]?.id,
      }),
    });
    if (res.success) {
      alert('Doctor profile created successfully!');
      setIsAddingDoctor(false);
      setNewDoctor({ fullName: '', email: '', phone: '', specialty: 'General Practitioner', licenseNumber: '' });
      loadManagerData();
    } else {
      alert(`Error creating doctor: ${res.error?.message}`);
    }
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    const res = await apiFetch(`/doctors/${editingDoctor.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fullName: editingDoctor.fullName,
        phone: editingDoctor.phone,
        specialty: editingDoctor.specialty,
        licenseNumber: editingDoctor.licenseNumber,
      }),
    });
    if (res.success) {
      alert('Doctor profile updated.');
      setEditingDoctor(null);
      loadManagerData();
    } else {
      alert(`Error updating doctor: ${res.error?.message}`);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to deactivate this doctor profile?')) return;
    const res = await apiFetch(`/doctors/${doctorId}`, { method: 'DELETE' });
    if (res.success) {
      alert('Doctor profile deactivated.');
      loadManagerData();
    } else {
      alert(`Error deactivating doctor: ${res.error?.message}`);
    }
  };

  useEffect(() => {
    if (activeMembership?.clinicId) {
      loadManagerData();
    }
  }, [activeMembership]);

  const handleCancelAppointment = async (id: string) => {
    const reason = prompt('Please enter cancellation reason:', 'Operational schedule adjustment');
    if (!reason) return;
    const res = await apiFetch(`/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellationReason: reason }),
    });
    if (res.success) {
      alert('Appointment cancelled.');
      loadManagerData();
    } else {
      alert(`Error cancelling appointment: ${res.error?.message}`);
    }
  };

  const handleMarkNoShow = async (id: string) => {
    if (!confirm('Mark this patient as NO SHOW?')) return;
    const res = await apiFetch(`/appointments/${id}/no-show`, {
      method: 'POST',
    });
    if (res.success) {
      alert('Marked as NO SHOW in database.');
      loadManagerData();
    } else {
      alert(`Error: ${res.error?.message}`);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPt(true);
    setPtMsg('');
    const res = await apiFetch('/patients', {
      method: 'POST',
      body: JSON.stringify({
        fullName: newPtName,
        phone: newPtPhone,
        email: newPtEmail || null,
      }),
    });
    setIsSavingPt(false);
    if (res.success) {
      setPtMsg(`Patient registered! Token ID: ${res.data.patientNumber}`);
      setNewPtName('');
      setNewPtPhone('');
      setNewPtEmail('');
      loadManagerData();
    } else {
      setPtMsg(`Error: ${res.error?.message || 'Failed to register patient'}`);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionBranchId) {
      alert('Please select a branch.');
      return;
    }
    setIsSavingSession(true);
    setSessionMsg('');

    const todayDateStr = new Date().toISOString().split('T')[0];
    const res = await apiFetch('/queue/sessions', {
      method: 'POST',
      body: JSON.stringify({
        branchId: sessionBranchId,
        doctorId: sessionDoctorId || undefined,
        operatingDate: todayDateStr,
      }),
    });
    setIsSavingSession(false);
    if (res.success) {
      setSessionMsg('Queue session opened in database!');
      loadManagerData();
    } else {
      setSessionMsg(`Error: ${res.error?.message || 'Failed to create queue session'}`);
    }
  };

  if (isLoading || !user) {
    return <div className="p-10 text-center text-slate-500">Loading Manager Dashboard...</div>;
  }

  const m = overview?.metrics;

  const filteredAppointments = appointments.filter((appt) => {
    const matchesStatus = statusFilter === 'ALL' || appt.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      appt.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.appointmentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.doctor?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout
      roleTitle="Hospital Operations"
      roleBadge="💼 Hospital Manager"
      roleColor="indigo"
      activeItemId={activeTab}
      onSelectNav={(id) => setActiveTab(id as any)}
      headerTitle={
        activeTab === 'overview'
          ? 'Operations Center & Flow Overview'
          : activeTab === 'appointments'
          ? 'Appointment Schedule & Flow Control'
          : activeTab === 'sessions'
          ? 'Live Queue Sessions & Counters'
          : activeTab === 'patients'
          ? 'Hospital Patient Directory'
          : activeTab === 'doctors'
          ? 'Hospital Physician Roster & Availability'
          : 'Hospital Clinical Throughput & Wait Time Reports'
      }
      headerSubtitle={`Hospital: ${activeMembership?.clinicName || 'Hospital'} • Real-Time Patient Operations`}
      headerActions={
        <button
          onClick={loadManagerData}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      }
      navGroups={[
        {
          groupLabel: 'Daily Operations',
          items: [
            { id: 'overview', label: 'Operations Overview', icon: Activity },
            { id: 'appointments', label: 'All Appointments', icon: Calendar, badge: appointments.length },
            { id: 'sessions', label: 'Queue Sessions', icon: Layers, badge: queueSessions.length },
            { id: 'patients', label: 'Patient Directory', icon: Users, badge: patients.length },
            { id: 'doctors', label: 'Physician Roster', icon: Stethoscope, badge: doctors.length },
            { id: 'reports', label: 'Throughput & KPIs', icon: TrendingUp },
          ],
        },
      ]}
    >
      {/* View 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Today Appointments</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">{m?.todayAppointments?.total ?? 0}</div>
              <p className="text-xs text-indigo-600 mt-1">Active scheduled visits</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Currently In Queue</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">{m?.waitingInQueue ?? 0}</div>
              <p className="text-xs text-amber-600 mt-1">Waiting in lobby</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Currently Serving</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">{m?.currentlyServing ?? 0}</div>
              <p className="text-xs text-purple-600 mt-1">In consultation rooms</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Avg. Wait Time</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">~{m?.averageWaitMinutes ?? 15}m</div>
              <p className="text-xs text-emerald-600 mt-1">Operational target &lt; 20m</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span>Today's Flow Summary ({appointments.length} Total Visits)</span>
              </h2>
              <button
                onClick={() => setActiveTab('appointments')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View Full Table →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] text-slate-400 uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Token / ID</th>
                    <th className="py-2.5 px-4 font-semibold">Patient</th>
                    <th className="py-2.5 px-4 font-semibold">Doctor</th>
                    <th className="py-2.5 px-4 font-semibold">Service</th>
                    <th className="py-2.5 px-4 font-semibold">Time</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.slice(0, 5).map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 text-xs">
                        {appt.appointmentNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {appt.patient?.fullName}
                        <span className="text-[11px] text-slate-400 block font-mono">{appt.patient?.patientNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">{appt.doctor?.fullName}</td>
                      <td className="py-3 px-4 text-xs">{appt.service?.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {new Date(appt.scheduledStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 2: All Appointments with Live Database Actions */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search patient, doctor, or token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="CHECKED_IN">CHECKED_IN</option>
                  <option value="IN_QUEUE">IN_QUEUE</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="NO_SHOW">NO_SHOW</option>
                </select>
              </div>
              <button
                onClick={() => setIsBookingAppt(true)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Appointment</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-400 uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Appointment #</th>
                  <th className="py-3 px-4 font-semibold">Patient</th>
                  <th className="py-3 px-4 font-semibold">Doctor</th>
                  <th className="py-3 px-4 font-semibold">Service</th>
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No appointments matching filters found.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900 text-xs">
                        {appt.appointmentNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {appt.patient?.fullName}
                        <span className="text-[11px] text-slate-400 block font-mono">{appt.patient?.patientNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-800">{appt.doctor?.fullName}</td>
                      <td className="py-3.5 px-4 text-xs">{appt.service?.name}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {new Date(appt.scheduledStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            appt.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : appt.status === 'IN_PROGRESS'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : appt.status === 'IN_QUEUE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : appt.status === 'CANCELLED' || appt.status === 'NO_SHOW'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && appt.status !== 'NO_SHOW' && (
                          <>
                            <button
                              onClick={() => handleMarkNoShow(appt.id)}
                              className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            >
                              No-Show
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(appt.id)}
                              className="text-[11px] px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteAppointment(appt.id)}
                          className="text-[11px] px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-100 text-rose-600 transition"
                          title="Delete appointment"
                        >
                          <Trash2 className="w-3 h-3 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Queue Sessions & Open New Session */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              <span>Initialize / Open New Queue Session</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Open a live session for today to enable queue counters and ticket calling in PostgreSQL.
            </p>

            {sessionMsg && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-800">
                {sessionMsg}
              </div>
            )}

            <form onSubmit={handleCreateSession} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Facility</label>
                <select
                  value={sessionBranchId}
                  onChange={(e) => setSessionBranchId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:border-indigo-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Physician (Optional)</label>
                <select
                  value={sessionDoctorId}
                  onChange={(e) => setSessionDoctorId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:border-indigo-500"
                >
                  <option value="">All Available Doctors (General Pool)</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSavingSession}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-sm"
              >
                {isSavingSession ? 'Opening...' : 'Start Session'}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {queueSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-slate-900 text-sm">
                    {session.branch?.name || 'Clinic Session'}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      {session.status}
                    </span>
                    {session.status === 'OPEN' && (
                      <button
                        onClick={() => handleCloseSession(session.id)}
                        className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                      >
                        Close Session
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Date: {new Date(session.operatingDate || session.date).toLocaleDateString()}</div>
                  <div>Active Counters: {session.queueCounters?.length || 1}</div>
                  <div>Tickets Issued: {session.queueTickets?.length || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 4: Patient Directory & Register */}
      {activeTab === 'patients' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              <span>Quick Register Patient</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">Adds a new patient profile directly to the PostgreSQL database.</p>

            {ptMsg && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-800">
                {ptMsg}
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Cooper"
                  value={newPtName}
                  onChange={(e) => setNewPtName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+1-555-0188"
                  value={newPtPhone}
                  onChange={(e) => setNewPtPhone(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="patient@mail.com"
                  value={newPtEmail}
                  onChange={(e) => setNewPtEmail(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPt}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-sm"
              >
                {isSavingPt ? 'Saving...' : 'Add Patient'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Registered Hospital Patients ({patients.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] text-slate-400 uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Patient ID</th>
                    <th className="py-2.5 px-4 font-semibold">Name</th>
                    <th className="py-2.5 px-4 font-semibold">Phone</th>
                    <th className="py-2.5 px-4 font-semibold">Email</th>
                    <th className="py-2.5 px-4 font-semibold">Registered Date</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((pt) => (
                    <tr key={pt.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-600 text-xs">{pt.patientNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{pt.fullName}</td>
                      <td className="py-3 px-4 text-xs font-mono">{pt.phone}</td>
                      <td className="py-3 px-4 text-xs">{pt.email || '—'}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {new Date(pt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setEditingPatient({ ...pt })}
                          className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit className="w-3.5 h-3.5 inline mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePatient(pt.id)}
                          className="px-2 py-1 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
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

      {/* View 5: Doctor Roster */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-indigo-600" />
              <span>Hospital Attending Physicians ({doctors.length})</span>
            </h2>
            <button
              onClick={() => setIsAddingDoctor(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Doctor Profile</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc) => (
              <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="font-bold text-slate-900 text-sm">{doc.fullName}</div>
                <div className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full w-fit">
                  {doc.specialty || 'General Practitioner'}
                </div>
                <div className="text-xs text-slate-500 font-mono">License: {doc.licenseNumber}</div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setEditingDoctor({ ...doc })}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteDoctor(doc.id)}
                    className="px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Deactivate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 6: Reports */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Daily Efficiency Breakdown</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Average Patient Wait Time</span>
                <span className="font-bold text-slate-900">~{m?.averageWaitMinutes ?? 15} min</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Cancellation Rate</span>
                <span className="font-bold text-slate-900">{m?.cancellationRatePercent ?? 0}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">No-Show Rate</span>
                <span className="font-bold text-slate-900">{m?.noShowRatePercent ?? 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Queue Throughput & Performance</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time calculations based on patient check-ins, queue token issuance, and doctor consultation completion timestamps.
            </p>
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800">
              Optimal staffing status: Normal operations. No bottleneck detected.
            </div>
          </div>
        </div>
      )}

      {/* Modal: Schedule Appointment */}
      {isBookingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Schedule New Appointment</h3>
              <button onClick={() => setIsBookingAppt(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient</label>
                <select
                  required
                  value={newAppt.patientId}
                  onChange={(e) => setNewAppt({ ...newAppt, patientId: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.patientNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor</label>
                  <select
                    required
                    value={newAppt.doctorId}
                    onChange={(e) => setNewAppt({ ...newAppt, doctorId: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service (Optional)</label>
                  <select
                    value={newAppt.serviceId}
                    onChange={(e) => setNewAppt({ ...newAppt, serviceId: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Service --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} (${Number(s.price).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newAppt.scheduledStartAt}
                  onChange={(e) => setNewAppt({ ...newAppt, scheduledStartAt: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Reason for Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Regular Follow-up or Fever"
                  value={newAppt.reason}
                  onChange={(e) => setNewAppt({ ...newAppt, reason: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingAppt(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Patient */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Edit Patient Profile</h3>
              <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdatePatient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingPatient.fullName}
                  onChange={(e) => setEditingPatient({ ...editingPatient, fullName: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={editingPatient.phone}
                  onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingPatient.email || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Doctor Profile */}
      {isAddingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Add Doctor Profile</h3>
              <button onClick={() => setIsAddingDoctor(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Gregory House"
                  value={newDoctor.fullName}
                  onChange={(e) => setNewDoctor({ ...newDoctor, fullName: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="doctor@hospital.com"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1-555-0102"
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    required
                    placeholder="Cardiologist"
                    value={newDoctor.specialty}
                    onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">License Number</label>
                <input
                  type="text"
                  placeholder="MD-49201"
                  value={newDoctor.licenseNumber}
                  onChange={(e) => setNewDoctor({ ...newDoctor, licenseNumber: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingDoctor(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Create Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Doctor Profile */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Edit Doctor Profile</h3>
              <button onClick={() => setEditingDoctor(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingDoctor.fullName}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, fullName: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={editingDoctor.phone}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.specialty}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">License Number</label>
                <input
                  type="text"
                  required
                  value={editingDoctor.licenseNumber}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, licenseNumber: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
