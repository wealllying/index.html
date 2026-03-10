'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatUsd, formatDop, formatDate, TransactionStatus, CashOutMethod } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

const STATUS_OPTIONS: { value: TransactionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'initiated', label: 'Initiated' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready', label: 'Ready for Pickup' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'cancelled', label: 'Cancelled' },
];

const METHOD_OPTIONS: { value: CashOutMethod | 'all'; label: string }[] = [
  { value: 'all', label: 'All Methods' },
  { value: 'atm', label: 'ATM Pickup' },
  { value: 'agent', label: 'Agent Pickup' },
  { value: 'bank', label: 'Bank Deposit' },
];

function AtmIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    </div>
  );
}

function AgentIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    </div>
  );
}

function BankIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/>
      </svg>
    </div>
  );
}

function MethodBadge({ method }: { method: CashOutMethod }) {
  if (method === 'atm') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-blue/10 text-brand-blue text-xs font-medium">
        ATM
      </span>
    );
  }
  if (method === 'bank') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold text-xs font-medium">
        Bank Deposit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-teal/10 text-brand-teal text-xs font-medium">
      Agent
    </span>
  );
}

export default function HistoryPage() {
  const transactions = useStore((s) => s.transactions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<CashOutMethod | 'all'>('all');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        tx.recipientName.toLowerCase().includes(q) ||
        tx.referenceNumber.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchMethod = methodFilter === 'all' || tx.cashOutMethod === methodFilter;
      return matchSearch && matchStatus && matchMethod;
    });
  }, [transactions, search, statusFilter, methodFilter]);

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      {/* Header */}
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Transaction History</h1>

      {/* Filter bar */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by recipient or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
            className="input-field sm:w-44"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Method filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as CashOutMethod | 'all')}
            className="input-field sm:w-40"
          >
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h3m-9 3.75h7.5M6 20.25h12A2.25 2.25 0 0020.25 18V6.75A2.25 2.25 0 0018 4.5H6A2.25 2.25 0 003.75 6.75v11.25c0 1.243 1.007 2.25 2.25 2.25z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium mb-1">No transactions found</p>
          <p className="text-gray-400 text-sm">
            {search || statusFilter !== 'all' || methodFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Your transactions will appear here.'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden divide-y divide-surface-100">
          {filtered.map((tx, idx) => (
            <Link
              key={tx.id}
              href={`/dashboard/history/${tx.id}`}
              className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-50 ${
                idx % 2 === 1 ? 'bg-surface-50/50' : ''
              }`}
            >
              {/* Icon */}
              {tx.cashOutMethod === 'atm' ? <AtmIcon /> : tx.cashOutMethod === 'bank' ? <BankIcon /> : <AgentIcon />}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-brand-navy text-sm truncate">
                    {tx.recipientName}
                  </span>
                  <MethodBadge method={tx.cashOutMethod} />
                </div>
                <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
              </div>

              {/* Amounts */}
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-brand-navy text-sm">{formatUsd(tx.amountUsd)}</p>
                <p className="text-xs text-gray-400">{formatDop(tx.amountDop)}</p>
              </div>

              {/* Status */}
              <div className="flex-shrink-0 hidden sm:block">
                <StatusBadge status={tx.status} />
              </div>

              {/* Chevron */}
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
