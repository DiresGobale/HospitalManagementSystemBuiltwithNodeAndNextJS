import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'HMS - Hospital Management System',
  description: 'Multi-Tenant Hospital Management System - Clinical Consultations, Specialist Diagnostics & Pharmacy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

