'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  UserPlus,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, activeMembership, login } = useAuth();

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Demo accounts drawer accordion
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

              <div className="space-y-4">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Next-Generation Healthcare Portal</span>
                </div>

                <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Seamless Access.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                    Zero Waiting Rooms.
                  </span>
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                  Experience modern hospital care. Patients can schedule appointments, consult doctors, complete diagnostic X-Rays, purchase prescribed medications, and track waiting lines remotely.
                </p>
              </div>

              {/* Enterprise Feature Highlights */}
              <div className="mt-8 space-y-3.5">
                <div className="flex items-start space-x-3 text-xs text-slate-200">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Remote Online Self-Registration</strong>
                    <span className="text-slate-400">Create an official patient record instantly without physical check-in.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs text-slate-200">
                  <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Live Tele-Queue & Position Tracker</strong>
                    <span className="text-slate-400">View real-time waiting line positions and estimated consultation countdowns.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs text-slate-200">
                  <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Row-Level Tenant Security</strong>
                    <span className="text-slate-400">HIPAA & GDPR privacy standards with encrypted medical records.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Trust & Compliance Footer */}
            <div className="relative z-10 pt-8 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-xl font-black text-white block">99.99%</span>
                  <span className="text-[11px] text-slate-400">System Availability</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-xl font-black text-white block">50K+</span>
                  <span className="text-[11px] text-slate-400">Consultations Handled</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>🔒 256-bit SSL Data Encryption</span>
                <span>• ISO 27001 Certified</span>
              </div>
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

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember this device for 30 days</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm hover:shadow flex items-center justify-center space-x-2 mt-2"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating Securely...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Healthcare Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Dedicated "Create New Account" Section at the bottom */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    Don&apos;t have an account yet?
                  </p>
                  <Link
                    href="/signup"
                    className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 font-bold text-xs sm:text-sm transition-all duration-200 group"
                  >
                    <UserPlus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span>Create New Account</span>
                  </Link>
                  <p className="text-[11px] text-slate-400">
                    Exclusive online self-registration for patients • Remote queue tracking
                  </p>
                </div>
              </div>

              {/* Fast Testing & Persona Drawer Accordion */}
              <div className="mt-8 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
                >
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>System Evaluation & Testing Personas</span>
                  </div>
                  {showDemoAccounts ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showDemoAccounts && (
                  <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 animate-fadeIn">
                    <p className="text-[11px] text-slate-500">
                      Click any role below to pre-populate credentials (password: <code className="font-mono bg-white px-1 py-0.5 rounded border">Password123!</code>):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => quickFill('admin@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-purple-900 block text-[11px]">👑 Super Admin</span>
                        <span className="text-[10px] text-slate-400 block truncate">admin@metrohealth.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFill('manager@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-indigo-900 block text-[11px]">🛡️ Admin</span>
                        <span className="text-[10px] text-slate-400 block truncate">manager@metrohealth.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFill('doctor@metrohealth.com')}
                        className="p-2.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition"
                      >
                        <span className="font-bold text-emerald-900 block text-[11px]">🩺 Doctor</span>
                        <span className="text-[10px] text-slate-400 block truncate">doctor@metrohealth.com</span>
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
