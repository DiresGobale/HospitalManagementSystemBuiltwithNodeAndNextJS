'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, getRoleDashboardPath } from '../../lib/auth-context';
import { Navbar } from '../../components/Navbar';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Activity,
  Clock,
  Sparkles,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, activeMembership, login } = useAuth();

  const isNewlyRegistered = searchParams.get('registered') === 'true';
  const initialEmail = searchParams.get('email') || '';

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Demo accounts drawer accordion
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Login form state
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState(
    isNewlyRegistered
      ? 'Patient account registered successfully! Please enter your email & password to access your dashboard.'
      : ''
  );

  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // If already authenticated, redirect to respective role dashboard
  useEffect(() => {
    if (user && activeMembership?.role) {
      router.push(getRoleDashboardPath(activeMembership.role));
    }
  }, [user, activeMembership, router]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (res.success && res.role) {
      router.push(getRoleDashboardPath(res.role));
    } else {
      setErrorMsg('Invalid email or password. Please verify your credentials.');
    }
  };

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-stretch">
        <div className="w-full max-w-7xl mx-auto lg:grid lg:grid-cols-12 flex-1 shadow-sm overflow-hidden">
          {/* ========================================================= */}
          {/* LEFT COLUMN: BRAND HERO, TRUST, HEALTHCARE SHOWCASE (5 COLS) */}
          {/* ========================================================= */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
            {/* Ambient Lighting Accents */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Branding */}
            <div className="relative z-10">
              <div className="flex items-center space-x-2.5 mb-8">
                <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-400 shadow-inner">
                  <Activity className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight text-white block">
                    HMS<span className="text-blue-400">Hospital</span>
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-200/70 block">
                    Hospital Management System
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enterprise Clinical Portal</span>
              </div>

              <h2 className="text-2xl xl:text-3xl font-black tracking-tight leading-snug mb-4">
                Secure access for hospital staff & verified patients.
              </h2>
              <p className="text-slate-300 text-xs xl:text-sm leading-relaxed max-w-md">
                Streamline outpatient registration, room allocations, diagnostic imaging, and multi-departmental patient consultations in one integrated platform.
              </p>
            </div>

            {/* Middle Feature Highlights */}
            <div className="relative z-10 space-y-3.5 my-8">
              <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Role-Based Access Control</h4>
                  <p className="text-[11px] text-slate-400">
                    Dedicated portals for Super Admin, Admin, Doctor, Nursing, Laboratory & Pharmacy.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Hospital Timeline Tracking</h4>
                  <p className="text-[11px] text-slate-400">
                    Real-time room-to-room journey: Card Reception → Doctor → Specialist/Lab → Central Pharmacy.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>© {new Date().getFullYear()} HMS Hospital Systems</span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1"></span>
                <span>Active 24/7 Care</span>
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: LOGIN FORM ONLY (7 COLS) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 xl:p-14 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              <div className="mb-8">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secure Healthcare Portal</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Sign In to Your Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                  Enter your credentials to access your hospital management dashboard or patient portal.
                </p>
              </div>

              {/* Registration Success Banner */}
              {successNotice && (
                <div className="mb-6 p-4 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-sm animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Registration Completed</strong>
                    <span>{successNotice}</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block">Authentication Failed</strong>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@hospital.com or patient@example.com"
                      className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl pl-10 pr-10 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-slate-600">Remember this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Patient Sign Up Redirect */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  New patient visiting for the first time?{' '}
                  <Link
                    href="/signup"
                    className="font-bold text-blue-600 hover:text-blue-800 transition inline-flex items-center space-x-1"
                  >
                    <span>Create Patient Account</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </p>
              </div>

              {/* Quick Demo Credentials Drawer */}
              <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Quick Demo Credentials (Click to Auto-fill)</span>
                  </div>
                  {showDemoAccounts ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showDemoAccounts && (
                  <div className="p-3 border-t border-slate-200 bg-white space-y-2">
                    <p className="text-[11px] text-slate-500 px-1">
                      Password for all demo accounts is <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono font-bold">Password123!</code>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => quickFill('superadmin@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-rose-50 hover:border-rose-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-rose-900 block text-[11px]">👑 Super Admin</span>
                        <span className="text-[10px] text-slate-400 block truncate">superadmin@metrohealth.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFill('admin@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-purple-900 block text-[11px]">⚙️ Admin</span>
                        <span className="text-[10px] text-slate-400 block truncate">admin@metrohealth.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFill('doctor.sarah@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-blue-900 block text-[11px]">🩺 Doctor</span>
                        <span className="text-[10px] text-slate-400 block truncate">doctor.sarah@metrohealth.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFill('specialist.drjohn@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-cyan-50 hover:border-cyan-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-cyan-900 block text-[11px]">🔬 Specialist</span>
                        <span className="text-[10px] text-slate-400 block truncate">specialist.drjohn@metrohealth.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFill('receptionist@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-amber-900 block text-[11px]">📋 Receptionist</span>
                        <span className="text-[10px] text-slate-400 block truncate">receptionist@metrohealth.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFill('pharmacist@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-teal-900 block text-[11px]">💊 Pharmacist</span>
                        <span className="text-[10px] text-slate-400 block truncate">pharmacist@metrohealth.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFill('nurse@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-indigo-900 block text-[11px]">🧑‍⚕️ Nursing</span>
                        <span className="text-[10px] text-slate-400 block truncate">nurse@metrohealth.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFill('lab@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-purple-900 block text-[11px]">🔬 Laboratory</span>
                        <span className="text-[10px] text-slate-400 block truncate">lab@metrohealth.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFill('patient@example.com')}
                        className="p-2.5 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-blue-900 block text-[11px]">👤 Seed Patient</span>
                        <span className="text-[10px] text-slate-400 block truncate">patient@example.com</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-semibold">Loading Hospital Portal...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
