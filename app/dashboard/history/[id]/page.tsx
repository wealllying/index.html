'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatUsd, formatDop, formatDateTime, Transaction, TransactionStatus } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

const STEPS: { key: TransactionStatus; label: string }[] = [
  { key: 'initiated', label: 'Initiated' },
  { key: 'processing', label: 'Processing' },
  { key: 'ready', label: 'Ready for Pickup' },
  { key: 'picked_up', label: 'Picked Up' },
];

const STATUS_ORDER: Record<string, number> = {
  initiated: 0,
  processing: 1,
  ready: 2,
  picked_up: 3,
};

const MOCK_LOCATIONS = [
  { name: 'Caribe Express - Piantini', address: 'Av. Abraham Lincoln #456, Piantini, Santo Domingo' },
  { name: 'Caribe Express - Zona Colonial', address: 'Calle El Conde #102, Zona Colonial, Santo Domingo' },
  { name: 'Caribe Express - Naco', address: 'Av. Tiradentes #28, Naco, Santo Domingo' },
];

function getStepTimestamp(tx: Transaction, stepIndex: number): string | null {
  const currentIndex = STATUS_ORDER[tx.status] ?? -1;
  if (tx.status === 'cancelled' && stepIndex > currentIndex) return null;
  if (stepIndex <= currentIndex) {
    // Approximate timestamps by offsetting from createdAt
    const base = new Date(tx.createdAt).getTime();
    const offsets = [0, 60000, 180000, 300000]; // 0, 1m, 3m, 5m
    return new Date(base + offsets[stepIndex]).toISOString();
  }
  return null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                 bg-surface-100 text-brand-blue hover:bg-surface-200 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function StatusTimeline({ tx }: { tx: Transaction }) {
  const isCancelled = tx.status === 'cancelled';
  const currentIndex = STATUS_ORDER[tx.status] ?? -1;

  return (
    <div className="card mb-6">
      <h2 className="text-sm font-semibold text-brand-navy mb-5 uppercase tracking-wider">Status Timeline</h2>
      <div className="relative">
        {STEPS.map((step, idx) => {
          const isCompleted = !isCancelled && idx < currentIndex;
          const isCurrent = !isCancelled && idx === currentIndex;
          const isFuture = !isCancelled && idx > currentIndex;
          const timestamp = getStepTimestamp(tx, idx);
          const isLast = idx === STEPS.length - 1;

          return (
            <div key={step.key} className="flex gap-4 relative">
              {/* Line + Circle column */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                {isCancelled && idx > currentIndex ? (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>
                ) : isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0 z-10">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0 z-10 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>
                )}

                {/* Line */}
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[2rem] ${
                      isCompleted
                        ? 'bg-brand-blue'
                        : isFuture || isCancelled
                        ? 'border-l-2 border-dashed border-gray-200 w-0'
                        : 'bg-brand-blue'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                <p
                  className={`text-sm font-semibold ${
                    isCompleted || isCurrent ? 'text-brand-navy' : 'text-gray-300'
                  }`}
                >
                  {step.label}
                </p>
                {timestamp && (isCompleted || isCurrent) && (
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(timestamp)}</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="flex gap-4 mt-2">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 z-10">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-500">Cancelled</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(tx.updatedAt)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-surface-100 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-brand-blue' : 'text-brand-navy'}`}>
        {value}
      </span>
    </div>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const txId = params.id as string;
  const transactions = useStore((s) => s.transactions);
  const cancelTransaction = useStore((s) => s.cancelTransaction);
  const tx = transactions.find((t) => t.id === txId);

  if (!tx) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-up">
        <Link
          href="/dashboard/history"
          className="inline-flex items-center gap-1.5 text-sm text-brand-blue font-medium hover:text-brand-navy transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to History
        </Link>
        <div className="card text-center py-16">
          <p className="text-gray-500 font-medium">Transaction not found.</p>
        </div>
      </div>
    );
  }

  const canCancel = tx.status !== 'picked_up' && tx.status !== 'cancelled';

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this transaction? The amount will be refunded to your balance.')) {
      cancelTransaction(tx.id);
    }
  };

  const handleResendSms = () => {
    alert('SMS sent! Your recipient will receive the pickup code shortly.');
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      {/* Back link */}
      <Link
        href="/dashboard/history"
        className="inline-flex items-center gap-1.5 text-sm text-brand-blue font-medium hover:text-brand-navy transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to History
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">{tx.referenceNumber}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Transaction Reference</p>
        </div>
        <StatusBadge status={tx.status} />
      </div>

      {/* Status Timeline */}
      <StatusTimeline tx={tx} />

      {/* Detail card */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-brand-navy mb-4 uppercase tracking-wider">Transaction Details</h2>
        <DetailRow label="Recipient" value={tx.recipientName} />
        <DetailRow label="Amount Sent" value={formatUsd(tx.amountUsd)} highlight />
        <DetailRow label="Amount Received" value={formatDop(tx.amountDop)} highlight />
        <DetailRow label="Exchange Rate" value={`1 USD = ${tx.exchangeRate.toFixed(2)} DOP`} />
        <DetailRow label="PlataYa Fee" value={formatUsd(tx.feeUsd)} />
        <DetailRow label="Network Fee" value={formatUsd(tx.networkFeeUsd)} />
        <DetailRow label="Total Charged" value={formatUsd(tx.totalUsd)} highlight />
        <DetailRow
          label="Cash-out Method"
          value={tx.cashOutMethod === 'atm' ? 'ATM Pickup' : tx.cashOutMethod === 'bank' ? 'Bank Deposit' : 'Agent Pickup'}
        />
        <DetailRow label="Reference Number" value={tx.referenceNumber} />
      </div>

      {/* ATM Pickup Section */}
      {tx.cashOutMethod === 'atm' && tx.pickupCode && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-brand-navy mb-4 uppercase tracking-wider">Pickup Code</h2>
          <div className="bg-gradient-to-br from-brand-navy to-brand-blue rounded-2xl p-6 text-center mb-4">
            <p className="text-xs text-blue-200 font-medium mb-2 uppercase tracking-widest">ATM Pickup Code</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-4xl font-mono font-bold text-white tracking-[0.3em]">
                {tx.pickupCode}
              </p>
            </div>
            <p className="text-xs text-blue-300 mt-3">
              Enter this code at any participating ATM in the DR
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CopyButton text={tx.pickupCode} />
            <button
              onClick={handleResendSms}
              className="btn-outline text-xs px-4 py-1.5"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                Resend SMS
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Agent Pickup Section */}
      {tx.cashOutMethod === 'agent' && (
        <>
          <div className="card mb-6">
            <h2 className="text-sm font-semibold text-brand-navy mb-4 uppercase tracking-wider">Reference Number</h2>
            <div className="bg-gradient-to-br from-brand-teal/90 to-brand-teal rounded-2xl p-6 text-center mb-4">
              <p className="text-xs text-teal-100 font-medium mb-2 uppercase tracking-widest">Agent Pickup Reference</p>
              <p className="text-2xl font-mono font-bold text-white tracking-wider">
                {tx.referenceNumber}
              </p>
            </div>
            <CopyButton text={tx.referenceNumber} />
          </div>

          <div className="card mb-6">
            <h2 className="text-sm font-semibold text-brand-navy mb-4 uppercase tracking-wider">What to Bring</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-navy">Valid Cedula</p>
                  <p className="text-xs text-gray-400 mt-0.5">Recipient must present their Dominican national ID</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-navy">Reference Number</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tx.referenceNumber}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-6">
            <h2 className="text-sm font-semibold text-brand-navy mb-4 uppercase tracking-wider">Nearest Caribe Express</h2>
            <div className="space-y-3">
              {MOCK_LOCATIONS.map((loc, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-brand-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">{loc.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{loc.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bank Deposit Section */}
      {tx.cashOutMethod === 'bank' && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-brand-navy mb-4 uppercase tracking-wider">Bank Deposit Details</h2>
          <div className="bg-gradient-to-br from-brand-gold/90 to-brand-gold rounded-2xl p-6 text-center mb-4">
            <p className="text-xs text-yellow-100 font-medium mb-2 uppercase tracking-widest">Bank Deposit Confirmed</p>
            <p className="text-2xl font-mono font-bold text-white tracking-wider">
              {tx.referenceNumber}
            </p>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-navy">Bank Name</p>
                <p className="text-xs text-gray-400 mt-0.5">Banco Popular Dominicano</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-navy">Account Ending</p>
                <p className="text-xs text-gray-400 mt-0.5">****7842</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-navy">Estimated Completion</p>
                <p className="text-xs text-gray-400 mt-0.5">~30 minutes</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CopyButton text={tx.referenceNumber} />
          </div>
        </div>
      )}

      {/* Cancel button */}
      {canCancel && (
        <div className="card text-center">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                       text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel Transaction
          </button>
          <p className="text-xs text-gray-400 mt-2">The full amount will be refunded to your balance.</p>
        </div>
      )}
    </div>
  );
}
