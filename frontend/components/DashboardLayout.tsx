'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  Building2,
  Shield,
  Users,
  Stethoscope,
  ClipboardList,
  UserCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Radio,
  ExternalLink,
  Home,
  Tv,
  LucideIcon,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeColor?: string;
  onClick?: () => void;
  href?: string;
}

export interface SidebarNavGroup {
  groupLabel?: string;
  items: SidebarNavItem[];
}

interface DashboardLayoutProps {
  roleTitle: string;
  roleBadge: string;
  roleColor?: string; // e.g. 'purple', 'indigo', 'emerald', 'amber', 'blue'
  navGroups: SidebarNavGroup[];
  activeItemId: string;
  onSelectNav?: (id: string) => void;
  headerTitle?: string;
  headerSubtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({
  roleTitle,
  roleBadge,
  roleColor = 'blue',
  navGroups,
  activeItemId,
  onSelectNav,
  headerTitle,
  headerSubtitle,
  headerActions,
  children,
}: DashboardLayoutProps) {
  const { user, activeMembership, logout, switchClinic } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clinicDropdownOpen, setClinicDropdownOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const pathname = usePathname();
  const router = useRouter();

  // Role accents
  const roleStyles: Record<string, { badgeBg: string; activeItem: string; dotColor: string }> = {
    purple: {
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      activeItem: 'bg-purple-600 text-white shadow-sm shadow-purple-200',
      dotColor: 'bg-purple-500',
    },
    indigo: {
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      activeItem: 'bg-indigo-600 text-white shadow-sm shadow-indigo-200',
      dotColor: 'bg-indigo-500',
    },
    emerald: {
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeItem: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200',
      dotColor: 'bg-emerald-500',
    },
    amber: {
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      activeItem: 'bg-amber-600 text-white shadow-sm shadow-amber-200',
      dotColor: 'bg-amber-500',
    },
    blue: {
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      activeItem: 'bg-blue-600 text-white shadow-sm shadow-blue-200',
      dotColor: 'bg-blue-500',
    },
  };

  const currentTheme = roleStyles[roleColor] || roleStyles.blue;

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-slate-200/90 select-none">
      {/* 1. Clinic & Tenant Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition">
              H
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 leading-tight">HMS Hospital</div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Hospital System</div>
            </div>
          </Link>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live</span>
          </div>
        </div>

        {/* Tenant Switcher & Active Clinic Badge */}
        <div className="relative">
          <button
            onClick={() => setClinicDropdownOpen(!clinicDropdownOpen)}
            className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition flex items-center justify-between"
          >
            <div className="min-w-0 flex-1 pr-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-500" />
                <span>Hospital Facility</span>
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">
                {activeMembership?.clinicName || 'Select Hospital'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                slug: {activeMembership?.clinicSlug || '—'}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${clinicDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Hospital Switcher Dropdown */}
          {clinicDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 text-xs">
              <div className="px-3 py-1 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                Switch Hospital Facility
              </div>
              {user?.memberships.map((m) => (
                <button
                  key={m.clinicId}
                  onClick={() => {
                    switchClinic(m.clinicId);
                    setClinicDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                    m.clinicId === activeMembership?.clinicId ? 'bg-blue-50/60 font-semibold text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div>{m.clinicName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Role: {m.role}</div>
                  </div>
                  {m.clinicId === activeMembership?.clinicId && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Console Role Tag */}
        <div className="mt-2.5 flex items-center justify-between">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${currentTheme.badgeBg}`}>
            {roleBadge}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ID: {activeMembership?.clinicId ? activeMembership.clinicId.slice(0, 8) + '...' : ''}
          </span>
        </div>
      </div>

      {/* 2. Left Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.groupLabel && (
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.groupLabel}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeItemId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else if (onSelectNav) onSelectNav(item.id);
                    else if (item.href) router.push(item.href);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] origin-left hover:shadow-sm ${
                    isActive
                      ? currentTheme.activeItem
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-transform hover:scale-105 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Global Quick Links */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Quick Navigation
          </div>
          <Link
            href="/"
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-200 transform hover:scale-[1.02] origin-left"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Hospital Portal Home</span>
          </Link>
          {activeMembership?.clinicSlug && (
            <Link
              href={`/display/${activeMembership.clinicSlug}`}
              target="_blank"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-200 transform hover:scale-[1.02] origin-left"
            >
              <div className="flex items-center space-x-3">
                <Tv className="w-4 h-4 text-slate-400" />
                <span>Waiting Room TV</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          )}
        </div>
      </div>

      {/* 2b. Zoom Controls Micro-Widget in Sidebar */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-600">
        <span className="font-semibold flex items-center gap-1.5 text-slate-700">
          <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
          <span>System Zoom</span>
        </span>
        <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.max(prev - 5, 80))}
            title="Zoom Out Dashboard"
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition transform hover:scale-110 active:scale-95"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            title="Reset to 100%"
            className="px-1.5 py-0.5 font-bold font-mono text-[10px] text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded"
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(prev + 5, 125))}
            title="Zoom In Dashboard"
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition transform hover:scale-110 active:scale-95"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3. User Profile Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2 transition transform hover:scale-[1.01]">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">
                {user?.fullName || 'Authenticated User'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition transform hover:scale-110 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Fixed Left Sidebar with Smooth Hover Elevation & Zoom */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col fixed inset-y-0 left-0 z-30 shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Slide-in Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer Menu Body */}
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-50 flex flex-col bg-white animate-in slide-in-from-left duration-250 ease-out">
            {/* Explicit Mobile Drawer Header with Close Button */}
            <div className="flex items-center justify-between p-3.5 px-4 bg-slate-50 border-b border-slate-200/80 flex-shrink-0">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Menu className="w-4 h-4 text-blue-600" />
                <span>HMS Hospital Menu</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold transition flex items-center justify-center active:scale-95"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Navigation Components Inside Scrollable Container */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 lg:pl-72 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-1 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 md:hidden transition flex items-center justify-center active:scale-95 shadow-2xs"
              aria-label="Open Hospital Sidebar Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
                <span>{activeMembership?.clinicName || 'Hospital'}</span>
                <span>/</span>
                <span className="text-slate-600 font-semibold">{roleTitle}</span>
              </div>
              {headerTitle ? (
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  {headerTitle}
                </h1>
              ) : null}
              {headerSubtitle ? (
                <p className="text-xs text-slate-500 mt-0.5">{headerSubtitle}</p>
              ) : null}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* System Zoom In / Out Bar */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-100/90 hover:bg-slate-100 p-1 rounded-xl border border-slate-200/90 text-xs shadow-2xs transition-all hover:scale-[1.02]">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(prev - 5, 80))}
                title="Zoom Out UI (Ctrl -)"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-transform hover:scale-115 active:scale-90"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                title="Reset View Zoom (100%)"
                className="px-2 py-0.5 text-[11px] font-bold font-mono text-slate-700 hover:text-blue-600 hover:bg-white rounded-md transition"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(prev + 5, 125))}
                title="Zoom In UI (Ctrl +)"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-transform hover:scale-115 active:scale-90"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {headerActions}
          </div>
        </header>

        {/* Dynamic Body Content with smooth system scaling */}
        <main
          style={{ zoom: `${zoomLevel}%` }}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto transition-all duration-150 origin-top"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

