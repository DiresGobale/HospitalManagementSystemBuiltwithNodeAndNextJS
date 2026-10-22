'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleDashboardPath } from '../lib/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { user, activeMembership, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user && activeMembership?.role) {
        router.replace(getRoleDashboardPath(activeMembership.role));
      } else {
        router.replace('/login');
      }
    }
  }, [user, activeMembership, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading Portal...</p>
      </div>
    </div>
  );
}
