'use client';

import React from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Building2,
  Stethoscope,
  Scan,
  FlaskConical,
  Pill,
  ArrowRight,
  ShieldCheck,
  User,
  AlertCircle,
  Receipt,
  Check,
} from 'lucide-react';

export interface ClinicalTimelineProps {
  appointment?: any;
  diagnosticOrder?: any;
  prescription?: any;
  patientName?: string;
  showCardWrapper?: boolean;
}

export function ClinicalJourneyTimeline({
  appointment,
  diagnosticOrder,
  prescription,
  patientName,
  showCardWrapper = true,
}: ClinicalTimelineProps) {
  // Resolve active diagnostic order & prescription from appointment if not passed directly
  const diag = diagnosticOrder || (appointment?.diagnosticOrders && appointment.diagnosticOrders.length > 0 ? appointment.diagnosticOrders[0] : null);
  const rx = prescription || (appointment?.prescriptions && appointment.prescriptions.length > 0 ? appointment.prescriptions[0] : null);
  const payment = appointment?.payment;

  // Step 1: Initial Payment & Registration (Card / Telebirr / CBE at Reception)
  const isStep1Done = Boolean(payment);
  const isStep1Verified = payment?.status === 'VERIFIED';
  const paymentMethodLabel = payment?.method === 'CARD' ? 'Debit/Credit Card' : payment?.method === 'TELEBIRR' ? 'Telebirr (0995774866)' : payment?.method === 'CBE' ? 'CBE Bank (1000305532472)' : 'Initial Check-in Payment';

  // Step 2: Reception Approval & Consultation Room Assigned
  const isStep2Done = appointment?.status !== 'REQUESTED' && appointment?.status !== 'CANCELLED';
  const assignedRoom = appointment?.roomNumber || 'Room 102 - Doctor Consultation Suite';
  const assignedRole = appointment?.assignedRole || (appointment?.doctor?.specialty?.toLowerCase().includes('nurse') ? 'Nurse' : 'Doctor');
  const practitionerName = appointment?.doctor?.fullName || 'Assigned Practitioner';

  // Step 3: Doctor / Nurse Counseling & Specialist/Lab Referral
  const isStep3Done = Boolean(diag) || Boolean(rx) || appointment?.status === 'COMPLETED' || appointment?.status === 'IN_QUEUE' || appointment?.status === 'CHECKED_IN';
  const hasDiagnosticReferral = Boolean(diag);
  const specialistRoom = diag?.roomNumber || (diag?.type === 'LAB_TEST' ? 'Room 108 - Pathology Laboratory' : 'Room 204 - Radiology & X-Ray Suite');
  const specialistTitle = diag?.title || 'Specialist Diagnostic Investigation';

  // Step 4: Specialist / Laboratory Examination & Return to Doctor
  const isStep4Done = diag?.status === 'COMPLETED' || diag?.status === 'REVIEWED';
  const specialistFindings = diag?.impression || diag?.findings;

  // Step 5: Doctor Final Counseling & Electronic Prescription
  const isStep5Done = Boolean(rx) || diag?.status === 'REVIEWED' || appointment?.status === 'COMPLETED';
  const diagnosisText = rx?.diagnosis || diag?.doctorConclusion || 'Clinical diagnosis established';
  const pharmacyRoom = rx?.roomNumber || 'Room 105 - Central Pharmacy';
  const rxTotalAmount = rx?.totalAmount ? Number(rx.totalAmount).toFixed(2) : null;

  // Step 6: Pharmacy Dispensation & Drug Payment in Birr
  const isStep6Paid = rx?.paymentStatus === 'VERIFIED' || rx?.status === 'PAID' || rx?.status === 'DISPENSED';
  const isStep6Dispensed = rx?.status === 'DISPENSED';

  const steps = [
    {
      id: 1,
      title: 'Initial Payment & Reception Check-in',
      subtitle: 'Card / Telebirr / CBE payment receipt submitted to reception desk',
      icon: CreditCard,
      status: isStep1Verified ? 'completed' : isStep1Done ? 'in_progress' : 'pending',
      badge: isStep1Verified ? 'Verified & Paid' : isStep1Done ? 'Pending Reception Approval' : 'Awaiting Payment',
      badgeColor: isStep1Verified ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200',
      details: [
        { label: 'Payment Method', value: paymentMethodLabel },
        { label: 'Transaction / Receipt', value: payment?.transactionRef || payment?.receiptNumber || 'Ref Pending' },
        { label: 'Consultation Fee', value: payment?.amount ? `${Number(payment.amount).toFixed(2)} ETB (Birr)` : 'Fee Confirmed' },
        { label: 'Verification Location', value: 'Front-Desk Reception Counter' },
      ],
    },
    {
      id: 2,
      title: 'Reception Approved & Room Number Assigned',
      subtitle: 'Receptionist verifies payment, allocates consultation room & assigns practitioner',
      icon: Building2,
      status: isStep2Done ? 'completed' : isStep1Verified ? 'in_progress' : 'pending',
      badge: isStep2Done ? `${assignedRoom}` : 'Awaiting Room Assignment',
      badgeColor: isStep2Done ? 'bg-blue-100 text-blue-800 border-blue-200 font-bold' : 'bg-slate-100 text-slate-600 border-slate-200',
      details: [
        { label: 'Assigned Room', value: assignedRoom, isHighlight: true },
        { label: 'Practitioner', value: `${assignedRole}: ${practitionerName}` },
        { label: 'Department', value: appointment?.doctor?.specialty || appointment?.service?.name || 'General Clinical Medicine' },
        { label: 'Queue Status', value: appointment?.status || 'CONFIRMED' },
      ],
    },
    {
      id: 3,
      title: 'Doctor / Nurse Counseling & Referral',
      subtitle: 'Practitioner conducts evaluation in consultation room and orders diagnostics',
      icon: Stethoscope,
      status: hasDiagnosticReferral ? 'completed' : isStep2Done ? 'in_progress' : 'pending',
      badge: hasDiagnosticReferral ? `Referred to ${specialistRoom}` : isStep2Done ? 'Counseling in Progress' : 'Pending',
      badgeColor: hasDiagnosticReferral ? 'bg-purple-100 text-purple-800 border-purple-200 font-bold' : 'bg-slate-100 text-slate-600',
      details: hasDiagnosticReferral
        ? [
            { label: 'Investigation Type', value: diag?.type === 'LAB_TEST' ? '🧪 Clinical Laboratory Analysis' : '🔬 Radiology & Imaging (X-Ray)' },
            { label: 'Target Room', value: specialistRoom, isHighlight: true },
            { label: 'Test Ordered', value: specialistTitle },
            { label: 'Clinical Indication', value: diag?.clinicalNotes || 'Diagnostic workup for symptoms' },
          ]
        : [
            { label: 'Consultation Room', value: assignedRoom },
            { label: 'Counseling Status', value: 'Under evaluation by practitioner' },
          ],
    },
    {
      id: 4,
      title: 'Specialist / Laboratory Examination & Return',
      subtitle: 'Diagnostic procedure performed in room and patient returned to attending doctor',
      icon: diag?.type === 'LAB_TEST' ? FlaskConical : Scan,
      status: isStep4Done ? 'completed' : hasDiagnosticReferral ? 'in_progress' : 'pending',
      badge: isStep4Done ? 'Results Ready — Returned to Doctor' : hasDiagnosticReferral ? 'In Progress in Specialist Suite' : 'Pending',
      badgeColor: isStep4Done ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600',
      details: isStep4Done
        ? [
            { label: 'Examination Room', value: specialistRoom },
            { label: 'Diagnostic Findings', value: specialistFindings || 'Scan and pathology analysis completed.' },
            { label: 'Return Action', value: `Returned to ${practitionerName} in ${assignedRoom}`, isHighlight: true },
            { label: 'Specialist Note', value: diag?.radiologyNotes || 'Results finalized and transmitted to doctor.' },
          ]
        : hasDiagnosticReferral
        ? [
            { label: 'Specialist Room', value: specialistRoom, isHighlight: true },
            { label: 'Status', value: 'Patient undergoing diagnostic counseling/scan' },
          ]
        : [
            { label: 'Specialist Room', value: 'Not required or pending referral' },
          ],
    },
    {
      id: 5,
      title: 'Doctor Final Counseling & Prescription',
      subtitle: 'Attending doctor reviews specialist findings, finalizes counseling & issues drugs',
      icon: Stethoscope,
      status: isStep5Done ? 'completed' : isStep4Done ? 'in_progress' : 'pending',
      badge: isStep5Done ? `Prescription Sent to ${pharmacyRoom}` : isStep4Done ? 'Final Review in Progress' : 'Pending',
      badgeColor: isStep5Done ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-600',
      details: isStep5Done
        ? [
            { label: 'Attending Doctor Room', value: assignedRoom },
            { label: 'Final Diagnosis', value: diagnosisText, isHighlight: true },
            { label: 'Routed Pharmacy', value: pharmacyRoom, isHighlight: true },
            { label: 'Prescription Ref', value: rx?.prescriptionNumber || 'RX Generated' },
            { label: 'Total Medication Bill', value: rxTotalAmount ? `${rxTotalAmount} ETB (Birr)` : 'Itemized in Pharmacy' },
          ]
        : [
            { label: 'Review Stage', value: 'Awaiting completion of specialist findings' },
          ],
    },
    {
      id: 6,
      title: 'Pharmacy Drug Payment in Birr & Dispensation',
      subtitle: 'Patient pays for medications in Birr at Room 105 pharmacy and receives drugs',
      icon: Pill,
      status: isStep6Dispensed ? 'completed' : isStep6Paid ? 'in_progress' : isStep5Done ? 'in_progress' : 'pending',
      badge: isStep6Dispensed ? 'Medications Dispensed' : isStep6Paid ? 'Payment Confirmed — Dispensing' : isStep5Done ? 'Pending Payment in Birr' : 'Pending',
      badgeColor: isStep6Dispensed
        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold'
        : isStep6Paid
        ? 'bg-blue-100 text-blue-800 border-blue-200'
        : isStep5Done
        ? 'bg-amber-100 text-amber-800 border-amber-200 font-bold'
        : 'bg-slate-100 text-slate-600',
      details: [
        { label: 'Dispensing Room', value: pharmacyRoom, isHighlight: true },
        { label: 'Drug Bill (ETB)', value: rxTotalAmount ? `${rxTotalAmount} ETB (Birr)` : 'Pending itemization' },
        { label: 'Birr Payment Status', value: isStep6Paid ? 'VERIFIED & PAID' : 'Pay via Telebirr / CBE / Cash in Pharmacy' },
        { label: 'Medications Dispensed', value: isStep6Dispensed ? 'Dispensed with patient counseling' : rx?.items ? `${rx.items.length} prescribed medications ready` : 'Awaiting pharmacy counter' },
      ],
    },
  ];

  const content = (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
              Hospital Timeline Progress
            </span>
            {patientName && (
              <span className="text-xs font-bold text-slate-700">Patient: {patientName}</span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
            Hospital Timeline Progress & Room-to-Room Clinical Progression
          </h3>
          <p className="text-xs text-slate-500">
            Real-time hospital care progression: Reception Check-in (Card) → Doctor/Nurse Room → Specialist/Lab Room → Return Review → Central Pharmacy Drug Payment in Birr.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Assigned Room</div>
            <div className="text-xs font-black text-blue-700">
              {isStep6Dispensed
                ? 'Care Cycle Completed'
                : isStep5Done && !isStep6Dispensed
                ? pharmacyRoom
                : hasDiagnosticReferral && !isStep4Done
                ? specialistRoom
                : assignedRoom}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline Steps */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => {
          const isDone = step.status === 'completed';
          const isInProgress = step.status === 'in_progress';
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative group">
              {/* Bullet node */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-600 border-white text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-50'
                    : isInProgress
                    ? 'bg-blue-600 border-white text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-50 animate-pulse'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <StepIcon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Step Card */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isInProgress
                    ? 'bg-blue-50/40 border-blue-300 shadow-sm'
                    : isDone
                    ? 'bg-white border-slate-200/90 shadow-sm'
                    : 'bg-slate-50/60 border-slate-200/60 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Step {step.id} of 6
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${step.badgeColor}`}>
                    {step.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3">{step.subtitle}</p>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs pt-3 border-t border-slate-100">
                  {step.details.map((d, dIdx) => (
                    <div
                      key={dIdx}
                      className={`p-2.5 rounded-xl border ${
                        d.isHighlight
                          ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-semibold'
                          : 'bg-white border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 font-medium">{d.label}</div>
                      <div className={`mt-0.5 font-bold truncate ${d.isHighlight ? 'text-blue-700' : 'text-slate-800'}`}>
                        {d.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!showCardWrapper) {
    return content;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
      {content}
    </div>
  );
}

