'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleDashboardPath } from '../../lib/auth-context';
import { Navbar } from '../../components/Navbar';
import { apiFetch } from '../../lib/api';
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Activity,
  HeartHandshake,
  Clock,
  Sparkles,
  ArrowRight,
  Check,
  LogIn,
} from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { user, activeMembership, registerPatient } = useAuth();

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('PREFER_NOT_TO_SAY');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Clinic options
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [availableClinics, setAvailableClinics] = useState<any[]>([]);

  // Submission feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load available clinics for patient self-registration
  useEffect(() => {
    async function loadClinics() {
      const res = await apiFetch<any[]>('/clinics/public');
      if (res.success && res.data) {
        setAvailableClinics(res.data);
        if (res.data.length > 0) {
          setSelectedClinicId(res.data[0].id);
        }
      }
    }
    loadClinics();
  }, []);

  // If already authenticated, redirect to respective role dashboard
  useEffect(() => {
    if (user && activeMembership?.role) {
      router.push(getRoleDashboardPath(activeMembership.role));
    }
  }, [user, activeMembership, router]);

  // Compute password strength
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

  const passwordStrength = getPasswordStrength(password);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !phone.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('You must agree to the Patient Privacy Policy and Terms of Care.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await registerPatient({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      dateOfBirth: dateOfBirth || undefined,
      address: address.trim() || undefined,
      gender: gender !== 'PREFER_NOT_TO_SAY' ? gender : undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      clinicId: selectedClinicId || undefined,
    });

    setIsLoading(false);

    if (res.success) {
      // Clear any auto-login session so patient logs in deliberately per required workflow
      try {
        localStorage.removeItem('caqms_access_token');
        localStorage.removeItem('caqms_refresh_token');
        localStorage.removeItem('caqms_active_clinic_id');
      } catch (e) {}

      setSuccessMsg('Patient account registered successfully! Redirecting to login page...');
      setTimeout(() => {
        router.push(`/login?registered=true&email=${encodeURIComponent(email.trim())}`);
      }, 1000);
    } else {
      setErrorMsg(res.error || 'Failed to create patient account. This email may already be registered.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-stretch">
        <div className="w-full max-w-7xl mx-auto lg:grid lg:grid-cols-12 flex-1 shadow-sm overflow-hidden">
          {/* ========================================================= */}
          {/* LEFT COLUMN: BRAND HERO & PATIENT BENEFITS (5 COLS) */}
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
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Free Remote Patient Access</span>
                </div>

                <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Your Health.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                    Zero Waiting Rooms.
                  </span>
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                  Register in seconds to connect with top clinicians, schedule consultations, and monitor your live waiting queue position from anywhere.
                </p>
              </div>

              {/* Patient Care Highlights */}
              <div className="mt-8 space-y-4">
                <div className="flex items-start space-x-3 text-xs text-slate-200">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Instant Medical Record Setup</strong>
                    <span className="text-slate-400">Generates your unique patient ID immediately upon registration.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs text-slate-200">
                  <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Live Tele-Queue Tracking</strong>
                    <span className="text-slate-400">Track current token in service and estimated countdown from home.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs text-slate-200">
                  <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">HIPAA & GDPR Certified Security</strong>
                    <span className="text-slate-400">Your protected health information is encrypted and isolated.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Trust & Compliance Footer */}
            <div className="relative z-10 pt-8 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-xl font-black text-white block">100%</span>
                  <span className="text-[11px] text-slate-400">Remote Self-Service</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-xl font-black text-white block">&lt; 1 min</span>
                  <span className="text-[11px] text-slate-400">Average Sign Up Time</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>🔒 256-bit SSL Data Encryption</span>
                <span>• ISO 27001 Certified</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: SIGN UP FORM ONLY (7 COLS) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 xl:p-12 flex flex-col justify-center overflow-y-auto">
            <div className="max-w-xl w-full mx-auto py-4">
              <div className="mb-6">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2.5 border border-blue-200">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Patient Remote Self-Registration</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Create New Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Join our telehealth network to schedule appointments and view live wait queues from home.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block">Registration Error</strong>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 p-3.5 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block">Account Created Successfully</strong>
                    <span>{successMsg}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                {/* Section 1: Personal Identification */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    1. Patient Identification
                  </span>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. hospital patient"
                        className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="hospital@example.com"
                          className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+251 995 774 866"
                          className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                      >
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                        <option value="FEMALE">Female</option>
                        <option value="MALE">Male</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Clinical Association & Location */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    2. Primary Hospital Facility & Contact
                  </span>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Preferred Hospital Facility / Branch <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={selectedClinicId}
                        onChange={(e) => setSelectedClinicId(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition font-medium"
                      >
                        {availableClinics.length > 0 ? (
                          availableClinics.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.address ? `• ${c.address}` : ''}
                            </option>
                          ))
                        ) : (
                          <option value="">Metro Health Main Center (Default)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Residential Address
                      </label>
                      <div className="relative">
                        <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Street, City, State"
                          className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Emergency Contact Phone
                      </label>
                      <div className="relative">
                        <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="+251 995 774 866"
                          className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Credentials & Security */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    3. Account Security Credentials
                  </span>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Create Portal Password <span className="text-rose-500">*</span>
                      </label>
                      {password && (
                        <span className="text-[10px] font-bold text-slate-600">
                          Strength: <span className="uppercase">{passwordStrength.label}</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Visual Password Strength Bar */}
                    {password && (
                      <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      {confirmPassword && (
                        <span className={`text-[10px] font-bold ${password === confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {password === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full text-xs border rounded-xl pl-9 pr-10 py-2.5 bg-white outline-none transition ${
                          confirmPassword && password !== confirmPassword
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-100'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-100'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms & Consent */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      required
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <span className="leading-relaxed">
                      I agree to the <strong className="text-slate-900">Digital Patient Terms of Service</strong> and acknowledge receipt of the <strong className="text-slate-900">HIPAA Privacy Notice</strong> for telehealth data management.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm hover:shadow flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Patient Profile in Database...</span>
                    </div>
                  ) : (
                    <>
                      <span>Complete Registration & Access Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Dedicated "Already have an account? Sign In" Navigation at the bottom */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    Already registered with HMS Hospital?
                  </p>
                  <Link
                    href="/login"
                    className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 border-slate-300 hover:border-blue-600 text-slate-700 hover:text-blue-600 font-bold text-xs sm:text-sm transition-all duration-200 group"
                  >
                    <LogIn className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                    <span>Sign In to Existing Account</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

