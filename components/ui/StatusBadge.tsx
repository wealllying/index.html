'use client';

import { TransactionStatus } from '@/lib/types';

const config: Record<TransactionStatus, { label: string; bg: string; text: string; dot: string }> = {
  initiated: { label: 'Initiated', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  processing: { label: 'Processing', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  ready: { label: 'Ready for Pickup', bg: 'bg-brand-teal/10', text: 'text-brand-teal', dot: 'bg-brand-teal' },
  picked_up: { label: 'Picked Up', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' },
};

export default function StatusBadge({ status }: { status: TransactionStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
