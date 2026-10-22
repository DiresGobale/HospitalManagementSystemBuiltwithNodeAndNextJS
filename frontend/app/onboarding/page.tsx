'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import {
  sanitizeNameInput,
  sanitizePhoneInput,
  validatePersonName,
  validateEthiopianPhone,
} from '../../lib/validation';
import { Building, Shield, CheckCircle, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [clinicName, setClinicName] = useState('');
  const [slug, setSlug] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleNameChange = (val: string) => {
    setClinicName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const adminNameVal = validatePersonName(adminName);
    if (!adminNameVal.valid) {
      setErrorMsg(adminNameVal.error || 'Invalid admin name. Letters and characters only.');
      setIsSubmitting(false);
      return;
    }
    const phoneVal = validateEthiopianPhone(clinicPhone);
    if (!phoneVal.valid) {
      setErrorMsg(phoneVal.error || 'Invalid clinic phone. Must be a valid Ethiopian phone number (09... or 07...).');
      setIsSubmitting(false);
      return;
    }

    const res = await apiFetch('/clinics', {
      method: 'POST',
      body: JSON.stringify({
        name: clinicName,
        slug,
        email: clinicEmail,
        phone: phoneVal.normalizedPhone || clinicPhone,
        address: clinicAddress,
        timezone,
        adminFullName: adminName.trim(),
        adminEmail,
        adminPassword,
      }),
    });

    if (res.success) {
      // Auto-login as new admin
      const loggedIn = await login(adminEmail, adminPassword);
      if (loggedIn) {
        router.push('/admin');
      } else {
        router.push('/login');
      }
    } else {
      setErrorMsg(res.error?.message || 'Clinic registration failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <Building className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Register New Clinic</h1>
            <p className="text-sm text-slate-500 mt-1">
              Initialize a dedicated clinic tenant with isolated users, services, queues, and settings.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-800">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span>Clinic Organization Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Name</label>
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Apex Medical Care"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unique URL Slug</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="apex-medical-care"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Email</label>
                  <input
                    type="email"
                    required
                    value={clinicEmail}
                    onChange={(e) => setClinicEmail(e.target.value)}
                    placeholder="contact@apexmed.com"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone <span className="text-slate-400 font-normal">(Ethiopian 09 / 07... numbers only)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(sanitizePhoneInput(e.target.value))}
                    placeholder="0911223344 or +251911223344"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Address</label>
                  <input
                    type="text"
                    required
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="123 Health Ave, Suite 400"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span>Primary Clinic Administrator (Owner)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Full Name <span className="text-slate-400 font-normal">(Letters & chars only)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(sanitizeNameInput(e.target.value))}
                    placeholder="Dr. Gregory Owner"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email (Login)</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@apexmed.com"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Initializing Tenant Database...</span>
                ) : (
                  <>
                    <span>Complete Clinic Registration</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

