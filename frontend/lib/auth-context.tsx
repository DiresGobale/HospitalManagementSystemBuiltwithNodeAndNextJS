'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from './api';

export interface UserMembership {
  clinicId: string;
  clinicName: string;
  clinicSlug: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'DOCTOR' | 'PATIENT' | 'RECEPTIONIST' | 'PHARMACIST' | 'SPECIALIST' | 'LABORATORY' | 'NURSING';
  department?: string;
  status: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  memberships: UserMembership[];
}

export function getRoleDashboardPath(role?: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/superadmin';
    case 'ADMIN':
      return '/admin';
    case 'MANAGER':
      return '/admin';
    case 'DOCTOR':
    case 'SPECIALIST':
      return '/doctor';
    case 'RECEPTIONIST':
      return '/receptionist';
    case 'NURSING':
      return '/nursing';
    case 'PHARMACIST':
      return '/pharmacy';
    case 'LABORATORY':
      return '/laboratory';
    case 'PATIENT':
      return '/patient';
    default:
      return '/';
  }
}

interface AuthContextType {
  user: User | null;
  activeMembership: UserMembership | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string; user?: User }>;
  registerPatient: (input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    gender?: string;
    emergencyContact?: string;
    clinicId?: string;
  }) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => void;
  switchClinic: (clinicId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  activeMembership: null,
  isLoading: true,
  login: async () => ({ success: false }),
  registerPatient: async () => ({ success: false }),
  logout: () => {},
  switchClinic: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeMembership, setActiveMembership] = useState<UserMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('caqms_access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const res = await apiFetch<User>('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        const savedClinicId = localStorage.getItem('caqms_active_clinic_id');
        const matched = res.data.memberships.find((m) => m.clinicId === savedClinicId) || res.data.memberships[0];
        if (matched) {
          setActiveMembership(matched);
          localStorage.setItem('caqms_active_clinic_id', matched.clinicId);
        }
      } else {
        localStorage.removeItem('caqms_access_token');
        localStorage.removeItem('caqms_active_clinic_id');
      }
      setIsLoading(false);
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: string; user?: User }> => {
    setIsLoading(true);
    const res = await apiFetch<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      localStorage.setItem('caqms_access_token', res.data.accessToken);
      localStorage.setItem('caqms_refresh_token', res.data.refreshToken);
      setUser(res.data.user);

      let primaryRole = 'PATIENT';
      if (res.data.user.memberships.length > 0) {
        const first = res.data.user.memberships[0];
        setActiveMembership(first);
        localStorage.setItem('caqms_active_clinic_id', first.clinicId);
        primaryRole = first.role;
      }
      setIsLoading(false);
      return { success: true, role: primaryRole, user: res.data.user };
    }

    setIsLoading(false);
    return { success: false };
  };

  const registerPatient = async (input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    gender?: string;
    emergencyContact?: string;
    clinicId?: string;
  }): Promise<{ success: boolean; error?: string; role?: string }> => {
    setIsLoading(true);
    const res = await apiFetch<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (res.success && res.data) {
      localStorage.setItem('caqms_access_token', res.data.accessToken);
      localStorage.setItem('caqms_refresh_token', res.data.refreshToken);
      setUser(res.data.user);

      let primaryRole = 'PATIENT';
      if (res.data.user.memberships && res.data.user.memberships.length > 0) {
        const first = res.data.user.memberships[0];
        setActiveMembership(first);
        localStorage.setItem('caqms_active_clinic_id', first.clinicId);
        primaryRole = first.role;
      }
      setIsLoading(false);
      return { success: true, role: primaryRole };
    }

    setIsLoading(false);
    return { success: false, error: res.error?.message || 'Registration failed' };
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('caqms_refresh_token');
    if (refreshToken) {
      apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    localStorage.removeItem('caqms_access_token');
    localStorage.removeItem('caqms_refresh_token');
    localStorage.removeItem('caqms_active_clinic_id');
    setUser(null);
    setActiveMembership(null);
    window.location.href = '/login';
  };

  const switchClinic = (clinicId: string) => {
    if (!user) return;
    const target = user.memberships.find((m) => m.clinicId === clinicId);
    if (target) {
      setActiveMembership(target);
      localStorage.setItem('caqms_active_clinic_id', target.clinicId);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, activeMembership, isLoading, login, registerPatient, logout, switchClinic }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
