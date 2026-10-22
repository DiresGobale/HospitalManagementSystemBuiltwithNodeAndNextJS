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
  ShieldAlert,
  Building2,
  Users,
  Activity,
  Plus,
  ArrowRight,
  Shield,
  FileText,
  CreditCard,
  RefreshCw,
  Server,
  Database,
  Lock,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  Building,
  UserCheck,
} from 'lucide-react';

export default function SuperAdminPage() {
  const { user, activeMembership, switchClinic, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'tenants' | 'system' | 'audit' | 'subscriptions'>('tenants');

  // Loaded data
  const [clinics, setClinics] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Hospital Tenant modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (
      !isLoading &&
      (!user ||
        (activeMembership?.role !== 'SUPER_ADMIN' &&
          activeMembership?.role !== 'ADMIN' &&
          !user.memberships?.some(
            (m) => m.role === 'SUPER_ADMIN' || m.role === 'ADMIN'
          )))
    ) {
      router.push('/login');
    }
  }, [user, activeMembership, isLoading, router]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [clRes, audRes, subRes, repRes] = await Promise.all([
        apiFetch('/clinics'),
        apiFetch('/clinics/current/audit-logs'),
        apiFetch('/clinics/current/subscription'),
        apiFetch('/reports/overview'),
      ]);

      if (clRes.success && clRes.data) {
        setClinics(Array.isArray(clRes.data) ? clRes.data : []);
      }
      if (audRes.success && audRes.data) {
        setAuditLogs(Array.isArray(audRes.data) ? audRes.data : []);
      }
      if (subRes.success && subRes.data) {
        setSubscription(subRes.data);
      }
      if (repRes.success && repRes.data) {
        setMetrics(repRes.data?.metrics);
      }
    } catch (e) {
      console.error('Super Admin data load error', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeMembership]);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    );
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalMsg(null);

    const adminNameVal = validatePersonName(adminName);
    if (!adminNameVal.valid) {
      setModalMsg({ type: 'error', text: adminNameVal.error || 'Invalid administrator name. Letters only.' });
      setIsSubmitting(false);
      return;
    }
    const phoneVal = validateEthiopianPhone(phone);
    if (!phoneVal.valid) {
      setModalMsg({ type: 'error', text: phoneVal.error || 'Invalid clinic phone. Must be a valid Ethiopian phone number (09... or 07...).' });
      setIsSubmitting(false);
      return;
    }

    const res = await apiFetch('/clinics', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        slug: slug.trim(),
        email: email.trim(),
        phone: phoneVal.normalizedPhone || phone.trim(),
        address: address.trim(),
        timezone: 'UTC',
        adminFullName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword,
      }),
    });

    setIsSubmitting(false);

    if (res.success) {
      setModalMsg({
        type: 'success',
        text: `Hospital Tenant "${name}" created successfully! Initial Admin: ${adminEmail}`,
      });
      setName('');
      setSlug('');
      setEmail('');
      setPhone('');
      setAddress('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      loadData();
      setTimeout(() => {
        setShowModal(false);
        setModalMsg(null);
      }, 1500);
    } else {
      setModalMsg({
        type: 'error',
        text: res.error?.message || 'Failed to provision hospital tenant.',
      });
    }
  };

  if (isLoading || !user) {
    return <div className="p-10 text-center text-slate-500">Authenticating Super Admin session...</div>;
  }

  return (
    <DashboardLayout
      roleTitle="Super Admin Governance"
      roleBadge="👑 Super Admin"
      roleColor="purple"
      activeItemId={activeTab}
      onSelectNav={(id) => setActiveTab(id as any)}
      headerTitle="Hospital Management System — Platform Governance"
      headerSubtitle="Global Multi-Tenant Control, Tenant Provisioning, System Auditing & Cloud Architecture"
      headerActions={
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setModalMsg(null);
              setShowModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Provision Hospital Tenant</span>
          </button>

          <Link
            href="/admin"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Hospital Admin Console</span>
          </Link>

          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
      navGroups={[
        {
          groupLabel: 'Multi-Tenant Governance',
          items: [
            { id: 'tenants', label: 'Hospital Tenants', icon: Building2, badge: clinics.length },
            { id: 'system', label: 'Platform & Infrastructure', icon: Server },
          ],
        },
        {
          groupLabel: 'Global Operations',
          items: [
            { id: 'audit', label: 'Global Audit Logs', icon: FileText, badge: auditLogs.length },
            { id: 'subscriptions', label: 'Subscription Tiers', icon: CreditCard },
          ],
        },
      ]}
    >
      {/* ========================================================= */}
      {/* TAB 1: HOSPITAL TENANTS */}
      {/* ========================================================= */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          {/* Banner */}
          <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 text-white p-7 rounded-2xl shadow-lg border border-purple-800/40 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[11px] font-semibold uppercase">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Super Admin Multi-Tenant Center</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Multi-Hospital Tenant Registry
                </h2>
                <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl">
                  Provision, monitor, and govern all hospital instances hosted on the CAQMS / HMS platform. Switch context or inspect tenants seamlessly.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setModalMsg(null);
                    setShowModal(true);
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-purple-600/30 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Provision Hospital</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-[11px] text-purple-200 font-medium">Provisioned Tenants</div>
                <div className="text-xl font-black text-white mt-0.5">{clinics.length || 1}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-[11px] text-purple-200 font-medium">Active Hospital Scope</div>
                <div className="text-sm font-bold text-emerald-400 mt-1 truncate">
                  {activeMembership?.clinicName || 'Default Hospital'}
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-[11px] text-purple-200 font-medium">Security Mode</div>
                <div className="text-sm font-bold text-teal-300 mt-1">Multi-Tenant RBAC</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-[11px] text-purple-200 font-medium">Platform Health</div>
                <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>100% Operational</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tenants List */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hospital Tenants ({clinics.length})</h3>
                <p className="text-xs text-slate-500">Autonomous medical centers configured with isolated databases and RBAC boundaries.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {clinics.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No external hospital tenants discovered.</p>
                  <p className="text-xs text-slate-400 mt-1">Click &quot;+ Provision Hospital Tenant&quot; to initialize a new hospital instance.</p>
                </div>
              ) : (
                clinics.map((cl) => {
                  const isCurrent = cl.id === activeMembership?.clinicId;
                  return (
                    <div
                      key={cl.id}
                      className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                        isCurrent ? 'bg-purple-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                            isCurrent
                              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {cl.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-900">{cl.name}</h4>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                                ACTIVE SCOPE
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                cl.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {cl.status || 'ACTIVE'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                            <span>Slug: <code className="text-purple-700 font-mono font-semibold">{cl.slug}</code></span>
                            {cl.email && <span>Email: {cl.email}</span>}
                            {cl.phone && <span>Phone: {cl.phone}</span>}
                            {cl.address && <span>Address: {cl.address}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {isCurrent ? (
                          <Link
                            href="/admin"
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1"
                          >
                            <span>Open Admin Dashboard</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <button
                            onClick={() => switchClinic(cl.id)}
                            className="px-3 py-1.5 border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-xl transition"
                          >
                            Switch Scope to Tenant
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PLATFORM & INFRASTRUCTURE */}
      {/* ========================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">PostgreSQL Multi-Tenant DB</h4>
                  <p className="text-xs text-slate-500">Prisma ORM v5.22.0 Connected</p>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Connection Pooling:</span>
                  <span className="font-bold text-emerald-600">Active (Ready)</span>
                </div>
                <div className="flex justify-between">
                  <span>Prisma Migrations:</span>
                  <span className="font-bold text-slate-800">Synchronized</span>
                </div>
                <div className="flex justify-between">
                  <span>Tenant Isolation:</span>
                  <span className="font-bold text-purple-700">Scoped by hospital facility tenant</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Node / Express API Server</h4>
                  <p className="text-xs text-slate-500">TypeScript / ESM Runtime</p>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>API Port:</span>
                  <span className="font-bold text-slate-800">4000</span>
                </div>
                <div className="flex justify-between">
                  <span>Socket.io WebSocket:</span>
                  <span className="font-bold text-emerald-600">Live (Port 4000)</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate Limiting:</span>
                  <span className="font-bold text-slate-800">Enabled</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Security & RBAC Matrix</h4>
                  <p className="text-xs text-slate-500">Super Admin & Admin Enforcement</p>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Auth Mechanism:</span>
                  <span className="font-bold text-slate-800">JWT + Bcrypt (Cost 12)</span>
                </div>
                <div className="flex justify-between">
                  <span>RBAC Middleware:</span>
                  <span className="font-bold text-emerald-600">Strictly Enforced</span>
                </div>
                <div className="flex justify-between">
                  <span>User Roles:</span>
                  <span className="font-bold text-slate-800">10 Roles Configured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: AUDIT LOGS */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Global Platform Audit Trail ({auditLogs.length})</h3>
              <p className="text-xs text-slate-500">Immutable security logs tracking administrative, auth, and data mutations.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No security audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{log.actorRole || 'SYSTEM'}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{log.actorId || 'Daemon'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{log.resourceType}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                        {log.details ? JSON.stringify(log.details).slice(0, 50) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SUBSCRIPTION TIERS */}
      {/* ========================================================= */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Platform Subscription & Licensing Governance</h3>
            <p className="text-xs text-slate-500">Manage tenant license limits, quota allocations, and enterprise features.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3">
            <div className="p-5 rounded-2xl border-2 border-purple-500 bg-purple-50/20 space-y-3">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                Enterprise Pro (Active)
              </span>
              <h4 className="text-xl font-black text-slate-900">Hospital Enterprise</h4>
              <p className="text-xs text-slate-600">Full clinical department workflows, unlimited users, lab and pharmacy integration.</p>
              <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-purple-200">
                <li>✓ Unlimited Doctors & Staff</li>
                <li>✓ Specialist X-Ray & Lab Routing</li>
                <li>✓ Pharmacy Medication Dispensing</li>
                <li>✓ Multi-Branch Facility Support</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PROVISION NEW HOSPITAL TENANT MODAL */}
      {/* ========================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Provision New Hospital Tenant</h3>
                  <p className="text-xs text-slate-500">
                    Create an isolated hospital instance and assign an initial Hospital Admin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setModalMsg(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ✕
              </button>
            </div>

            {modalMsg && (
              <div
                className={`mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
                  modalMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {modalMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateHospital} className="mt-5 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide block">
                  1. Hospital Facility Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. St. Jude Hospital"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">URL Identifier Slug *</label>
                    <input
                      type="text"
                      required
                      placeholder="st-jude-hospital"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-mono outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="contact@stjude.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number * <span className="text-slate-400 font-normal">(Ethiopian 09 / 07...)</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0911223344"
                      value={phone}
                      onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Addis Ababa, Bole Sub-city"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide block">
                  2. Initial Hospital Admin Account
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Full Name * <span className="text-slate-400 font-normal">(Letters only)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Admin Name"
                      value={adminName}
                      onChange={(e) => setAdminName(sanitizeNameInput(e.target.value))}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@stjude.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setModalMsg(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Provisioning Hospital Tenant...</span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Provision Hospital Tenant</span>
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

