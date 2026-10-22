'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { Volume2, Building2, Clock, Activity, CheckCircle } from 'lucide-react';

export default function PublicQueueDisplayPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastCalled, setLastCalled] = useState<string | null>(null);

  const fetchBoardData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const res = await fetch(`${apiUrl}/queue/public-board/${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load public board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchBoardData();

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
      const socket = io(socketUrl, {
        query: { publicDisplay: 'true' },
        transports: ['websocket', 'polling'],
      });

      socket.on('queue:ticket-called', (ticket: any) => {
        setLastCalled(ticket.displayToken);
        fetchBoardData();
      });

      socket.on('queue:ticket-serving', () => fetchBoardData());
      socket.on('queue:ticket-completed', () => fetchBoardData());
      socket.on('queue:ticket-created', () => fetchBoardData());
      socket.on('queue:ticket-skipped', () => fetchBoardData());

      return () => {
        socket.disconnect();
      };
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xl font-bold">
        Loading Waiting Room Board...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xl font-bold">
        Hospital queue display not found.
      </div>
    );
  }

  const session = data.sessions?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col p-8 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-black tracking-tight">{data.clinic.name}</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-0.5">
              Live Waiting Room Display • Patient Privacy Compliant
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-slate-900 border border-slate-800 py-2 px-5 rounded-2xl">
          <Clock className="h-5 w-5 text-emerald-400" />
          <span className="text-2xl font-mono font-bold">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </header>

      {/* Main Board Displays */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Serving Now (Huge token) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/60 to-slate-900 border-2 border-blue-500/50 rounded-3xl p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
              <Activity className="h-5 w-5 animate-pulse" />
              <span>Now Serving at Counter</span>
            </span>
            <span className="text-xs font-semibold px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/40">
              Active Consultation
            </span>
          </div>

          <div className="text-center py-12">
            <div className="text-8xl md:text-9xl font-black font-mono tracking-tighter text-white drop-shadow-md">
              {session?.servingToken || session?.calledToken || '---'}
            </div>
            <p className="text-slate-400 text-lg mt-4 font-medium">
              {session?.doctorName ? `Dr. ${session.doctorName}` : 'Main Consultation Station'}
            </p>
          </div>

          {lastCalled && (
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="h-6 w-6 text-amber-400 animate-bounce" />
                <span className="text-sm font-bold text-amber-200">
                  TOKEN JUST CALLED: <span className="font-mono text-white text-lg ml-2">{lastCalled}</span>
                </span>
              </div>
              <span className="text-xs text-amber-300">Please proceed to examination counter</span>
            </div>
          )}
        </div>

        {/* Right Column: Next in Line */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h2 className="text-lg font-bold text-slate-200 uppercase tracking-wider">Next in Line</h2>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
                Waiting: {session?.waitingCount || 0}
              </span>
            </div>

            <div className="space-y-4">
              {session?.waitingTokens && session.waitingTokens.length > 0 ? (
                session.waitingTokens.slice(0, 6).map((tok: string, idx: number) => (
                  <div
                    key={tok}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80"
                  >
                    <span className="text-xs font-semibold text-slate-500">#{idx + 1}</span>
                    <span className="text-2xl font-black font-mono tracking-wide text-emerald-400">{tok}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-600 text-sm">
                  Queue is clear. No waiting tokens.
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Please have your queue token ticket ready when called.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

