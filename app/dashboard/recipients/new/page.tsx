'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { CashOutMethod } from '@/lib/types';

export default function NewRecipientPage() {
  const router = useRouter();
  const { addRecipient } = useStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<CashOutMethod>('atm');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAtm = method === 'atm';
  const isBank = method === 'bank';
  const isAgent = method === 'agent';
  const canSubmit = fullName.trim().length >= 2 && phone.trim().length >= 10 && !submitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);

    addRecipient({
      fullName: fullName.trim(),
      phone: phone.trim(),
      preferredMethod: method,
      kycStatus: 'none',
      ...(isBank ? { bankName: bankName.trim(), bankAccount: bankAccount.trim() } : {}),
    });

    router.push('/dashboard/recipients');
  }

  return (
    <div className="max-w-lg space-y-6 animate-fade-in">
      <Link
        href="/dashboard/recipients"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-navy transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Recipients
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Add Recipient</h1>
        <p className="text-sm text-gray-500 mt-1">Add someone in the Dominican Republic</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field w-full"
            placeholder="Maria Garcia"
            required
            minLength={2}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1.5">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field w-full"
            placeholder="+1-809-555-0000"
            required
            minLength={10}
          />
          <p className="text-[11px] text-gray-400 mt-1.5">Dominican Republic number where they can receive SMS</p>
        </div>

        {/* Cash-Out Method */}
        <div>
          <label className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-2">
            How will they receive the money?
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMethod('atm')}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 transition-all ${
                isAtm
                  ? 'border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue/20'
                  : 'border-surface-200 bg-white hover:bg-surface-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAtm ? 'bg-brand-blue/10 text-brand-blue' : 'bg-surface-100 text-gray-400'}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="14" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <rect x="7" y="13" width="3" height="2" rx="0.5" />
                </svg>
              </div>
              <span className={`text-sm font-semibold ${isAtm ? 'text-brand-blue' : 'text-gray-500'}`}>ATM Pickup</span>
              <span className="text-[11px] text-gray-400 text-center">Cardless ATM withdrawal</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('agent')}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 transition-all ${
                isAgent
                  ? 'border-brand-teal bg-brand-teal/5 ring-1 ring-brand-teal/20'
                  : 'border-surface-200 bg-white hover:bg-surface-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAgent ? 'bg-brand-teal/10 text-brand-teal' : 'bg-surface-100 text-gray-400'}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <span className={`text-sm font-semibold ${isAgent ? 'text-brand-teal' : 'text-gray-500'}`}>Agent</span>
              <span className="text-[11px] text-gray-400 text-center">Caribe Express location</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('bank')}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 transition-all ${
                isBank
                  ? 'border-brand-gold bg-brand-gold/5 ring-1 ring-brand-gold/20'
                  : 'border-surface-200 bg-white hover:bg-surface-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBank ? 'bg-brand-gold/10 text-brand-gold' : 'bg-surface-100 text-gray-400'}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/>
                </svg>
              </div>
              <span className={`text-sm font-semibold ${isBank ? 'text-brand-gold' : 'text-gray-500'}`}>Bank</span>
              <span className="text-[11px] text-gray-400 text-center">Direct to bank account</span>
            </button>
          </div>
        </div>

        {/* Method-specific info */}
        {isAtm && (
          <div className="flex items-start gap-3 bg-brand-blue/5 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <p className="text-xs text-brand-navy leading-relaxed font-medium">
                ATM pickups require the recipient to verify their identity.
              </p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                When you send the first transfer, we&apos;ll text them a link to complete KYC on their phone (selfie + cedula photo). Takes about 2 minutes.
              </p>
            </div>
          </div>
        )}

        {isAgent && (
          <div className="flex items-start gap-3 bg-brand-teal/5 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <p className="text-xs text-brand-navy leading-relaxed font-medium">
                No verification needed ahead of time.
              </p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Recipient shows their cedula in person at any Caribe Express location to pick up the cash.
              </p>
            </div>
          </div>
        )}

        {/* Bank fields */}
        {isBank && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-brand-gold/5 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div>
                <p className="text-xs text-brand-navy leading-relaxed font-medium">
                  Money goes straight to their bank account.
                </p>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Typically arrives within 30 minutes during banking hours.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1.5">
                Bank Name
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select a bank</option>
                <option value="Banco Popular Dominicano">Banco Popular Dominicano</option>
                <option value="Banreservas">Banreservas</option>
                <option value="Banco BHD">Banco BHD</option>
                <option value="Scotiabank RD">Scotiabank RD</option>
                <option value="Banco Santa Cruz">Banco Santa Cruz</option>
                <option value="Asociacion Popular">Asociacion Popular</option>
                <option value="Banco Caribe">Banco Caribe</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. 8001234567"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">Ask your recipient for their account number</p>
            </div>
          </div>
        )}

        <div className="border-t border-surface-100" />

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-brand-blue text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-brand-blue/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            'Save Recipient'
          )}
        </button>
      </form>
    </div>
  );
}
