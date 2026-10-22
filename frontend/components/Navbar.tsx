'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { Building2, LogOut, User as UserIcon, Shield, Activity } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, activeMembership, logout, switchClinic } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {user && (
            <Link href="/" className="flex items-center space-x-2 text-blue-600 font-bold text-xl tracking-tight">
              <Activity className="h-6 w-6 text-blue-600" />
              <span>HMS Hospital</span>
            </Link>
          )}

          {activeMembership && (
            <div className="flex items-center space-x-2 text-sm bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200">
              <Building2 className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700">{activeMembership.clinicName}</span>
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                {activeMembership.role}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {user.memberships.length > 1 && (
                <select
                  aria-label="Switch active hospital"
                  className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                  value={activeMembership?.clinicId || ''}
                  onChange={(e) => switchClinic(e.target.value)}
                >
                  {user.memberships.map((m) => (
                    <option key={m.clinicId} value={m.clinicId}>
                      {m.clinicName} ({m.role})
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <UserIcon className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{user.fullName}</span>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              {pathname !== '/signup' && pathname !== '/register' && (
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded transition"
                >
                  Sign In
                </Link>
              )}
              {pathname !== '/login' && (
                <Link
                  href="/signup"
                  className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl transition shadow-sm flex items-center space-x-1"
                >
                  <span>Create New Account</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

