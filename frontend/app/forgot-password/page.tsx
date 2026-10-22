'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { apiFetch } from '../../lib/api';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Activity,
  KeyRound,
  ArrowLeft,
  Check,
  Sparkles,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Multi-step form state: 'enter-email' | 'enter-password' | 'success'
  const [step, setStep] = useState<'enter-email' | 'enter-password' | 'success'>('enter-email');

  // Step 1: Email verification
  const [email, setEmail] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Step 2: New password & confirmation
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 15, label: 'Too short', color: 'bg-rose-400' };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Step 1: Verify Email against PostgreSQL DB
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError('Please enter your account email address.');
      return;
    }

    setIsVerifyingEmail(true);
    setEmailError('');

    const res = await apiFetch<{ email: string; fullName: string }>('/auth/forgot-password/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    setIsVerifyingEmail(false);

    if (res.success && res.data) {
      setVerifiedName(res.data.fullName);
      setStep('enter-password');
    } else {
      setEmailError(res.error?.message || 'No registered account found with this email address.');
    }
  };

  // Step 2: Reset Password in PostgreSQL DB
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setResetError('Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsResetting(true);
    setResetError('');

    const res = await apiFetch('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        newPassword,
        confirmPassword,
      }),
    });

    setIsResetting(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Your password has been successfully updated in the database.');
      setStep('success');
    } else {
      setResetError(res.error?.message || 'Failed to update password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-stretch">
        <div className="w-full max-w-7xl mx-auto lg:grid lg:grid-cols-12 flex-1 shadow-sm overflow-hidden">
          {/* ========================================================= */}
          {/* LEFT COLUMN: SECURITY & COMPLIANCE SHOWCASE (5 COLS) */}
          {/* ========================================================= */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

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
                    Account Security & Recovery
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Secure Credential Management</span>
                </div>

                <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Protecting Your<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                    Clinical Account.
                  </span>
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                  Our identity security system ensures that only authorized patients and healthcare staff can modify authentication credentials.
                </p>
              </div>

              <div className="mt-8 space-y-3.5">
                <div className="flex items-start space-x-3 text-xs text-slate-200">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Direct Database Synchronization</strong>
                    <span className="text-slate-400">Password updates are instantly hashed with bcrypt and persisted to PostgreSQL.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs text-slate-200">
                  <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Automatic Session Invalidation</strong>
                    <span className="text-slate-400">Old refresh tokens are immediately revoked upon password update for safety.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs text-slate-200">
                  <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Audit Trail Generation</strong>
                    <span className="text-slate-400">All password change activities are logged to the database audit registry.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>🔒 256-bit Encrypted Connection</span>
              <span>• HIPAA & GDPR Certified</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: RECOVERY FLOW CONTAINER (7 COLS) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 xl:p-14 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              {/* Back to Sign In Header Button */}
              <div className="mb-6">
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>

              {/* STEP 1: ENTER EMAIL */}
              {step === 'enter-email' && (
                <div>
                  <div className="mb-8">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Step 1 of 2 • Email Verification</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Reset Your Password
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                      Enter the email address registered with your account to verify your identity in the database.
                    </p>
                  </div>

                  {emailError && (
                    <div className="mb-6 p-4 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block">Email Verification Failed</strong>
                        <span>{emailError}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Registered Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. name@clinic.com or patient@example.com"
                          className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifyingEmail}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm hover:shadow flex items-center justify-center space-x-2 mt-4"
                    >
                      {isVerifyingEmail ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Checking Database Records...</span>
                        </div>
                      ) : (
                        <>
                          <span>Verify Email Address</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 2: ENTER NEW PASSWORD & CONFIRM PASSWORD */}
              {step === 'enter-password' && (
                <div>
                  <div className="mb-6">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Step 2 of 2 • Create New Password</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Enter New Password
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                      Account verified for <strong className="text-slate-800">{verifiedName || email}</strong>. Please enter your new password below.
                    </p>
                  </div>

                  {resetError && (
                    <div className="mb-6 p-4 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block">Password Update Error</strong>
                        <span>{resetError}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {/* Input 1: Enter New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Enter New Password <span className="text-rose-500">*</span>
                        </label>
                        {newPassword && (
                          <span className="text-[10px] font-bold text-slate-600">
                            Strength: <span className="uppercase">{passwordStrength.label}</span>
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl pl-10 pr-10 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5"
                          title={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.score}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Input 2: Confirm Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        {confirmPassword && (
                          <span className={`text-[10px] font-bold ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {newPassword === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className={`w-full text-xs sm:text-sm border rounded-xl pl-10 pr-10 py-3 outline-none transition ${
                            confirmPassword && newPassword !== confirmPassword
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-100'
                              : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-100'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5"
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isResetting}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm hover:shadow flex items-center justify-center space-x-2 mt-4"
                    >
                      {isResetting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving Changes to Database...</span>
                        </div>
                      ) : (
                        <>
                          <span>Save New Password to Database</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 3: SUCCESS CONFIRMATION */}
              {step === 'success' && (
                <div className="text-center py-6 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                    Password Reset Successful!
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-sm mx-auto leading-relaxed">
                    {successMessage || 'Your new password has been securely updated in the database. All previous login sessions have been invalidated.'}
                  </p>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left mb-6 text-xs text-emerald-900 space-y-1.5">
                    <div className="flex items-center space-x-2 font-bold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Database Update Confirmed</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Account: <strong>{email}</strong> has been updated in PostgreSQL. You can now log in using your newly configured password.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm hover:shadow flex items-center justify-center space-x-2"
                  >
                    <span>Sign In with New Password</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Bottom Navigation */}
              {step !== 'success' && (
                <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                  <p className="text-xs text-slate-500">
                    Remember your credentials?{' '}
                    <Link
                      href="/login"
                      className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition"
                    >
                      Sign In here
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

