'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatUsd, formatDop, formatDate, EXCHANGE_RATE } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

export default function DashboardPage() {
  const { user, transactions } = useStore();
  const recentTxs = transactions.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s your transfer activity overview</p>
      </div>

      {/* Top cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Balance card */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/5 rounded-bl-[3rem]" />
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Available Balance</p>
          <p className="text-3xl font-bold text-brand-navy mt-2">{formatUsd(user.balanceUsd)}</p>
          <p className="text-xs text-gray-400 mt-1">USD Wallet</p>
        </div>

        {/* Exchange rate card */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/5 rounded-bl-[3rem]" />
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Exchange Rate</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-brand-navy">58.50</p>
            <span className="text-sm text-gray-400">DOP/USD</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-brand-teal font-medium flex items-center gap-0.5">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
              +0.12%
            </span>
            <span className="text-xs text-gray-400">vs yesterday</span>
          </div>
        </div>

        {/* Send money CTA */}
        <div className="card bg-gradient-to-br from-brand-blue to-brand-navy text-white relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[4rem]" />
          <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Quick Action</p>
          <p className="text-lg font-bold mt-2">Send Money to DR</p>
          <p className="text-xs text-white/60 mt-1">Fast, low-fee transfers</p>
          <Link
            href="/dashboard/send"
            className="inline-flex items-center gap-2 mt-4 bg-white text-brand-blue px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Send Now
          </Link>
        </div>
      </div>

      {/* Pipeline info */}
      <div className="card bg-surface-50 border-brand-blue/10">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-navy">Powered by Zero Hash</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              USD &rarr; USDC (stablecoin) &rarr; DOP. Your transfer is secured through blockchain-backed stablecoin rails with institutional-grade compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-brand-navy">Recent Transactions</h2>
          <Link href="/dashboard/history" className="btn-ghost text-xs">
            View All &rarr;
          </Link>
        </div>

        {recentTxs.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-sm">No transactions yet</p>
            <Link href="/dashboard/send" className="btn-primary mt-4 inline-block">Send Money</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTxs.map((tx) => (
              <Link
                key={tx.id}
                href={`/dashboard/history/${tx.id}`}
                className="card flex items-center gap-4 py-4 hover:border-brand-blue/20 transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  tx.cashOutMethod === 'atm' ? 'bg-brand-blue/10 text-brand-blue' : tx.cashOutMethod === 'bank' ? 'bg-brand-gold/10 text-brand-gold' : 'bg-brand-teal/10 text-brand-teal'
                }`}>
                  {tx.cashOutMethod === 'atm' ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="7" y="13" width="3" height="2" rx="0.5"/></svg>
                  ) : tx.cashOutMethod === 'bank' ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/></svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-brand-navy truncate">{tx.recipientName}</p>
                    <p className="text-sm font-bold text-brand-navy">{formatUsd(tx.amountUsd)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                      <span className="text-xs text-gray-300">&middot;</span>
                      <span className="text-xs text-gray-400">{tx.cashOutMethod === 'atm' ? 'ATM Pickup' : tx.cashOutMethod === 'bank' ? 'Bank Deposit' : 'Agent Pickup'}</span>
                    </div>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
