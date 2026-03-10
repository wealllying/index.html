'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Recipient, formatDate } from '@/lib/types';
import KycBadge from '@/components/ui/KycBadge';

const AVATAR_COLORS = [
  'bg-brand-blue text-white',
  'bg-brand-teal text-white',
  'bg-brand-navy text-white',
  'bg-brand-gold text-white',
  'bg-emerald-500 text-white',
  'bg-violet-500 text-white',
  'bg-rose-500 text-white',
  'bg-cyan-500 text-white',
];

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return fullName.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function RecipientsPage() {
  const { recipients, deleteRecipient } = useStore();
  const [search, setSearch] = useState('');

  const filtered = recipients.filter((r) =>
    r.fullName.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(r: Recipient) {
    if (confirm(`Remove ${r.fullName} from your recipients? This cannot be undone.`)) {
      deleteRecipient(r.id);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Recipients</h1>
          <p className="text-sm text-gray-500 mt-1">People you send money to in the DR</p>
        </div>
        <Link
          href="/dashboard/recipients/new"
          className="inline-flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-blue/90 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Recipient
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipients by name..."
          className="input-field pl-11 w-full"
        />
      </div>

      {/* Content */}
      {recipients.length === 0 ? (
        /* Empty state — no recipients at all */
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-navy mb-2">No recipients yet</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
            Add your family members or friends in the Dominican Republic to start sending money.
          </p>
          <Link
            href="/dashboard/recipients/new"
            className="inline-flex items-center gap-2 bg-brand-blue text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-brand-blue/90 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Your First Recipient
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        /* No search results */
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm">No recipients match &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch('')} className="text-brand-blue text-sm font-medium mt-2 hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        /* Recipient cards */
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="card flex items-center gap-4 py-4 hover:border-brand-blue/20 transition-colors">
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(r.fullName)}`}>
                {getInitials(r.fullName)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-brand-navy truncate">{r.fullName}</p>
                  {/* Method badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.preferredMethod === 'atm'
                      ? 'bg-brand-blue/10 text-brand-blue'
                      : r.preferredMethod === 'bank'
                      ? 'bg-brand-gold/10 text-brand-gold'
                      : 'bg-brand-teal/10 text-brand-teal'
                  }`}>
                    {r.preferredMethod === 'atm' ? (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="4" width="18" height="14" rx="2" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <rect x="7" y="13" width="3" height="2" rx="0.5" />
                      </svg>
                    ) : r.preferredMethod === 'bank' ? (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    )}
                    {r.preferredMethod === 'atm' ? 'ATM Pickup' : r.preferredMethod === 'bank' ? 'Bank Deposit' : 'Agent Pickup'}
                  </span>
                  {/* KYC badge — ATM recipients only */}
                  {r.preferredMethod === 'atm' && <KycBadge status={r.kycStatus} />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{r.phone}</span>
                  <span className="text-xs text-gray-300">&middot;</span>
                  <span className="text-xs text-gray-400">Added {formatDate(r.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/dashboard/recipients/${r.id}/edit`}
                  className="w-9 h-9 rounded-xl bg-surface-50 flex items-center justify-center text-gray-400 hover:text-brand-navy hover:bg-surface-100 transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </Link>
                <button
                  onClick={() => handleDelete(r)}
                  className="w-9 h-9 rounded-xl bg-surface-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
