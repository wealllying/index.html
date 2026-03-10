'use client';

import { KycStatus } from '@/lib/types';

const config: Record<KycStatus, { label: string; bg: string; text: string }> = {
  none: { label: 'No KYC', bg: 'bg-gray-100', text: 'text-gray-500' },
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-600' },
  verified: { label: 'Verified', bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

export default function KycBadge({ status }: { status: KycStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {status === 'verified' && (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {c.label}
    </span>
  );
}
