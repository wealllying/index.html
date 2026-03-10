'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import {
  EXCHANGE_RATE,
  NETWORK_FEE,
  getPlatayaFee,
  formatUsd,
  formatDop,
  CashOutMethod,
} from '@/lib/types';
import KycBadge from '@/components/ui/KycBadge';

const STEPS = ['Amount', 'Recipient', 'Review'];

export default function SendPage() {
  const {
    sendFlow,
    recipients,
    user,
    setSendStep,
    setSendAmount,
    setSendRecipient,
    setSendMethod,
    confirmSend,
    resetSendFlow,
    sendKycInvite,
  } = useStore();

  const { step, amountUsd, recipientId, cashOutMethod } = sendFlow;

  // Local state
  const [amountInput, setAmountInput] = useState(amountUsd > 0 ? String(amountUsd) : '');
  const [confirming, setConfirming] = useState(false);
  const [completedTx, setCompletedTx] = useState<{
    id: string;
    pickupCode?: string;
    referenceNumber: string;
    recipientName: string;
    amountDop: number;
    cashOutMethod: CashOutMethod;
  } | null>(null);
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);

  // KYC invite state
  const [kycInviteSent, setKycInviteSent] = useState(false);

  const amount = parseFloat(amountInput) || 0;
  const fee = getPlatayaFee(amount);
  const totalCost = amount + fee + NETWORK_FEE;
  const recipientGets = amount * EXCHANGE_RATE;
  const selectedRecipient = recipients.find((r) => r.id === recipientId);
  const balance = user.balanceUsd;

  // Reset flow on unmount
  useEffect(() => {
    return () => {
      resetSendFlow();
    };
  }, [resetSendFlow]);

  function goToStep(target: number) {
    setAnimDir(target > step ? 'forward' : 'back');
    setAnimating(true);
    setTimeout(() => {
      setSendStep(target);
      setAnimating(false);
    }, 150);
  }

  function handleAmountContinue() {
    setSendAmount(amount);
    goToStep(2);
  }

  function handleRecipientContinue() {
    if (!recipientId) return;
    if (cashOutMethod === 'atm' && selectedRecipient?.kycStatus === 'none') return;
    if (cashOutMethod === 'atm' && (selectedRecipient?.kycStatus as string) === 'pending') return;
    goToStep(3);
  }

  function handleConfirm() {
    setConfirming(true);
    setTimeout(() => {
      const tx = confirmSend();
      setCompletedTx({
        id: tx.id,
        pickupCode: tx.pickupCode,
        referenceNumber: tx.referenceNumber,
        recipientName: tx.recipientName,
        amountDop: tx.amountDop,
        cashOutMethod: sendFlow.cashOutMethod,
      });
      setConfirming(false);
    }, 1500);
  }

  function handleSendKycInvite() {
    if (!recipientId) return;
    sendKycInvite(recipientId);
    setKycInviteSent(true);
  }

  // Determine animation class
  const stepAnimClass = animating
    ? 'opacity-0 translate-y-2'
    : 'opacity-100 translate-y-0';

  // ── Success State ──
  if (completedTx) {
    return (
      <div className="max-w-lg mx-auto animate-fade-up">
        <div className="card text-center py-10">
          {/* Green checkmark */}
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-brand-navy mb-2">Money Sent!</h2>
          <p className="text-gray-500 text-sm mb-8">
            {completedTx.cashOutMethod === 'bank'
              ? <>Deposited to {completedTx.recipientName}&apos;s bank account</>
              : <>{completedTx.recipientName} will receive{' '}
                <span className="font-semibold text-brand-navy">{formatDop(completedTx.amountDop)}</span></>
            }
          </p>

          <div className="bg-surface-50 rounded-xl p-5 mb-6 space-y-3 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono text-brand-navy text-xs">{completedTx.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reference Number</span>
              <span className="font-mono text-brand-navy text-xs">{completedTx.referenceNumber}</span>
            </div>
            {completedTx.pickupCode && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">ATM Pickup Code</span>
                <span className="font-mono text-xl font-bold text-brand-teal tracking-widest">
                  {completedTx.pickupCode}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Estimated Arrival</span>
              <span className="font-medium text-brand-navy">
                {completedTx.cashOutMethod === 'bank' ? '~30 minutes' : '~15 minutes'}
              </span>
            </div>
          </div>

          {completedTx.pickupCode && (
            <p className="text-xs text-gray-400 mb-6">
              The 6-digit pickup code has been sent via SMS to the recipient.
            </p>
          )}
          {completedTx.cashOutMethod === 'bank' && (
            <p className="text-xs text-gray-400 mb-6">
              The deposit will be credited to the recipient&apos;s bank account shortly.
            </p>
          )}

          <Link href="/dashboard" className="btn-primary inline-block w-full text-center">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Progress Bar ──
  const progressBar = (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isComplete = step > stepNum;
          return (
            <button
              key={label}
              onClick={() => {
                if (isComplete) goToStep(stepNum);
              }}
              disabled={!isComplete}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-brand-blue'
                  : isComplete
                  ? 'text-brand-teal cursor-pointer hover:text-brand-blue'
                  : 'text-gray-300'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                    : isComplete
                    ? 'bg-brand-teal text-white'
                    : 'bg-surface-200 text-gray-400'
                }`}
              >
                {isComplete ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stepNum
                )}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
      {/* Progress track */}
      <div className="h-1 bg-surface-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-blue to-brand-teal rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );

  // ── Step 1: Amount ──
  const step1 = (
    <div className={`transition-all duration-300 ease-out ${stepAnimClass}`}>
      <div className="card mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-6 text-center">
          How much would you like to send?
        </p>

        {/* USD Input */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl text-gray-300 font-light">$</span>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="0.00"
            min="1"
            step="0.01"
            className="text-5xl font-bold text-brand-navy text-center bg-transparent outline-none w-48 placeholder:text-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <p className="text-center text-xs text-gray-400 mb-6">
          Balance: {formatUsd(balance)}
        </p>

        {/* DOP Conversion */}
        {amount > 0 && (
          <div className="bg-surface-50 rounded-xl p-4 mb-6 animate-fade-in">
            <p className="text-center text-sm text-gray-500 mb-1">Recipient gets</p>
            <p className="text-center text-3xl font-bold text-brand-teal">
              {formatDop(recipientGets)}
            </p>
            <p className="text-center text-xs text-gray-400 mt-1">
              1 USD = {EXCHANGE_RATE.toFixed(2)} DOP
            </p>
          </div>
        )}

        {/* Pipeline: USD → USDC → DOP */}
        <div className="flex items-center justify-center gap-3 py-4 mb-6">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-lg mb-1">
              $
            </div>
            <span className="text-[10px] text-gray-400 font-medium">USD</span>
          </div>
          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-1">
              <svg className="w-5 h-5 text-brand-blue" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" opacity="0.2" />
                <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">U</text>
              </svg>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">USDC</span>
          </div>
          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-lg mb-1">
              RD$
            </div>
            <span className="text-[10px] text-gray-400 font-medium">DOP</span>
          </div>
        </div>

        {/* Fee Breakdown */}
        {amount > 0 && (
          <div className="border-t border-surface-200 pt-4 space-y-2.5 text-sm animate-fade-in">
            <div className="flex justify-between">
              <span className="text-gray-500">PlataYa fee</span>
              <span className="font-medium text-brand-navy">{formatUsd(fee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Network fee</span>
              <span className="font-medium text-brand-navy">{formatUsd(NETWORK_FEE)}</span>
            </div>
            <div className="flex justify-between border-t border-surface-100 pt-2.5">
              <span className="font-semibold text-brand-navy">Total cost</span>
              <span className="font-bold text-brand-navy">{formatUsd(totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-brand-teal">Recipient gets</span>
              <span className="font-bold text-brand-teal">{formatDop(recipientGets)}</span>
            </div>
          </div>
        )}
      </div>

      {amount > balance && (
        <p className="text-red-500 text-xs text-center mb-4">
          Insufficient balance. You have {formatUsd(balance)} available.
        </p>
      )}

      <button
        className="btn-primary w-full"
        disabled={amount < 1 || amount > balance}
        onClick={handleAmountContinue}
      >
        Continue
      </button>
    </div>
  );

  // ── Step 2: Recipient ──
  const step2 = (
    <div className={`transition-all duration-300 ease-out ${stepAnimClass}`}>
      {/* Recipient List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-brand-navy">Select Recipient</h3>
          <Link
            href="/dashboard/recipients/new"
            className="text-brand-blue text-xs font-semibold hover:underline flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New
          </Link>
        </div>

        {recipients.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400 text-sm mb-4">No recipients yet</p>
            <Link href="/dashboard/recipients/new" className="btn-primary inline-block">
              Add Recipient
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recipients.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSendRecipient(r.id);
                  setKycInviteSent(false);
                }}
                className={`card w-full text-left flex items-center gap-4 transition-all duration-200 ${
                  recipientId === r.id
                    ? 'ring-2 ring-brand-blue border-brand-blue'
                    : 'hover:border-surface-200 hover:shadow-md'
                }`}
              >
                <div className="w-11 h-11 bg-brand-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-blue font-bold text-sm">
                    {r.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-brand-navy">{r.fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{r.phone}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <KycBadge status={r.kycStatus} />
                  <span className="text-[10px] text-gray-400 capitalize">
                    {r.preferredMethod === 'atm' ? 'ATM' : r.preferredMethod === 'bank' ? 'Bank' : 'Agent'}
                  </span>
                </div>
                {recipientId === r.id && (
                  <div className="w-5 h-5 bg-brand-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cash-Out Method */}
      {recipientId && (
        <div className="mb-6 animate-fade-up">
          <h3 className="text-sm font-semibold text-brand-navy mb-3">Cash-Out Method</h3>
          <div className="grid grid-cols-3 gap-3">
            {/* ATM Card */}
            <button
              onClick={() => setSendMethod('atm')}
              className={`card text-left p-4 transition-all duration-200 ${
                cashOutMethod === 'atm'
                  ? 'ring-2 ring-brand-blue border-brand-blue'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <rect x="6" y="8" width="4" height="4" rx="0.5" />
                  <line x1="14" y1="9" x2="18" y2="9" />
                  <line x1="14" y1="13" x2="18" y2="13" />
                  <line x1="6" y1="17" x2="18" y2="17" />
                </svg>
              </div>
              <p className="font-semibold text-sm text-brand-navy mb-1">ATM Pickup</p>
              <p className="text-[11px] text-gray-400 leading-snug">
                Recipient gets a 6-digit code via SMS to withdraw at any ATM
              </p>
            </button>

            {/* Agent Card */}
            <button
              onClick={() => setSendMethod('agent')}
              className={`card text-left p-4 transition-all duration-200 ${
                cashOutMethod === 'agent'
                  ? 'ring-2 ring-brand-blue border-brand-blue'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l7-4 7 4v14" />
                  <rect x="9" y="13" width="6" height="8" rx="0.5" />
                  <rect x="9" y="9" width="6" height="2" rx="0.5" />
                </svg>
              </div>
              <p className="font-semibold text-sm text-brand-navy mb-1">Agent Pickup</p>
              <p className="text-[11px] text-gray-400 leading-snug">
                Recipient picks up cash at any Caribe Express with their c&eacute;dula
              </p>
            </button>

            {/* Bank Card */}
            <button
              onClick={() => setSendMethod('bank')}
              className={`card text-left p-4 transition-all duration-200 ${
                cashOutMethod === 'bank'
                  ? 'ring-2 ring-brand-blue border-brand-blue'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/></svg>
              </div>
              <p className="font-semibold text-sm text-brand-navy mb-1">Bank Deposit</p>
              <p className="text-[11px] text-gray-400 leading-snug">
                Direct deposit to any bank account in the Dominican Republic
              </p>
            </button>
          </div>
        </div>
      )}

      {/* KYC Gate for ATM + no KYC — send invite to recipient */}
      {recipientId && cashOutMethod === 'atm' && selectedRecipient?.kycStatus === 'none' && !kycInviteSent && (
        <div className="card mb-6 animate-fade-up border-brand-gold/30 bg-amber-50/30">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-brand-gold/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-brand-navy">Recipient Verification Needed</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                ATM pickups require {selectedRecipient.fullName} to verify their identity. We&apos;ll send them an SMS with a link to complete verification on their phone (selfie + c&eacute;dula photo).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-navy">Sending verification to:</p>
                <p className="text-xs text-gray-500">{selectedRecipient.phone}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSendKycInvite}
            className="btn-primary w-full"
          >
            Send Verification Link via SMS
          </button>
        </div>
      )}

      {/* KYC invite sent / pending — waiting for recipient to complete */}
      {recipientId && cashOutMethod === 'atm' && (kycInviteSent || (selectedRecipient?.kycStatus as string) === 'pending') && (selectedRecipient?.kycStatus as string) !== 'verified' && (
        <div className="card mb-6 animate-fade-in">
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-[3px] border-brand-blue border-t-transparent animate-spin" />
            <p className="font-semibold text-sm text-brand-navy mb-1">Waiting for {selectedRecipient?.fullName}</p>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
              Verification link sent to {selectedRecipient?.phone}. They need to take a selfie and photo of their c&eacute;dula. Usually takes 2-3 minutes.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 pt-3 border-t border-surface-100">
            <button className="text-xs text-brand-blue font-medium hover:underline" onClick={handleSendKycInvite}>
              Resend SMS
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-400">Auto-refreshes when complete</span>
          </div>
        </div>
      )}

      {/* KYC just verified */}
      {recipientId && cashOutMethod === 'atm' && selectedRecipient?.kycStatus === 'verified' && kycInviteSent && (
        <div className="card mb-6 animate-fade-in bg-emerald-50/50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-emerald-700">{selectedRecipient.fullName} is verified!</p>
              <p className="text-xs text-emerald-600/70">Identity confirmed. You can proceed with the transfer.</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button className="btn-ghost flex-shrink-0" onClick={() => goToStep(1)}>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </span>
        </button>
        <button
          className="btn-primary flex-1"
          disabled={
            !recipientId ||
            (cashOutMethod === 'atm' && selectedRecipient?.kycStatus === 'none') ||
            (cashOutMethod === 'atm' && (selectedRecipient?.kycStatus as string) === 'pending')
          }
          onClick={handleRecipientContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );

  // ── Step 3: Review & Confirm ──
  const step3 = (
    <div className={`transition-all duration-300 ease-out ${stepAnimClass}`}>
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5 text-center">
          Review Your Transfer
        </h3>

        {/* Amount Hero */}
        <div className="text-center mb-6 pb-6 border-b border-surface-200">
          <p className="text-sm text-gray-500 mb-1">You send</p>
          <p className="text-4xl font-bold text-brand-navy mb-1">{formatUsd(amountUsd)}</p>
          <p className="text-sm text-gray-400">
            <svg className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            {formatDop(amountUsd * EXCHANGE_RATE)} at {EXCHANGE_RATE.toFixed(2)} DOP/USD
          </p>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Recipient</span>
            <span className="font-semibold text-brand-navy">{selectedRecipient?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cash-out method</span>
            <span className="font-medium text-brand-navy">
              {cashOutMethod === 'atm' ? 'ATM Pickup' : cashOutMethod === 'bank' ? 'Bank Deposit' : 'Agent Pickup'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Exchange rate</span>
            <span className="font-medium text-brand-navy">1 USD = {EXCHANGE_RATE.toFixed(2)} DOP</span>
          </div>

          <div className="border-t border-surface-100 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Transfer amount</span>
              <span className="font-medium text-brand-navy">{formatUsd(amountUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PlataYa fee</span>
              <span className="font-medium text-brand-navy">{formatUsd(getPlatayaFee(amountUsd))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Network fee</span>
              <span className="font-medium text-brand-navy">{formatUsd(NETWORK_FEE)}</span>
            </div>
          </div>

          <div className="border-t border-surface-200 pt-3 flex justify-between">
            <span className="font-bold text-brand-navy">Total</span>
            <span className="font-bold text-brand-navy">
              {formatUsd(amountUsd + getPlatayaFee(amountUsd) + NETWORK_FEE)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-brand-teal">Recipient gets</span>
            <span className="font-bold text-brand-teal">{formatDop(amountUsd * EXCHANGE_RATE)}</span>
          </div>
        </div>

        {/* Estimated Arrival */}
        <div className="mt-5 bg-surface-50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-navy">Estimated Arrival</p>
            <p className="text-xs text-gray-400">~15 minutes</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="btn-ghost flex-shrink-0" onClick={() => goToStep(2)}>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </span>
        </button>
        <button
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          onClick={handleConfirm}
          disabled={confirming}
        >
          {confirming ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>Confirm & Send {formatUsd(amountUsd + getPlatayaFee(amountUsd) + NETWORK_FEE)}</>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-brand-navy mb-1">Send Money</h1>
      <p className="text-sm text-gray-400 mb-6">US to Dominican Republic &middot; Fast &amp; affordable</p>
      {progressBar}
      {step === 1 && step1}
      {step === 2 && step2}
      {step === 3 && step3}
    </div>
  );
}
